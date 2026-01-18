# Canonical Supabase Schema Documentation

## Overview

This document describes the unified database schema for the KMLA Online project. The schema consolidates all functionality from the existing codebase while adding proper authentication, ownership tracking, and data integrity constraints.

---

## Design Principles

1. **User-centric**: All user-generated content links to `auth.users`
2. **SSR-ready**: Schema supports server-side rendering patterns
3. **RLS-first**: All tables designed for Row Level Security
4. **Audit-friendly**: Soft deletes and timestamps on all tables
5. **Type-safe**: CHECK constraints and enums for data validation
6. **Normalized**: Avoid duplication while balancing query performance

---

## Entity Relationship Overview

```
auth.users (Supabase managed)
    ├─→ profiles (1:1)
    ├─→ songs (1:N)
    ├─→ gongang_bookings (1:N)
    ├─→ free_bookings (1:N)
    ├─→ karaoke_bookings (1:N)
    ├─→ posts (1:N)
    ├─→ board_requests (1:N)
    ├─→ board_memberships (1:N) ←─┐
    └─→ board_join_requests (1:N) │
                                   │
boards ────────────────────────────┘
    ├─→ posts (1:N)
    ├─→ board_memberships (1:N)
    └─→ board_join_requests (1:N)
```

**New Membership Model:**
- Users join boards via `board_memberships`
- Users request to join `request`-mode boards via `board_join_requests`
- Posts are now membership-aware (members can post, visibility based on `is_public`)

---

## Tables

### 1. `profiles`

**Purpose:** Extended user profile data (supplements `auth.users`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, FK → `auth.users(id)` | User ID |
| `display_name` | `text` | | User's chosen display name (e.g., "30기 고동재") |
| `bio` | `text` | | Self-introduction text |
| `phone_number` | `text` | | Contact phone |
| `email` | `text` | | Contact email (may differ from auth email) |
| `avatar_url` | `text` | | Profile image URL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Auto-updated via trigger |

**Ownership Model:** One profile per user, user owns their own profile

**RLS Intent:**
- Read: Public (or authenticated users)
- Write: User can only update their own profile

**Replaces:** Old `profile` table (which had no user association)

**Key Changes:**
- Added `user_id` link to `auth.users`
- Changed singular fields (name, introduce, phone_number, email) to more standard naming
- Added avatar support

---

### 2. `songs`

**Purpose:** Morning music (기상송) submissions from students

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | Auto-incrementing ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` | Who submitted |
| `youtube_url` | `text` | NOT NULL, CHECK (URL pattern) | Full YouTube URL |
| `youtube_video_id` | `text` | | Extracted video ID (e.g., "dQw4w9WgXcQ") |
| `youtube_title` | `text` | | Cached video title from API |
| `youtube_thumbnail_url` | `text` | | Cached thumbnail URL |
| `scheduled_date` | `date` | NOT NULL | Which date this song is for |
| `slot_number` | `int` | CHECK (1 or 2) | First or second song of the day |
| `status` | `song_status` | NOT NULL, DEFAULT 'pending' | pending, approved, rejected, played |
| `rejection_reason` | `text` | | Admin note if rejected |
| `played_at` | `timestamptz` | | When it was actually played |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `deleted_at` | `timestamptz` | | Soft delete |

**Unique Constraint:** `(scheduled_date, slot_number)` where status IN ('approved', 'played') and not deleted

**Ownership Model:** User owns their own submissions

**RLS Intent:**
- Read: All users can see approved/played songs
- Create: Authenticated users can submit
- Update: User can edit own pending submissions, admins can change status
- Delete: Soft delete, user can delete own pending submissions

**Replaces:** Old `items` table

**Key Changes:**
- `name` field confusion eliminated - now stores `user_id` FK
- Song title cached from YouTube API instead of re-fetching
- Added approval workflow (status enum)
- Added slot management (2 songs per day)
- Proper unique constraint to prevent double-booking slots

**Mapping from old schema:**
```
items.id → songs.id
items.name → profiles.display_name (via user_id FK)
items.url → songs.youtube_url
items.date → songs.scheduled_date
(new) → songs.youtube_title (cached)
(new) → songs.status
```

---

### 3. `gongang_bookings`

**Purpose:** Class period "gongang" (free period) location reservations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` | Who made the booking |
| `class_period` | `text` | NOT NULL, CHECK ('1자습', '2자습') | Which class period |
| `day_of_week` | `text` | NOT NULL, CHECK (weekday names) | 월, 화, 수, 목, 금, 토, 일 |
| `place` | `text` | NOT NULL, CHECK ('4공', '10공', '지혼', '2혼') | Location |
| `purpose` | `text` | NOT NULL | Why booking this space |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `deleted_at` | `timestamptz` | | Soft delete |

**Unique Constraint:** `(class_period, day_of_week, place)` where not deleted
- Prevents double-booking: only one group per class/day/place

**Ownership Model:** User owns their bookings

**RLS Intent:**
- Read: All users can see bookings (to avoid conflicts)
- Create: Authenticated users
- Delete: Only own bookings

**Replaces:** Old `bookings` table

**Key Changes:**
- Added `user_id` to track ownership
- Added unique constraint (was only client-side check before)
- Renamed `cls` → `class_period` for clarity

---

### 4. `free_bookings`

**Purpose:** Flexible free-time location bookings (자유신청)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` | |
| `day_of_week` | `text` | NOT NULL, CHECK (weekday names) | |
| `time_slot` | `text` | NOT NULL | "점심", "혼끝", "저녁", or custom |
| `place` | `text` | NOT NULL | "10공", "4공", "지혼", "2혼", or custom |
| `purpose` | `text` | NOT NULL | |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `deleted_at` | `timestamptz` | | |

**Unique Constraint:** `(day_of_week, time_slot, place)` where not deleted

**Ownership Model:** User owns their bookings

**RLS Intent:** Same as gongang_bookings

**Replaces:** Old `free_bookings` table

**Key Changes:**
- Added `user_id`
- Changed `time` → `time_slot` for consistency
- Added unique constraint
- Removed `day` column confusion (using `day_of_week`)

---

### 5. `karaoke_bookings`

**Purpose:** Karaoke room time slot reservations (노래방신청)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` | |
| `day_of_week` | `text` | NOT NULL, CHECK (weekday names) | |
| `time_slot` | `text` | NOT NULL | "점심", "저녁", or custom (weekends) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `deleted_at` | `timestamptz` | | |

**Unique Constraint:** `(day_of_week, time_slot)` where not deleted

**Ownership Model:** User owns their bookings

**RLS Intent:** Same as gongang_bookings

**Replaces:** Old `karaoke_bookings` table

**Key Changes:**
- Added `user_id`
- Removed `applicant` text field (now use `user_id` → profile.display_name)
- Changed `time` → `time_slot`
- Changed `day` → `day_of_week`

---

### 6. `boards`

**Purpose:** Board/forum category configuration with membership support (게시판 설정)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `name` | `text` | NOT NULL, UNIQUE | Board display name |
| `slug` | `text` | UNIQUE | URL-friendly identifier (e.g., "student-council") |
| `section` | `board_section` | NOT NULL, DEFAULT 'general' | notice, favorite, general |
| `side` | `board_side` | | left, right (for notice layout) |
| `position` | `int` | NOT NULL, DEFAULT 0 | Display sort order |
| `description` | `text` | | Board purpose description |
| `is_active` | `boolean` | NOT NULL, DEFAULT true | Hide inactive boards |
| `join_mode` | `board_join_mode` | NOT NULL, DEFAULT 'public' | How users can join |
| `is_default` | `boolean` | NOT NULL, DEFAULT false | Auto-join for new users |
| `is_public` | `boolean` | NOT NULL, DEFAULT true | Posts readable by non-members |
| `created_by` | `uuid` | FK → `auth.users(id)` ON DELETE SET NULL | Board creator |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Join Mode Semantics:**
- `public`: Anyone can join immediately by inserting into `board_memberships`
- `request`: User creates a `board_join_requests` entry; board admin approves/rejects
- `invite_only`: Only board admins can add members directly

**Default Board Semantics:**
- Boards with `is_default = true` should have memberships created for new users
- Implementation: Trigger on `auth.users` INSERT or application-level logic on signup
- Default board memberships can have `is_locked = true` to prevent users from leaving

**Visibility Semantics:**
- `is_public = true`: Posts are readable by anyone (or any authenticated user)
- `is_public = false`: Only members can read posts

**Ownership Model:** Admin-managed, board admins can update settings

**RLS Intent:**
- Read: Public (active boards)
- Update: Board admins/owners
- Create/Delete: Service role or system admin only

**Replaces:** Old `boards` table

**Key Changes:**
- Added `slug` for URL-friendly routing
- Added `join_mode` enum for membership control
- Added `is_default` for auto-join behavior
- Added `is_public` for visibility control
- Added `created_by` to track board creator
- Added `description` field
- Added `is_active` flag
- Changed `section`/`side` to enums for type safety

---

### 7. `posts`

**Purpose:** Board posts/articles (게시글) with membership-aware access

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `board_id` | `bigint` | FK → `boards(id)` | Which board this post belongs to |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` | Post author |
| `title` | `text` | NOT NULL | Post title |
| `content` | `text` | | Post body (markdown supported) |
| `writer_override` | `text` | | Optional display name for official posts |
| `view_count` | `int` | NOT NULL, DEFAULT 0 | |
| `is_pinned` | `boolean` | NOT NULL, DEFAULT false | Show at top |
| `is_deleted` | `boolean` | NOT NULL, DEFAULT false | Soft delete flag |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `deleted_at` | `timestamptz` | | |

**Indexes:**
- Full-text search on `title + content + writer_override`
- Composite index on `(board_id, created_at DESC)` for listings

**Ownership Model:** User owns their posts, board moderators can manage

**RLS Intent:**
- Read: Public boards → anyone; Non-public boards → members only
- Create: Board members only
- Update: Author OR board moderators/admins
- Delete: Author OR board moderators/admins (soft delete)

**Replaces:** Old `group` table

**Key Changes:**
- Renamed `group` → `posts` (avoiding reserved keyword)
- Added `board_id` for categorization
- Added `user_id` instead of storing `writer` as text
- Added `writer_override` for special posts (committee, admin)
- Added soft delete (`is_deleted`, `deleted_at`)
- Changed `description` → `content` for clarity
- Added full-text search index
- **RLS now membership-aware** (members can post, moderators can edit/delete)

**Mapping from old schema:**
```
group.id → posts.id
group.title → posts.title
group.description → posts.content
group.writer → posts.writer_override (or user profile)
group.created_at → posts.created_at
(new) → posts.board_id
(new) → posts.user_id
```

---

### 8. `board_memberships`

**Purpose:** User membership in boards with role assignments (게시판 회원)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `board_id` | `bigint` | NOT NULL, FK → `boards(id)` ON DELETE CASCADE | Which board |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Which user |
| `role` | `board_role` | NOT NULL, DEFAULT 'member' | User's role in board |
| `is_locked` | `boolean` | NOT NULL, DEFAULT false | Prevent user from leaving |
| `joined_at` | `timestamptz` | NOT NULL, DEFAULT now() | When user joined |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Unique Constraint:** `(board_id, user_id)` - one membership per user per board

**Role Semantics:**
- `member`: Regular member, can read/post
- `moderator`: Can moderate posts (edit/delete others' posts)
- `admin`: Can manage members (add/remove/change roles) and board settings
- `owner`: Board creator, full control, cannot be demoted by other admins

**Locked Membership:**
- `is_locked = true`: User cannot leave this board via DELETE
- Used for default/required boards
- Board admins can still remove locked members

**Ownership Model:** User-board relationship

**RLS Intent:**
- Read: Own memberships, same-board members, public board members
- Create (self): Public boards only, as member role
- Create (admin): Board admins can add anyone
- Update: Board admins only (for role changes)
- Delete: Self (if not locked) OR board admin

---

### 9. `board_join_requests`

**Purpose:** User requests to join boards with request join_mode (게시판 가입요청)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `board_id` | `bigint` | NOT NULL, FK → `boards(id)` ON DELETE CASCADE | Target board |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Requesting user |
| `message` | `text` | | Optional reason for joining |
| `status` | `request_status` | NOT NULL, DEFAULT 'pending' | Request status |
| `reviewed_by` | `uuid` | FK → `auth.users(id)` ON DELETE SET NULL | Admin who reviewed |
| `reviewed_at` | `timestamptz` | | When reviewed |
| `review_notes` | `text` | | Admin notes |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Unique Constraint:** `(board_id, user_id)` WHERE `status = 'pending'` - one pending request per user per board

**Join Request Workflow:**
1. User creates join request for a `request`-mode board
2. Board admins see pending requests in their inbox
3. Admin approves → membership created, request status = 'approved'
4. Admin rejects → request status = 'rejected', user notified
5. User can withdraw pending request (DELETE)

**Ownership Model:** User-submitted, admin-reviewed

**RLS Intent:**
- Read: Own requests OR board admin
- Create: Authenticated users for request-mode boards (not already member)
- Update: Board admins only (for approval/rejection)
- Delete: User can withdraw own pending requests

---

### 10. `board_requests`

**Purpose:** User requests for creating new boards (게시판 개설요청)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PK | |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE SET NULL | Who requested (nullable for anon) |
| `name` | `text` | NOT NULL | Requested board name |
| `description` | `text` | | Board purpose |
| `reason` | `text` | | Why needed |
| `status` | `request_status` | NOT NULL, DEFAULT 'pending' | pending, approved, rejected |
| `reviewed_by` | `uuid` | FK → `auth.users(id)` ON DELETE SET NULL | Admin who reviewed |
| `reviewed_at` | `timestamptz` | | When reviewed |
| `review_notes` | `text` | | Admin notes |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | |

**Ownership Model:** User-submitted, admin-reviewed

**RLS Intent:**
- Read: User can see own requests, admins see all
- Create: Authenticated (or allow anon with CAPTCHA)
- Update: Admin only (for review)

**Replaces:** Old `board_requests` table

**Key Changes:**
- Added `user_id` (nullable for backwards compat)
- Added `status` workflow (pending → approved/rejected)
- Added review tracking (`reviewed_by`, `reviewed_at`, `review_notes`)
- Changed `created_at` to database default (was set in JS code)

---

## Reference Tables (Optional)

These tables normalize repeated string values. Currently using CHECK constraints instead, but can migrate later:

### `day_of_week`
- `id`, `name_kr` (월, 화, ...), `name_en`, `is_weekday`

### `time_slot`
- `id`, `name` (점심, 혼끝, 저녁, ...), `slot_type`, `sort_order`

### `place`
- `id`, `name` (4공, 10공, ...), `capacity`, `is_active`

### `class_period`
- `id`, `name` (1자습, 2자습), `sort_order`

**These are created in schema.sql but not yet FK-linked** to allow custom values during transition.

---

## Enums

### `song_status`
- `pending`: Awaiting admin approval
- `approved`: Scheduled to play
- `rejected`: Denied
- `played`: Already aired

### `request_status`
- `pending`: Awaiting review
- `approved`: Request accepted
- `rejected`: Request denied

### `board_section`
- `notice`: Student notices
- `favorite`: Favorited boards
- `general`: General boards

### `board_side`
- `left`: Left column (for notice layout)
- `right`: Right column (for notice layout)

### `board_join_mode`
- `public`: Anyone can join immediately
- `request`: User requests to join; admin approves/rejects
- `invite_only`: Only admins can add members

### `board_role`
- `member`: Regular member, can read and post
- `moderator`: Can moderate posts (edit/delete others' posts)
- `admin`: Can manage members and board settings
- `owner`: Board creator, full control, cannot be demoted

---

## Assumptions

1. **Authentication Required:** All user content requires login (except reading public posts)

2. **Timezone:** All timestamps are `timestamptz` (UTC stored, localized on client)

3. **Soft Deletes:** Most tables use `deleted_at` for audit trail
   - Query filters: `WHERE deleted_at IS NULL`
   - Unique indexes exclude deleted rows

4. **Weekly Reset:** Booking tables reset logic NOT in schema (requires app/cron job)
   - Mentioned in UI: "매주 일요일 자정에 초기화됩니다"
   - Implementation: Scheduled Supabase Edge Function or cron DELETE WHERE created_at < ...

5. **YouTube API:** Songs table caches YouTube metadata
   - Avoids re-fetching on every page load
   - Update via server action when URL submitted

6. **Admin Roles:** Not modeled in schema yet
   - Assumption: Use Supabase built-in roles or custom `user_roles` table
   - RLS policies will check `auth.jwt() -> role`

---

## Migration Notes

### From Old Schema → Canonical Schema

| Old Table | New Table | Key Changes |
|-----------|-----------|-------------|
| `items` | `songs` | Added user_id, status workflow, slot mgmt |
| `bookings` | `gongang_bookings` | Added user_id, unique constraint |
| `free_bookings` | `free_bookings` | Added user_id, renamed columns |
| `karaoke_bookings` | `karaoke_bookings` | Added user_id, removed applicant text |
| `profile` | `profiles` | Added user_id FK, renamed fields |
| `group` | `posts` | Renamed table, added board_id, user_id, soft delete |
| `boards` | `boards` | Added description, is_active, enum types |
| `board_requests` | `board_requests` | Added user_id, status workflow, review tracking |

### Data Migration Strategy

1. **Create new tables** (run schema.sql)
2. **Migrate data** with user association:
   - `items` → `songs`: Need to map hardcoded "30기 고동재" to real user_id
   - `profile` → `profiles`: Create user if doesn't exist, link via email
   - `group` → `posts`: Same user mapping challenge
3. **Rename old tables** (e.g., `items_old`) - don't drop immediately
4. **Test queries** with new schema
5. **Update application code** to use new table/column names
6. **Drop old tables** after verification

---

## TODOs / Future Enhancements

- [ ] Add `comments` table for post replies
- [ ] Add `likes` or `reactions` table
- [ ] Add `attachments` table for file uploads
- [ ] Consider normalizing day/time/place to reference tables
- [ ] Add `user_roles` for admin/moderator permissions
- [ ] Add `audit_log` for admin actions
- [ ] Add `notifications` table
- [ ] Implement scheduled cleanup for old bookings
