# Routes Inventory

## Route Overview

| Route | File | Loader | Action | Status |
|-------|------|--------|--------|--------|
| `/` | `routes/home.jsx` | ❌ | ❌ | ⚠️ Uses client-side data fetching |
| `/gongang_other` | `routes/gongang_other.jsx` | ❌ | ❌ | ⚠️ Uses client-side data fetching |
| `/profile` | `routes/profile.jsx` | ✅ | ❌ | ✅ SSR-ready |
| `/search` | `routes/searchEasy.jsx` | ✅ | ❌ | ✅ SSR-ready |
| `/submitsong` | `routes/page.tsx` | ❌ | ❌ | ⚠️ Uses client-side data fetching |
| `/boards` | `routes/boards.jsx` | ✅ | ❌ | ✅ SSR-ready |
| `/boards/request` | `routes/boards-request.jsx` | ❌ | ✅ | ⚠️ Action uses raw fetch instead of server client |
| `/boards/:name` | `routes/board.jsx` | ❌ | ❌ | ⚠️ Empty placeholder page |

---

## Route Details

### 1. `/` - Home (기상송 Morning Music)
**File:** `routes/home.jsx`
- **Loader:** None
- **Action:** None
- **Data Access:** Client-side (`useEffect`)
- **Tables Used:**
  - `items` (select: id, name, url, date)
  - `items` (delete by id)
- **External APIs:** YouTube Data API v3 (video metadata)
- **Auth:** None (hardcoded user: "30기 고동재")
- **Issues:**
  - Client-side data fetching violates SSR pattern
  - Hardcoded user name
  - Uses old `getSupabase()` client pattern
  - API key exposed in code

---

### 2. `/gongang_other` - Gongang Booking System
**File:** `routes/gongang_other.jsx`
- **Loader:** None
- **Action:** None
- **Data Access:** Client-side (`useEffect`)
- **Tables Used:**
  - `bookings` (select all, insert)
  - `free_bookings` (select, insert) - via FreeBookingModal
  - `karaoke_bookings` (select, insert) - via KaraokeBookingModal
- **Fields Consumed:**
  - `bookings`: cls, day, place, purpose
  - `free_bookings`: day, time, place, purpose
  - `karaoke_bookings`: day, time, applicant
- **Auth:** None
- **Issues:**
  - Client-side data fetching
  - Uses old `supabase` import from `./supabase`
  - No user authentication
  - No ownership tracking

---

### 3. `/profile` - User Profile
**File:** `routes/profile.jsx`
- **Loader:** ✅ Yes (SSR)
- **Action:** None (edit button exists but not wired)
- **Data Access:** Server-side loader
- **Tables Used:**
  - `profile` (select all, limit 1)
- **Fields Consumed:**
  - `profile`: name, introduce, phone_number, email
- **Auth:** None (no user filtering)
- **Issues:**
  - Selects first profile without user-specific filtering
  - No authentication
  - Edit functionality not implemented
  - Missing user_id foreign key assumption

---

### 4. `/search` - Administrative Committee Search (행정위원회)
**File:** `routes/searchEasy.jsx`
- **Loader:** ✅ Yes (SSR with query params)
- **Action:** None
- **Data Access:** Server-side loader
- **Tables Used:**
  - `group` (select: id, title, description, writer, created_at)
- **Query Features:**
  - Search by: title, description, writer (ilike)
  - Sort: latest (created_at desc) or relevance (client-side scoring)
  - Client-side state: recent searches (localStorage)
- **Auth:** None
- **Issues:**
  - Table name `group` is a reserved SQL keyword
  - No `updated_at` field
  - `created_at` parsing is complex due to timezone handling
  - Client-side sorting for relevance (should be in DB)

---

### 5. `/submitsong` - Submit Song
**File:** `routes/page.tsx`
- **Loader:** None
- **Action:** None
- **Data Access:** Client-side
- **Tables Used:**
  - `items` (insert: title, url, date)
- **External APIs:** YouTube Search API v3
- **Auth:** None (hardcoded user: "30기 고동재")
- **Issues:**
  - Client-side data fetching
  - Hardcoded user name
  - API key exposed in code (`AIzaSyBrAr6dxzLvW8t8apB3hw_-Fucn1nzcOvk`)
  - Duplicate insert logic in two places
  - Uses `createClient()` from `~/lib/client`
  - Field inconsistency: `title` field stores user name, not song title

---

### 6. `/boards` - Boards List
**File:** `routes/boards.jsx`
- **Loader:** ✅ Yes (SSR)
- **Action:** None
- **Data Access:** Server-side loader
- **Tables Used:**
  - `boards` (select: id, name, section, side, position)
- **Features:**
  - Groups by section: "notice", "favorite"
  - Groups by side: "left", "right" (for notices)
  - Orders by position (ascending)
- **Auth:** None
- **Issues:**
  - No actual board content/posts data
  - Navigation links to individual boards not fully implemented

---

### 7. `/boards/request` - Request New Board
**File:** `routes/boards-request.jsx`
- **Loader:** None
- **Action:** ✅ Yes (Form submission)
- **Data Access:** Action uses raw `fetch` instead of Supabase client
- **Tables Used:**
  - `board_requests` (insert: name, description, reason, created_at)
- **Auth:** None
- **Issues:**
  - Uses raw fetch with hardcoded credentials
  - Hardcoded Supabase URL and anon key in code
  - Should use server-side Supabase client
  - No user tracking (who requested)
  - `created_at` manually set instead of DB default

---

### 8. `/boards/:name` - Individual Board View
**File:** `routes/board.jsx`
- **Loader:** None
- **Action:** None
- **Data Access:** None (empty page)
- **Tables Used:** None
- **Issues:**
  - Placeholder page with no implementation
  - No posts/content model
  - Params only used for display title

---

## Supporting Components (Non-Routes)

### BookingModal.jsx
- **Tables:** `bookings` (select, insert)
- **Fields:** cls, day, place, purpose
- **Client:** `./supabase` import

### FreeBookingModal.jsx
- **Tables:** `free_bookings` (select, insert)
- **Fields:** day, time, place, purpose
- **Client:** `./supabase` import

### KaraokeBookingModal.jsx
- **Tables:** `karaoke_bookings` (select, insert)
- **Fields:** day, time, applicant
- **Client:** `./supabase` import

---

## Supabase Client Patterns (Inconsistent!)

1. **`app/supabaseClient.js`** - `getSupabase()` using `@supabase/supabase-js`
2. **`app/supabase.js`** - `supabase` singleton using `@supabase/supabase-js`
3. **`app/lib/client.js`** - `createClient()` using `@supabase/ssr` (browser)
4. **`app/lib/server.js`** - `createClient(request)` using `@supabase/ssr` (server)

**Usage by file:**
- `routes/home.jsx` → `getSupabase()` from `../supabaseClient`
- `routes/gongang_other.jsx` → `supabase` from `./supabase`
- `routes/page.tsx` → `createClient()` from `~/lib/client`
- `routes/profile.jsx` → `createClient(request)` from `../lib/server.js`
- `routes/searchEasy.jsx` → `createClient(request)` from `../lib/server`
- `routes/boards.jsx` → `createClient(request)` from `../lib/server`
- `BookingModal.jsx` → `supabase` from `./supabase`
- `FreeBookingModal.jsx` → `supabase` from `./supabase`
- `KaraokeBookingModal.jsx` → `supabase` from `./supabase`

**Correct Pattern:**
- **Server-side (loaders/actions):** Use `createClient(request)` from `lib/server.js`
- **Client-side (if unavoidable):** Use `createClient()` from `lib/client.js`

---

## Planned Routes (Boards & Membership)

The following routes are planned but not yet implemented. They support the new boards membership system.

### Route Overview (Planned)

| Route | File (Proposed) | Loader | Action | Status |
|-------|-----------------|--------|--------|--------|
| `/boards` | `routes/boards.jsx` | ✅ | ❌ | ⚠️ EXISTS but needs membership data |
| `/boards/:slug` | `routes/board.$slug.jsx` | ✅ | ❌ | 🔜 PLANNED |
| `/boards/:slug/join` | `routes/board.$slug.join.jsx` | ❌ | ✅ | 🔜 PLANNED |
| `/boards/:slug/members` | `routes/board.$slug.members.jsx` | ✅ | ✅ | 🔜 PLANNED |
| `/boards/:slug/settings` | `routes/board.$slug.settings.jsx` | ✅ | ✅ | 🔜 PLANNED |
| `/posts/new` | `routes/posts.new.jsx` | ✅ | ✅ | 🔜 PLANNED |
| `/posts/:id` | `routes/posts.$id.jsx` | ✅ | ✅ | 🔜 PLANNED |
| `/my-boards` | `routes/my-boards.jsx` | ✅ | ❌ | 🔜 PLANNED |
| `/join-requests` | `routes/join-requests.jsx` | ✅ | ✅ | 🔜 PLANNED |

---

### Planned Route Details

#### `/boards` - Boards List (UPDATE EXISTING)
**File:** `routes/boards.jsx`
- **Loader:** ✅ Yes (SSR) - needs update
- **Action:** None
- **Data Access:** Server-side loader
- **Tables Used:**
  - `boards` (select: id, name, slug, section, side, position, join_mode, is_public)
  - `board_memberships` (left join for current user's membership status)
- **Query Shape:**
  ```sql
  SELECT b.*, bm.role as my_role
  FROM boards b
  LEFT JOIN board_memberships bm ON bm.board_id = b.id AND bm.user_id = auth.uid()
  WHERE b.is_active = true
  ORDER BY b.section, b.position;
  ```
- **Auth:** Optional (shows boards, membership status if logged in)
- **Updates Needed:**
  - Add membership status to loader
  - Show join button for non-members
  - Show member count
  - Differentiate public/private boards visually

---

#### `/boards/:slug` - Board Detail/Feed
**File:** `routes/board.$slug.jsx` (NEW)
- **Loader:** ✅ Yes (SSR)
- **Action:** None
- **Data Access:** Server-side loader
- **Tables Used:**
  - `boards` (select by slug)
  - `posts` (select where board_id, not deleted)
  - `board_memberships` (current user's membership)
  - `profiles` (join for author names)
- **Query Shape:**
  ```sql
  -- Board info
  SELECT * FROM boards WHERE slug = :slug AND is_active = true;

  -- Posts (RLS handles visibility)
  SELECT p.*, pr.display_name, pr.avatar_url
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE p.board_id = :board_id AND p.is_deleted = false
  ORDER BY p.is_pinned DESC, p.created_at DESC
  LIMIT 20;
  ```
- **Auth:** Required for private boards, optional for public
- **Features:**
  - Show board info (name, description, member count)
  - List posts with pagination
  - "Create Post" button for members
  - "Join" button for non-members (if public/request mode)
  - "Request to Join" for request-mode boards

---

#### `/boards/:slug/join` - Join Board Action
**File:** `routes/board.$slug.join.jsx` (NEW)
- **Loader:** None
- **Action:** ✅ Yes
- **Data Access:** Server-side action
- **Tables Used:**
  - `boards` (check join_mode)
  - `board_memberships` (insert for public)
  - `board_join_requests` (insert for request mode)
- **Auth:** Required
- **Action Logic:**
  ```
  1. Check board exists and is active
  2. Check user not already member
  3. If join_mode = 'public': INSERT INTO board_memberships
  4. If join_mode = 'request': INSERT INTO board_join_requests
  5. If join_mode = 'invite_only': Return error
  6. Redirect to board page
  ```

---

#### `/boards/:slug/members` - Board Members Management
**File:** `routes/board.$slug.members.jsx` (NEW)
- **Loader:** ✅ Yes (SSR)
- **Action:** ✅ Yes
- **Data Access:** Server-side
- **Tables Used:**
  - `boards` (verify slug)
  - `board_memberships` (list members)
  - `board_join_requests` (pending requests for admins)
  - `profiles` (member info)
- **Auth:** Required, must be member (full list for admins)
- **Features (Members):**
  - View member list
  - See member roles
- **Features (Admins):**
  - Pending join requests inbox
  - Approve/reject requests
  - Change member roles
  - Remove members
  - Invite users (invite_only boards)

---

#### `/boards/:slug/settings` - Board Settings
**File:** `routes/board.$slug.settings.jsx` (NEW)
- **Loader:** ✅ Yes (SSR)
- **Action:** ✅ Yes
- **Data Access:** Server-side
- **Tables Used:**
  - `boards` (select/update)
- **Auth:** Required, must be board admin/owner
- **Features:**
  - Edit board name, description
  - Change join_mode
  - Toggle is_public
  - Toggle is_default (system admin only?)

---

#### `/posts/new` - Create New Post
**File:** `routes/posts.new.jsx` (NEW)
- **Loader:** ✅ Yes (get board options for dropdown)
- **Action:** ✅ Yes
- **Data Access:** Server-side
- **Tables Used:**
  - `boards` (list boards user is member of)
  - `posts` (insert)
- **Query Shape:**
  ```sql
  -- Boards user can post to
  SELECT b.id, b.name FROM boards b
  JOIN board_memberships bm ON bm.board_id = b.id
  WHERE bm.user_id = auth.uid() AND b.is_active = true;
  ```
- **Auth:** Required
- **Features:**
  - Board selector (only boards user is member of)
  - Title input
  - Content editor (markdown)
  - Submit creates post

---

#### `/posts/:id` - Post Detail
**File:** `routes/posts.$id.jsx` (NEW)
- **Loader:** ✅ Yes (SSR)
- **Action:** ✅ Yes (edit/delete)
- **Data Access:** Server-side
- **Tables Used:**
  - `posts` (select by id, update view_count)
  - `profiles` (author info)
  - `boards` (board info)
  - `board_memberships` (check if user can edit/delete)
- **Auth:** Required for private board posts
- **Features:**
  - Display full post content
  - Author info with avatar
  - Edit button (author or moderator)
  - Delete button (author or moderator)
  - Back to board link

---

#### `/my-boards` - User's Boards
**File:** `routes/my-boards.jsx` (NEW)
- **Loader:** ✅ Yes (SSR)
- **Action:** None
- **Data Access:** Server-side
- **Tables Used:**
  - `boards` (joined with memberships)
  - `board_memberships` (user's memberships)
- **Query Shape:**
  ```sql
  SELECT b.*, bm.role, bm.joined_at
  FROM boards b
  JOIN board_memberships bm ON bm.board_id = b.id
  WHERE bm.user_id = auth.uid() AND b.is_active = true
  ORDER BY bm.joined_at DESC;
  ```
- **Auth:** Required
- **Features:**
  - List boards user is member of
  - Show role in each board
  - Leave board button (if not locked)

---

#### `/join-requests` - Join Request Inbox (Admin)
**File:** `routes/join-requests.jsx` (NEW)
- **Loader:** ✅ Yes (SSR)
- **Action:** ✅ Yes
- **Data Access:** Server-side
- **Tables Used:**
  - `board_join_requests` (pending requests)
  - `boards` (board names)
  - `profiles` (requester info)
  - `board_memberships` (verify admin status)
- **Query Shape:**
  ```sql
  SELECT bjr.*, b.name as board_name, pr.display_name
  FROM board_join_requests bjr
  JOIN boards b ON b.id = bjr.board_id
  JOIN profiles pr ON pr.id = bjr.user_id
  JOIN board_memberships bm ON bm.board_id = bjr.board_id
  WHERE bjr.status = 'pending'
    AND bm.user_id = auth.uid()
    AND bm.role IN ('admin', 'owner');
  ```
- **Auth:** Required, must be admin of at least one board
- **Features:**
  - List pending requests across all boards user admins
  - Approve button (creates membership)
  - Reject button (updates status)
  - View requester profile
