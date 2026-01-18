# Rendering Strategy: Hybrid SSR + CSR Architecture

## Overview

This document defines the hybrid rendering architecture for KMLA Online using React Router v7 (RRv7). The strategy balances:
- **Fast first paint** for public content
- **No auth flicker** for authenticated routes
- **Real-time UX** where beneficial
- **Security-first** with RLS as the source of truth

---

## Route Categories

### Category A: PUBLIC SSR
**Purpose:** Fast first paint + share previews for public content

**Characteristics:**
- Loader fetches data server-side
- Full HTML returned on first request
- No auth required (but may enhance with user context if present)
- Good for SEO and social sharing
- Client hydrates and can revalidate

**Auth Enforcement:** None required (RLS allows public read)

**Data Strategy:** Loader-only OR loader + optional client revalidation

**Examples:** Board list, search results, public board feeds, post detail (public boards)

---

### Category B: AUTH SSR BOOTSTRAP
**Purpose:** Guaranteed no auth flicker for authenticated experiences

**Characteristics:**
- Root/layout loader MUST fetch session first
- If no session, redirect to login before rendering
- Loader fetches user-specific data server-side
- Full HTML with user context returned
- Protected by server-side auth check

**Auth Enforcement:** Loader (server redirect if not authenticated)

**Data Strategy:** Loader-only (session + data fetched server-side)

**Examples:** Profile, submit forms, admin pages, member management

---

### Category C: APP SHELL
**Purpose:** CSR navigation after hydration with SSR initial load

**Characteristics:**
- Initial request SSRs the page shell + initial data
- After hydration, navigation is client-side (SPA-like)
- Loaders still run (on client navigation, revalidation)
- Good for frequently changing data that benefits from client updates

**Auth Enforcement:** Loader (may redirect OR render public shell)

**Data Strategy:** Loader for initial + client revalidation (poll/refetch)

**Examples:** Home page (today's songs), booking grids, board feeds

---

### Category D: REALTIME-HEAVY
**Purpose:** CSR-first with live updates via Supabase subscriptions

**Characteristics:**
- Loader provides initial snapshot
- Client subscribes to Supabase Realtime after hydration
- Updates push to client without page refresh
- Uses consistent client helper (`lib/client.js`)
- Still protected by RLS (anon key + user session)

**Auth Enforcement:** Loader checks auth, client uses user session for subscriptions

**Data Strategy:** Loader for initial + client Realtime subscription

**Examples:** Booking availability (live updates), join request inbox (notifications)

---

## Non-Negotiable Security Rules

### 1. All Data Access Enforced by Supabase RLS
- Every query (server or client) goes through RLS
- No service role key on client EVER
- Server actions use service role only for admin operations

### 2. Client-Side Supabase Rules (if permitted)
```typescript
// ALLOWED:
import { createClient } from '~/lib/client';
const supabase = createClient(); // Uses anon key + user session

// NEVER ALLOWED:
import { createClient } from '@supabase/supabase-js';
createClient(url, SERVICE_ROLE_KEY); // NEVER on client
```

### 3. Mutations Must Go Through Actions
- Form submissions → RRv7 actions
- Direct client Supabase writes only if:
  - Protected by RLS (user can only write their own data)
  - Uses consistent client helper
  - Explicitly justified in route documentation

### 4. Session Must Be Server-Established
- Root loader fetches session from cookies
- Session passed to client via loader data
- Client never establishes session independently

---

## Route Decision Table

### Existing Routes

| Route | Category | Auth Enforcement | Data Strategy | Notes |
|-------|----------|------------------|---------------|-------|
| `/` | C (App Shell) | Loader (optional) | Loader initial + client poll | Today's songs refresh; show logged-in user's submissions |
| `/gongang_other` | D (Realtime) | Loader (required) | Loader + Realtime subscription | Live booking grid updates |
| `/profile` | B (Auth SSR) | Loader (redirect) | Loader-only | Must see own profile; redirect if not logged in |
| `/search` | A (Public SSR) | None | Loader-only | Public search results; SEO-friendly |
| `/submitsong` | B (Auth SSR) | Loader (redirect) | Loader-only | Submit form requires auth |
| `/boards` | A (Public SSR) | Loader (optional) | Loader + client revalidation | Public list; membership status if logged in |
| `/boards/request` | B (Auth SSR) | Action (check in action) | Action-only | Form submission requires auth |
| `/boards/:name` | A (Public SSR) | Loader (conditional) | Loader-only | Placeholder → will become `/boards/:slug` |

### Planned Routes (Boards & Membership)

| Route | Category | Auth Enforcement | Data Strategy | Notes |
|-------|----------|------------------|---------------|-------|
| `/boards/:slug` | A/C (Hybrid) | Loader (conditional) | Loader + client revalidation | Public boards: SSR; Private: require membership |
| `/boards/:slug/join` | B (Auth SSR) | Action (required) | Action-only | POST only; requires auth |
| `/boards/:slug/members` | B (Auth SSR) | Loader (required) | Loader + client revalidation | Members see list; admins see pending requests |
| `/boards/:slug/settings` | B (Auth SSR) | Loader (admin check) | Loader-only | Admin/owner only |
| `/posts/new` | B (Auth SSR) | Loader (required) | Loader-only | Member of at least one board |
| `/posts/:id` | A/C (Hybrid) | Loader (conditional) | Loader-only | Public boards: SSR; Private: require membership |
| `/my-boards` | B (Auth SSR) | Loader (redirect) | Loader-only | User's board memberships |
| `/join-requests` | B (Auth SSR) | Loader (admin check) | Loader + client poll | Admin inbox; poll for new requests |

---

## Category Assignment Details

### `/` - Home (기상송)
**Category:** C (App Shell)

**Why:** Today's songs change throughout the day; users submit and see updates. Initial SSR for fast first paint, then client revalidation for fresh data.

**Auth Flow:**
1. Root loader fetches session (if cookie present)
2. Home loader fetches today's approved songs (public)
3. If logged in, also fetch user's pending submissions
4. Client can poll/revalidate for updates

**Data Strategy:**
```
Server: Loader → { todaySongs, userSubmissions? }
Client: useRevalidator() on interval OR after submit
```

---

### `/gongang_other` - Booking Grid
**Category:** D (Realtime)

**Why:** Multiple users booking simultaneously; need live updates to avoid double-booking conflicts.

**Auth Flow:**
1. Root loader verifies session
2. If not authenticated, redirect to login
3. Booking loader fetches current week's bookings
4. Client subscribes to `gongang_bookings` changes

**Data Strategy:**
```
Server: Loader → { bookings, freeBookings, karaokeBookings }
Client: supabase.channel('bookings').on('postgres_changes', ...)
```

**Allowed Client Query:**
```typescript
// Subscription only - initial data from loader
const channel = supabase
  .channel('booking-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'gongang_bookings'
  }, handleUpdate)
  .subscribe();
```

---

### `/profile` - User Profile
**Category:** B (Auth SSR Bootstrap)

**Why:** User must be logged in to see their profile. No public access. Prevent auth flicker.

**Auth Flow:**
1. Root loader fetches session
2. If no session, redirect to `/login`
3. Profile loader fetches user's profile by `auth.uid()`
4. Full page SSR with profile data

**Data Strategy:**
```
Server: Loader → { profile } (redirect if no session)
Client: Form submission → Action for edits
```

---

### `/search` - Committee Search
**Category:** A (Public SSR)

**Why:** Search results are public; good for SEO; shareable URLs with query params.

**Auth Flow:**
1. No auth required
2. Loader fetches search results based on `?q=` param
3. Full SSR response

**Data Strategy:**
```
Server: Loader → { results, query }
Client: Form submission navigates with new query
```

---

### `/submitsong` - Song Submission
**Category:** B (Auth SSR Bootstrap)

**Why:** Only logged-in users can submit songs. Form requires user context.

**Auth Flow:**
1. Root loader fetches session
2. If no session, redirect to `/login`
3. Loader can pre-fetch user's existing submissions for the day
4. Action handles form submission

**Data Strategy:**
```
Server: Loader → { existingSubmissions? } (redirect if no session)
Client: Form → Action → redirect on success
```

---

### `/boards` - Board List
**Category:** A (Public SSR)

**Why:** Board list is public. Fast first paint. Can enhance with membership status if logged in.

**Auth Flow:**
1. Loader fetches all active boards (public)
2. If session present, LEFT JOIN membership status
3. Full SSR

**Data Strategy:**
```
Server: Loader → { boards, myMemberships? }
Client: Can revalidate after join/leave
```

---

### `/boards/:slug` - Board Feed
**Category:** A/C (Hybrid - Public: A, Private: C)

**Why:** Public boards should SSR for SEO. Private boards need auth check.

**Auth Flow:**
1. Loader fetches board by slug
2. If `is_public = true`: Fetch posts (RLS allows)
3. If `is_public = false`: Check membership, redirect if not member
4. SSR with posts

**Data Strategy:**
```
Server: Loader → { board, posts, myMembership? }
Client: Revalidate on post creation, can poll for updates
```

**Conditional Logic:**
```typescript
// In loader
const board = await getBoard(slug);
if (!board.is_public && !isMember) {
  throw redirect('/boards'); // or show "join to view"
}
```

---

### `/boards/:slug/members` - Member Management
**Category:** B (Auth SSR Bootstrap)

**Why:** Only members can view member list. Admins see pending requests.

**Auth Flow:**
1. Verify session
2. Verify membership in board
3. Fetch members list
4. If admin, also fetch pending join requests

**Data Strategy:**
```
Server: Loader → { members, pendingRequests? }
Client: Action for approve/reject/remove
```

---

### `/join-requests` - Admin Inbox
**Category:** B (Auth SSR Bootstrap) with client polling

**Why:** Admin-only page. Could benefit from realtime but polling is simpler.

**Auth Flow:**
1. Verify session
2. Verify user is admin of at least one board
3. Fetch pending requests for all administered boards

**Data Strategy:**
```
Server: Loader → { pendingRequests }
Client: Poll every 30s OR Realtime subscription
```

---

## Supabase Client Usage Rules

### Server-Side (Loaders/Actions)
```typescript
// REQUIRED: Use SSR client with request cookies
import { createClient } from '~/lib/server';

export async function loader({ request }: LoaderArgs) {
  const supabase = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  // RLS uses session automatically
}
```

### Client-Side (Components)
```typescript
// ALLOWED: Only for Realtime subscriptions after initial load
import { createClient } from '~/lib/client';

export function BookingGrid({ initialData }: Props) {
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes - RLS enforces access
    const channel = supabase
      .channel('bookings')
      .on('postgres_changes', { event: '*', ... }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);
}
```

### NEVER Allowed
```typescript
// NEVER: Direct client queries for initial data
const { data } = await supabase.from('posts').select('*'); // NO!

// NEVER: Service role on client
createClient(url, process.env.SUPABASE_SERVICE_ROLE); // NEVER!

// NEVER: Bypassing RLS
supabase.rpc('admin_function'); // Only via server action
```

---

## Migration Path from Current State

### Phase 1: Consolidate Supabase Clients
- Remove `app/supabaseClient.js` and `app/supabase.js`
- Use only `lib/server.js` and `lib/client.js`
- Update all routes to use correct client

### Phase 2: Add Root Auth Bootstrap
- Create root layout with session loader
- Pass session to all child routes
- Implement redirect logic for Category B routes

### Phase 3: Convert Routes by Category
1. **Category A routes:** Add/fix loaders for SSR
2. **Category B routes:** Add auth checks, redirects
3. **Category C routes:** Add revalidation logic
4. **Category D routes:** Add Realtime subscriptions

### Phase 4: Remove Client-Side Initial Fetching
- Remove `useEffect` data fetching from routes
- Move all initial data to loaders
- Keep only subscriptions/revalidation on client

---

## Summary

| Category | Auth | Initial Load | Client Behavior | Use Case |
|----------|------|--------------|-----------------|----------|
| A (Public SSR) | Optional | Server loader | Hydrate only | SEO content |
| B (Auth SSR) | Required + redirect | Server loader | Forms → Actions | Protected pages |
| C (App Shell) | Optional/Required | Server loader | Revalidate/poll | Dynamic content |
| D (Realtime) | Required | Server loader | Subscribe | Live updates |

All categories share:
- Supabase RLS as source of truth
- Server loaders for initial data
- Actions for mutations
- Consistent client helper for any client-side queries
