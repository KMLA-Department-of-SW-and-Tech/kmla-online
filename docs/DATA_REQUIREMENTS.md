# Data Requirements by Route

## Entity Summary

This document maps each route to its data requirements based on actual code usage.

---

## 1. Route: `/` (Home - 기상송)

### Entities Required
- **Songs/Items** (morning music submissions)
- **Users** (implicit - currently hardcoded)

### Fields Consumed
```sql
-- items table (actual usage)
SELECT id, name, url, date FROM items
WHERE date >= '<today_start>' AND date < '<today_end>'
ORDER BY date ASC
LIMIT 2;

SELECT id, name, url, date FROM items
WHERE name = '<user_name>'
ORDER BY id DESC;

DELETE FROM items WHERE id = <id>;
```

### Data Structure Used
- `id` (primary key for deletion)
- `name` (stores USER NAME, not song name - confusing!)
- `url` (YouTube video URL)
- `date` (ISO timestamp)

### Derived Fields (Client-side)
- `title` (fetched from YouTube API)
- `thumbnail` (constructed from video ID)

### Auth Assumptions
- **Current:** No auth, hardcoded user "30기 고동재"
- **Should be:** User-scoped based on `auth.users`

### Relationships Needed
- Song → User (who submitted)
- Song → Date slot (today's 2 slots)

---

## 2. Route: `/gongang_other` (Gongang Booking)

### Entities Required
- **Gongang Bookings** (class period + day + place reservations)
- **Free Bookings** (flexible reservations)
- **Karaoke Bookings** (karaoke room reservations)
- **Users** (implicit - not tracked)

### Fields Consumed

#### Bookings (공강신청)
```sql
SELECT id, cls, day, place, purpose FROM bookings;

INSERT INTO bookings (cls, day, place, purpose)
VALUES ('<cls>', '<day>', '<place>', '<purpose>');
```
- `cls` (text: "1자습", "2자습")
- `day` (text: "월", "화", "수", "목", "금", "토", "일")
- `place` (text: "4공", "10공", "지혼", "2혼")
- `purpose` (text: user-entered reason)

#### Free Bookings (자유신청)
```sql
SELECT id, day, time, place, purpose FROM free_bookings
WHERE day = '<day>' AND time = '<time>' AND place = '<place>';

INSERT INTO free_bookings (day, time, place, purpose)
VALUES ('<day>', '<time>', '<place>', '<purpose>');
```
- `day` (text: weekday name)
- `time` (text: "점심", "혼끝", "저녁", or custom)
- `place` (text: "10공", "4공", "지혼", "2혼", or custom)
- `purpose` (text: user-entered reason)

#### Karaoke Bookings (노래방신청)
```sql
SELECT id, day, time, applicant FROM karaoke_bookings
WHERE day = '<day>' AND time = '<time>';

INSERT INTO karaoke_bookings (day, time, applicant)
VALUES ('<day>', '<time>', '<applicant>');
```
- `day` (text: weekday name)
- `time` (text: "점심", "저녁", or custom for weekends)
- `applicant` (text: user name)

### Auth Assumptions
- **Current:** None
- **Should be:**
  - User must be logged in
  - Track `user_id` on all bookings
  - Users can only delete their own bookings

### Business Rules (from code)
- Max 4 bookings per cls/day slot (one per place)
- Weekly reset on Sunday midnight (mentioned in UI)
- Duplicate prevention: same cls + day + place

---

## 3. Route: `/profile`

### Entities Required
- **User Profile**

### Fields Consumed
```sql
SELECT * FROM profile LIMIT 1;
```

**Expected fields:**
- `name` (text)
- `introduce` (text: self-introduction)
- `phone_number` (text)
- `email` (text)

### Auth Assumptions
- **Current:** Selects first profile, no user filter
- **Should be:**
  - One profile per user
  - Filter by `user_id = auth.uid()`
  - Profile owned by authenticated user

### Missing Features
- Edit functionality (button exists, not wired)
- Profile image upload
- No `user_id` foreign key

---

## 4. Route: `/search` (행정위원회 Search)

### Entities Required
- **Group/Committee Posts**

### Fields Consumed
```sql
SELECT id, title, description, writer, created_at
FROM "group"
WHERE title ILIKE '%<query>%'
   OR description ILIKE '%<query>%'
   OR writer ILIKE '%<query>%'
ORDER BY created_at DESC;
```

### Data Structure
- `id` (primary key)
- `title` (text)
- `description` (text)
- `writer` (text: author name)
- `created_at` (timestamp)

### Auth Assumptions
- **Current:** Public read access
- **Should be:** Public read, authenticated write

### Issues
- Table name `group` is reserved SQL keyword (needs quoting)
- Missing `updated_at`
- Writer stored as text, not user reference

---

## 5. Route: `/submitsong`

### Entities Required
- **Songs/Items** (same as route `/`)

### Fields Consumed
```sql
INSERT INTO items (title, url, date)
VALUES ('<user_name>', '<youtube_url>', '<iso_timestamp>');
```

**Note:** Field `title` actually stores USER NAME, not song title!

### Auth Assumptions
- **Current:** Hardcoded user "30기 고동재"
- **Should be:** `user_id` from auth

### External Dependencies
- YouTube Search API v3
- YouTube Data API v3 (for metadata)

---

## 6. Route: `/boards`

### Entities Required
- **Board Categories**

### Fields Consumed
```sql
SELECT id, name, section, side, position
FROM boards
ORDER BY position ASC;
```

### Data Structure
- `id` (primary key)
- `name` (text: board display name)
- `section` (text: "notice", "favorite")
- `side` (text: "left", "right" for notice section)
- `position` (int: sort order)

### Auth Assumptions
- **Current:** Public read
- **Should be:** Admin-only write for board config

### Missing Entities
- **Board Posts** (not implemented yet)

---

## 7. Route: `/boards/request`

### Entities Required
- **Board Requests**

### Fields Consumed
```sql
INSERT INTO board_requests (name, description, reason, created_at)
VALUES ('<name>', '<description>', '<reason>', '<timestamp>');
```

### Data Structure
- `id` (primary key, assumed serial)
- `name` (text: requested board name)
- `description` (text: board purpose)
- `reason` (text: why needed)
- `created_at` (timestamptz)

### Auth Assumptions
- **Current:** None (anonymous requests)
- **Should be:** Track requesting user (`user_id`)

### Status Tracking (missing)
- `status` (pending, approved, rejected)
- `reviewed_at`, `reviewed_by`

---

## 8. Route: `/boards/:name`

### Entities Required
- **Board Posts** (not implemented)

### Expected Fields (inferred from typical board)
- Post ID
- Board name/ID
- Title
- Content
- Author
- Created/Updated timestamps
- Views, likes, etc.

**Currently:** Empty placeholder

---

## Cross-Cutting Concerns

### Authentication
**Current state:** No routes use authentication
**Required for canonical schema:**
- `auth.users` integration
- User profile → `auth.users.id`
- All user-created content should have `user_id` FK

### Timestamps
**Inconsistent usage:**
- Some tables use `created_at`
- Some use `date`
- None have `updated_at`

**Canonical pattern:**
- `created_at timestamptz DEFAULT now() NOT NULL`
- `updated_at timestamptz DEFAULT now() NOT NULL`

### Soft Deletes
**Current:** Hard deletes (DELETE FROM items)
**Consider:** `deleted_at timestamptz` for audit trail

---

## Canonical Entities Needed

Based on all routes:

1. **users** (extends `auth.users`)
   - profile data
   - display name
   - contact info

2. **songs** (replaces `items`)
   - user_id FK
   - youtube_url
   - scheduled_date
   - status (pending, approved, played)

3. **gongang_bookings** (replaces `bookings`)
   - user_id FK
   - class_period
   - day_of_week
   - place
   - purpose

4. **free_bookings**
   - user_id FK
   - day_of_week
   - time_slot
   - place
   - purpose

5. **karaoke_bookings**
   - user_id FK
   - day_of_week
   - time_slot

6. **profiles** (one per user)
   - user_id FK (unique)
   - bio
   - phone
   - email

7. **posts** (generic for committees/boards)
   - user_id FK
   - board_id FK
   - title
   - content
   - metadata (section, writer override)

8. **boards** (with membership support)
   - name
   - slug (URL-friendly identifier)
   - section
   - display order
   - join_mode (public, request, invite_only)
   - is_default (auto-join for new users)
   - is_public (posts visible to non-members)

9. **board_requests**
   - user_id FK
   - requested_name
   - description
   - reason
   - status

10. **board_memberships** (NEW)
    - board_id FK
    - user_id FK
    - role (member, moderator, admin, owner)
    - is_locked (prevent leaving)
    - joined_at

11. **board_join_requests** (NEW)
    - board_id FK
    - user_id FK
    - message (reason for joining)
    - status (pending, approved, rejected)
    - reviewed_by, reviewed_at

---

## Planned Routes Data Requirements

### `/boards/:slug` - Board Detail/Feed

**Entities Required:**
- Board (by slug)
- Posts (for this board)
- User Membership (current user's role)
- Profiles (post authors)

**Fields Consumed:**
```sql
-- Board info
SELECT id, name, slug, description, join_mode, is_public, is_default
FROM boards
WHERE slug = :slug AND is_active = true;

-- User's membership (if logged in)
SELECT role, joined_at, is_locked
FROM board_memberships
WHERE board_id = :board_id AND user_id = auth.uid();

-- Posts (paginated)
SELECT p.id, p.title, p.content, p.created_at, p.is_pinned,
       pr.display_name, pr.avatar_url
FROM posts p
JOIN profiles pr ON pr.id = p.user_id
WHERE p.board_id = :board_id AND p.is_deleted = false
ORDER BY p.is_pinned DESC, p.created_at DESC
LIMIT 20 OFFSET :offset;
```

**Auth Assumptions:**
- Public boards: Anyone can view posts
- Private boards: Only members can view posts
- RLS handles visibility automatically

---

### `/boards/:slug/join` - Join Board

**Entities Required:**
- Board (check join_mode)
- Board Membership (to create)
- Board Join Request (for request mode)

**Fields Consumed:**
```sql
-- Check board
SELECT id, join_mode, is_active FROM boards WHERE slug = :slug;

-- For public boards
INSERT INTO board_memberships (board_id, user_id, role)
VALUES (:board_id, auth.uid(), 'member');

-- For request-mode boards
INSERT INTO board_join_requests (board_id, user_id, message)
VALUES (:board_id, auth.uid(), :message);
```

**Auth Assumptions:**
- User must be authenticated
- User must not already be a member
- Board must be in appropriate join_mode

---

### `/boards/:slug/members` - Members Management

**Entities Required:**
- Board Memberships (all members)
- Profiles (member info)
- Board Join Requests (pending, for admins)

**Fields Consumed:**
```sql
-- All members
SELECT bm.id, bm.role, bm.joined_at, bm.is_locked,
       pr.display_name, pr.avatar_url
FROM board_memberships bm
JOIN profiles pr ON pr.id = bm.user_id
WHERE bm.board_id = :board_id
ORDER BY bm.role, bm.joined_at;

-- Pending requests (admin only)
SELECT bjr.id, bjr.message, bjr.created_at,
       pr.display_name, pr.avatar_url
FROM board_join_requests bjr
JOIN profiles pr ON pr.id = bjr.user_id
WHERE bjr.board_id = :board_id AND bjr.status = 'pending';
```

**Auth Assumptions:**
- Members can view member list
- Only admins/owners can see pending requests
- Only admins/owners can approve/reject/remove

---

### `/join-requests` - Admin Join Request Inbox

**Entities Required:**
- Board Join Requests (pending)
- Boards (names)
- Profiles (requester info)
- Board Memberships (verify admin status)

**Fields Consumed:**
```sql
SELECT bjr.id, bjr.board_id, bjr.message, bjr.created_at,
       b.name as board_name, b.slug as board_slug,
       pr.display_name, pr.avatar_url
FROM board_join_requests bjr
JOIN boards b ON b.id = bjr.board_id
JOIN profiles pr ON pr.id = bjr.user_id
WHERE bjr.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM board_memberships
    WHERE board_id = bjr.board_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
  )
ORDER BY bjr.created_at DESC;
```

**Auth Assumptions:**
- User must be admin/owner of at least one board
- Only shows requests for boards user admins

---

### `/my-boards` - User's Boards

**Entities Required:**
- Board Memberships (user's)
- Boards (details)

**Fields Consumed:**
```sql
SELECT b.id, b.name, b.slug, b.description,
       bm.role, bm.joined_at, bm.is_locked
FROM boards b
JOIN board_memberships bm ON bm.board_id = b.id
WHERE bm.user_id = auth.uid() AND b.is_active = true
ORDER BY bm.joined_at DESC;
```

**Auth Assumptions:**
- User must be authenticated
- Shows all boards user is member of
