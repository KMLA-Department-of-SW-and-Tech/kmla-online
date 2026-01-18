# Schema Handoff Packet

This document provides a quick reference for developers implementing features against the canonical Supabase schema.

---

## Table Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile data | `id` (FK auth.users), `display_name`, `bio` |
| `songs` | Morning music submissions | `user_id`, `youtube_url`, `scheduled_date`, `status` |
| `gongang_bookings` | Class period location bookings | `user_id`, `class_period`, `day_of_week`, `place` |
| `free_bookings` | Flexible time bookings | `user_id`, `day_of_week`, `time_slot`, `place` |
| `karaoke_bookings` | Karaoke room reservations | `user_id`, `day_of_week`, `time_slot` |
| `boards` | Board/community categories | `name`, `join_mode`, `is_default`, `is_public` |
| `posts` | Board posts/articles | `board_id`, `user_id`, `title`, `content` |
| `board_memberships` | User membership in boards | `board_id`, `user_id`, `role`, `is_locked` |
| `board_join_requests` | Join requests for boards | `board_id`, `user_id`, `status`, `message` |
| `board_requests` | Requests to create new boards | `user_id`, `name`, `status` |

---

## Boards & Membership System

### Board Join Modes

| Mode | Description | How to Join |
|------|-------------|-------------|
| `public` | Open to anyone | User inserts into `board_memberships` directly |
| `request` | Requires approval | User creates `board_join_requests`, admin approves |
| `invite_only` | Admin-only | Only board admin can insert into `board_memberships` |

### Board Roles

| Role | Permissions |
|------|-------------|
| `member` | Read posts, create posts |
| `moderator` | + Edit/delete any post in board |
| `admin` | + Manage members, update board settings |
| `owner` | + Cannot be demoted, full control |

### Default Boards

- Boards with `is_default = true` should auto-add new users on signup
- Default memberships should have `is_locked = true` to prevent leaving
- Implementation: Application code on signup OR database trigger

### Board Visibility

- `is_public = true`: Posts readable by anyone (even non-members)
- `is_public = false`: Only members can read posts

---

## RLS Policy Summary

### boards
| Operation | Who Can Do It |
|-----------|---------------|
| SELECT | Anyone (active boards) |
| UPDATE | Board admins/owners |
| INSERT/DELETE | Service role only |

### posts
| Operation | Who Can Do It |
|-----------|---------------|
| SELECT | Anyone (public boards) OR members (private boards) |
| INSERT | Board members only |
| UPDATE | Author OR board moderators/admins |
| DELETE | Author OR board moderators/admins |

### board_memberships
| Operation | Who Can Do It |
|-----------|---------------|
| SELECT | Own memberships, same-board members, public board members |
| INSERT (self) | Public boards only, as `member` role |
| INSERT (admin) | Board admins can add anyone |
| UPDATE | Board admins only |
| DELETE | Self (if not locked) OR board admin |

### board_join_requests
| Operation | Who Can Do It |
|-----------|---------------|
| SELECT | Own requests OR board admin |
| INSERT | Any authenticated user (for `request`-mode boards, not already member) |
| UPDATE | Board admins only |
| DELETE | Own pending requests only |

---

## Canonical Query Shapes

### List Boards (with membership status)

```sql
-- Get all active boards with current user's membership status
SELECT
  b.*,
  bm.role as my_role,
  bm.joined_at as my_joined_at,
  (SELECT COUNT(*) FROM board_memberships WHERE board_id = b.id) as member_count
FROM boards b
LEFT JOIN board_memberships bm
  ON bm.board_id = b.id
  AND bm.user_id = auth.uid()
WHERE b.is_active = true
ORDER BY b.section, b.position;
```

### Get Board Feed (posts)

```sql
-- Get posts for a board (RLS handles visibility)
SELECT
  p.*,
  pr.display_name as author_name,
  pr.avatar_url as author_avatar
FROM posts p
JOIN profiles pr ON pr.id = p.user_id
WHERE p.board_id = :board_id
  AND p.is_deleted = false
ORDER BY p.is_pinned DESC, p.created_at DESC
LIMIT 20 OFFSET :offset;
```

### Join a Public Board

```sql
-- User joins a public board
INSERT INTO board_memberships (board_id, user_id, role)
VALUES (:board_id, auth.uid(), 'member');
```

### Request to Join a Board

```sql
-- User requests to join a request-mode board
INSERT INTO board_join_requests (board_id, user_id, message)
VALUES (:board_id, auth.uid(), :message);
```

### Approve Join Request (Admin)

```sql
-- Admin approves a join request
-- Step 1: Update request status
UPDATE board_join_requests
SET status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
WHERE id = :request_id;

-- Step 2: Create membership
INSERT INTO board_memberships (board_id, user_id, role)
SELECT board_id, user_id, 'member'
FROM board_join_requests
WHERE id = :request_id;
```

### Get Pending Join Requests (Admin)

```sql
-- Get pending join requests for boards where user is admin
SELECT
  bjr.*,
  b.name as board_name,
  pr.display_name as requester_name,
  pr.avatar_url as requester_avatar
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

### Get My Boards

```sql
-- Get boards where current user is a member
SELECT
  b.*,
  bm.role,
  bm.joined_at,
  (SELECT COUNT(*) FROM posts WHERE board_id = b.id AND is_deleted = false) as post_count
FROM boards b
JOIN board_memberships bm ON bm.board_id = b.id
WHERE bm.user_id = auth.uid()
  AND b.is_active = true
ORDER BY bm.joined_at DESC;
```

### Leave a Board

```sql
-- User leaves a board (fails if is_locked = true)
DELETE FROM board_memberships
WHERE board_id = :board_id
  AND user_id = auth.uid();
```

### Create Post in Board

```sql
-- Create a new post (RLS checks membership)
INSERT INTO posts (board_id, user_id, title, content)
VALUES (:board_id, auth.uid(), :title, :content)
RETURNING *;
```

### Get Board Members (Admin view)

```sql
-- Get all members of a board with their profiles
SELECT
  bm.*,
  pr.display_name,
  pr.avatar_url,
  pr.email
FROM board_memberships bm
JOIN profiles pr ON pr.id = bm.user_id
WHERE bm.board_id = :board_id
ORDER BY
  CASE bm.role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    ELSE 4
  END,
  bm.joined_at ASC;
```

---

## Helper Functions

These functions are defined in schema.sql and can be used in queries:

```sql
-- Check if user is a member of a board
is_board_member(board_id, user_id) → boolean

-- Check if user is admin/owner of a board
is_board_admin(board_id, user_id) → boolean

-- Check if user can moderate (admin, owner, or moderator)
can_moderate_board(board_id, user_id) → boolean

-- Get user's role in a board (NULL if not member)
get_board_role(board_id, user_id) → board_role
```

---

## Enums Reference

### board_join_mode
- `public` - Anyone can join
- `request` - Requires approval
- `invite_only` - Admin adds members

### board_role
- `member` - Regular member
- `moderator` - Can moderate posts
- `admin` - Can manage members
- `owner` - Board creator

### request_status
- `pending` - Awaiting review
- `approved` - Accepted
- `rejected` - Denied

### song_status
- `pending` - Awaiting approval
- `approved` - Scheduled
- `rejected` - Denied
- `played` - Already aired

### board_section
- `notice` - Student notices
- `favorite` - Popular boards
- `general` - General boards

---

## Migration Order

For fresh install:
1. `schema.sql` - Creates all tables
2. `seed.sql` - Populates reference data
3. `rls.sql` - Enables RLS and policies

For existing database:
1. `migrations/001_add_boards.sql` - Adds membership system

---

## Assumptions

1. **Authentication**: All user operations require `auth.uid()` to be set
2. **Timestamps**: All `timestamptz` columns are UTC, localized on client
3. **Soft Deletes**: Use `is_deleted` flag and `deleted_at` timestamp
4. **Default Board Assignment**: Handled in application code, not database trigger
5. **Join Request Workflow**: Application creates membership after admin approves request

---

## Related Documentation

- `supabase/SCHEMA.md` - Full schema documentation
- `supabase/CUTOVER.md` - Deployment instructions
- `docs/ROUTES.md` - Route inventory
- `docs/DATA_REQUIREMENTS.md` - Data model per route
- `docs/INCONSISTENCIES.md` - Known issues
