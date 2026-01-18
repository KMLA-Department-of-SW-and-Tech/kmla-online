# Implementation Patterns

This document defines the canonical implementation patterns for the KMLA Online hybrid SSR+CSR architecture.

---

## Pattern 1: Auth Bootstrap

**Purpose:** Establish user session on the server to prevent auth flicker and enable secure data fetching.

### Root Layout Loader

The root layout loader MUST fetch the session before any child routes render.

```typescript
// app/root.tsx (or app/routes/_layout.tsx)
import { createClient } from '~/lib/server';
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);

  // Get session from cookies
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Session error:', error);
  }

  // If session exists, fetch essential user data
  let user = null;
  let profile = null;
  let defaultMemberships = null;

  if (session?.user) {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    profile = profileData;

    // Fetch default board memberships (for nav highlighting, etc.)
    const { data: memberships } = await supabase
      .from('board_memberships')
      .select('board_id, role, boards(name, slug)')
      .eq('user_id', session.user.id)
      .limit(10);

    defaultMemberships = memberships;

    user = {
      id: session.user.id,
      email: session.user.email,
    };
  }

  return {
    user,
    profile,
    defaultMemberships,
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  };
}
```

### Accessing Auth in Child Routes

Child route loaders receive the parent's context but should still verify auth independently for security.

```typescript
// app/routes/profile.tsx
import { createClient } from '~/lib/server';
import { redirect } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect if not authenticated (Category B route)
  if (!session) {
    throw redirect('/login?redirectTo=/profile');
  }

  // Fetch user-specific data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { profile };
}
```

### Client-Side Auth Context

Use a context provider to share auth state with components.

```typescript
// app/context/auth.tsx
import { createContext, useContext } from 'react';
import { useRouteLoaderData } from 'react-router';

type AuthContextType = {
  user: { id: string; email: string } | null;
  profile: { id: string; display_name: string; avatar_url: string } | null;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData('root') as {
    user: AuthContextType['user'];
    profile: AuthContextType['profile'];
  };

  const value = {
    user: rootData?.user ?? null,
    profile: rootData?.profile ?? null,
    isAuthenticated: !!rootData?.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Pattern 2: App Shell

**Purpose:** Layout route provides consistent shell; child routes handle content. Enables client-side navigation after initial SSR.

### Layout Route Structure

```
routes/
├── _app.tsx              # App shell layout (authenticated area)
├── _app.boards.tsx       # /boards (within app shell)
├── _app.boards.$slug.tsx # /boards/:slug
├── _public.tsx           # Public layout (no auth required)
├── _public.search.tsx    # /search
└── login.tsx             # Outside both layouts
```

### App Shell Layout

```typescript
// app/routes/_app.tsx
import { Outlet, useLoaderData, useNavigation } from 'react-router';
import { createClient } from '~/lib/server';
import { redirect } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // Require auth for all routes under _app
  if (!session) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${url.pathname}`);
  }

  // Fetch user's navigation data
  const { data: myBoards } = await supabase
    .from('board_memberships')
    .select('role, boards(id, name, slug)')
    .eq('user_id', session.user.id);

  return {
    myBoards,
  };
}

export default function AppShell() {
  const { myBoards } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state === 'loading';

  return (
    <div className="app-shell">
      <header>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/boards">Boards</NavLink>
          <NavLink to="/my-boards">My Boards</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        {isNavigating && <LoadingIndicator />}
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        {/* Footer content */}
      </footer>
    </div>
  );
}
```

### Child Route with Shell Data Access

```typescript
// app/routes/_app.my-boards.tsx
import { useLoaderData, useRouteLoaderData } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // Detailed board data for this page
  const { data: boards } = await supabase
    .from('boards')
    .select(`
      *,
      board_memberships!inner(role, joined_at, is_locked)
    `)
    .eq('board_memberships.user_id', session!.user.id)
    .eq('is_active', true);

  return { boards };
}

export default function MyBoards() {
  const { boards } = useLoaderData<typeof loader>();

  // Can also access parent layout data
  const appData = useRouteLoaderData('routes/_app') as { myBoards: any[] };

  return (
    <div>
      <h1>My Boards</h1>
      {boards.map(board => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}
```

---

## Pattern 3: Realtime Feed

**Purpose:** Loader provides initial data; client subscribes for live updates.

### Feed Component with Realtime

```typescript
// app/routes/_app.gongang.tsx
import { useLoaderData, useRevalidator } from 'react-router';
import { useEffect, useState } from 'react';
import { createClient } from '~/lib/client';

export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw redirect('/login');
  }

  // Fetch all booking tables
  const [gongang, free, karaoke] = await Promise.all([
    supabase.from('gongang_bookings').select('*').is('deleted_at', null),
    supabase.from('free_bookings').select('*').is('deleted_at', null),
    supabase.from('karaoke_bookings').select('*').is('deleted_at', null),
  ]);

  return {
    gongangBookings: gongang.data ?? [],
    freeBookings: free.data ?? [],
    karaokeBookings: karaoke.data ?? [],
  };
}

export default function BookingPage() {
  const loaderData = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // Local state for optimistic updates
  const [bookings, setBookings] = useState(loaderData.gongangBookings);

  // Sync with loader data on revalidation
  useEffect(() => {
    setBookings(loaderData.gongangBookings);
  }, [loaderData.gongangBookings]);

  // Subscribe to realtime changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gongang_bookings',
        },
        (payload) => {
          console.log('Realtime update:', payload);

          // Option 1: Revalidate via loader (simplest, consistent)
          revalidator.revalidate();

          // Option 2: Optimistic local update (faster, more complex)
          // handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [revalidator]);

  return (
    <div>
      <h1>Booking Grid</h1>
      <BookingGrid bookings={bookings} />
    </div>
  );
}
```

### Optimistic Updates Pattern

```typescript
function handleRealtimeUpdate(
  payload: RealtimePostgresChangesPayload<Booking>
) {
  switch (payload.eventType) {
    case 'INSERT':
      setBookings(prev => [...prev, payload.new]);
      break;
    case 'UPDATE':
      setBookings(prev =>
        prev.map(b => b.id === payload.new.id ? payload.new : b)
      );
      break;
    case 'DELETE':
      setBookings(prev =>
        prev.filter(b => b.id !== payload.old.id)
      );
      break;
  }
}
```

### Board Feed with Realtime Posts

```typescript
// app/routes/_app.boards.$slug.tsx
export async function loader({ request, params }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { slug } = params;

  // Fetch board with membership check (RLS handles access)
  const { data: board, error } = await supabase
    .from('boards')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !board) {
    throw new Response('Board not found', { status: 404 });
  }

  // Fetch posts (RLS handles visibility based on membership + is_public)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(display_name, avatar_url)
    `)
    .eq('board_id', board.id)
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  // Check user's membership
  const { data: { session } } = await supabase.auth.getSession();
  let myMembership = null;

  if (session) {
    const { data } = await supabase
      .from('board_memberships')
      .select('role, joined_at')
      .eq('board_id', board.id)
      .eq('user_id', session.user.id)
      .single();
    myMembership = data;
  }

  return { board, posts: posts ?? [], myMembership };
}

export default function BoardFeed() {
  const { board, posts, myMembership } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // Subscribe to new posts in this board
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`board-${board.id}-posts`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `board_id=eq.${board.id}`,
        },
        () => {
          // New post - revalidate to show it
          revalidator.revalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [board.id, revalidator]);

  return (
    <div>
      <BoardHeader board={board} membership={myMembership} />
      <PostList posts={posts} />
      {myMembership && <CreatePostButton boardId={board.id} />}
    </div>
  );
}
```

---

## Pattern 4: No-Flicker Redirects

**Purpose:** Prevent the UI from briefly showing unauthenticated state before redirecting.

### Server-Side Redirect (Preferred)

```typescript
// CORRECT: Redirect in loader before any rendering
export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Build redirect URL with return path
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
  }

  // User is authenticated, proceed with data loading
  return { /* data */ };
}
```

### Conditional Rendering Based on Auth

For routes that show different content based on auth (not redirects):

```typescript
// Category A route with optional auth enhancement
export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // Public data (always fetch)
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('is_active', true);

  // Auth-enhanced data (only if logged in)
  let myMemberships = null;
  if (session) {
    const { data } = await supabase
      .from('board_memberships')
      .select('board_id, role')
      .eq('user_id', session.user.id);
    myMemberships = data;
  }

  return {
    boards,
    myMemberships,
    isAuthenticated: !!session,
  };
}

export default function BoardList() {
  const { boards, myMemberships, isAuthenticated } = useLoaderData();

  return (
    <div>
      {boards.map(board => (
        <BoardCard
          key={board.id}
          board={board}
          myRole={myMemberships?.find(m => m.board_id === board.id)?.role}
          showJoinButton={isAuthenticated && !myMemberships?.find(m => m.board_id === board.id)}
        />
      ))}
    </div>
  );
}
```

### Protected Action Pattern

```typescript
// app/routes/boards.$slug.join.tsx
export async function action({ request, params }: ActionFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // MUST check auth in actions too
  if (!session) {
    throw redirect(`/login?redirectTo=/boards/${params.slug}`);
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'join') {
    // Check board join mode
    const { data: board } = await supabase
      .from('boards')
      .select('id, join_mode')
      .eq('slug', params.slug)
      .single();

    if (board?.join_mode === 'public') {
      // Direct join
      await supabase
        .from('board_memberships')
        .insert({
          board_id: board.id,
          user_id: session.user.id,
          role: 'member',
        });
    } else if (board?.join_mode === 'request') {
      // Create join request
      const message = formData.get('message') as string;
      await supabase
        .from('board_join_requests')
        .insert({
          board_id: board.id,
          user_id: session.user.id,
          message,
        });
    }
  }

  return redirect(`/boards/${params.slug}`);
}
```

---

## Pattern 5: Form Actions with Optimistic UI

**Purpose:** Provide instant feedback while mutation is in progress.

```typescript
// app/routes/_app.posts.new.tsx
import { useFetcher } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw redirect('/login');
  }

  const formData = await request.formData();
  const boardId = formData.get('boardId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // RLS will check membership
  const { data, error } = await supabase
    .from('posts')
    .insert({
      board_id: parseInt(boardId),
      user_id: session.user.id,
      title,
      content,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return redirect(`/posts/${data.id}`);
}

export default function NewPost() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';

  return (
    <fetcher.Form method="post">
      <input name="boardId" type="hidden" value={selectedBoardId} />

      <input
        name="title"
        placeholder="Title"
        disabled={isSubmitting}
        required
      />

      <textarea
        name="content"
        placeholder="Content"
        disabled={isSubmitting}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post'}
      </button>

      {fetcher.data?.error && (
        <p className="error">{fetcher.data.error}</p>
      )}
    </fetcher.Form>
  );
}
```

---

## Pattern 6: Consistent Supabase Client Usage

### Server Client (`lib/server.ts`)

```typescript
// app/lib/server.ts
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export function createClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append('Set-Cookie', serializeCookieHeader(name, value, options));
          });
        },
      },
    }
  );

  return supabase;
}
```

### Browser Client (`lib/client.ts`)

```typescript
// app/lib/client.ts
import { createBrowserClient } from '@supabase/ssr';

let supabase: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabase) return supabase;

  supabase = createBrowserClient(
    window.ENV.SUPABASE_URL,
    window.ENV.SUPABASE_ANON_KEY
  );

  return supabase;
}
```

### Usage Rules Summary

| Context | Import | Usage |
|---------|--------|-------|
| Loader | `~/lib/server` | `createClient(request)` |
| Action | `~/lib/server` | `createClient(request)` |
| Component (subscription) | `~/lib/client` | `createClient()` |
| Component (query) | NOT ALLOWED | Use loader data |
| Component (mutation) | Prefer Action | Or client with RLS |

---

## Anti-Patterns to Avoid

### 1. Client-Side Initial Fetch

```typescript
// BAD: Fetching data in useEffect
export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('table').select('*').then(({ data }) => setData(data));
  }, []);

  if (!data) return <Loading />;  // Flash of loading state!
  return <Content data={data} />;
}

// GOOD: Fetch in loader, hydrate with data
export async function loader({ request }) {
  const supabase = createClient(request);
  const { data } = await supabase.from('table').select('*');
  return { data };
}

export default function Page() {
  const { data } = useLoaderData();  // Immediate, no loading state
  return <Content data={data} />;
}
```

### 2. Auth Check in Component

```typescript
// BAD: Auth check causes flicker
export default function ProtectedPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;  // Flicker!
  }

  return <Content />;
}

// GOOD: Auth check in loader, redirect before render
export async function loader({ request }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw redirect('/login');
  return { /* data */ };
}
```

### 3. Mixed Client Patterns

```typescript
// BAD: Multiple client instantiation patterns
import { getSupabase } from '../supabaseClient';  // Old
import { supabase } from './supabase';            // Old singleton
import { createClient } from '~/lib/client';      // Correct

// GOOD: Single consistent import
import { createClient } from '~/lib/server';  // In loader/action
import { createClient } from '~/lib/client';  // In component (rare)
```

---

## Checklist for New Routes

When adding a new route, verify:

- [ ] Assigned to correct category (A/B/C/D)
- [ ] Auth enforcement matches category
- [ ] Loader uses `createClient(request)` from `~/lib/server`
- [ ] No client-side initial data fetching
- [ ] Actions check auth before mutations
- [ ] Realtime subscriptions (if any) use `~/lib/client`
- [ ] Redirects happen in loader (not component)
- [ ] Error states handled (try/catch in loader)
- [ ] Loading states use `useNavigation().state`
