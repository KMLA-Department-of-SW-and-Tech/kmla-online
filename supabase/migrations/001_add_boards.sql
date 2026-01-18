-- ============================================================================
-- MIGRATION: Add Board Memberships & Join Requests
-- ============================================================================
-- File: 001_add_boards.sql
-- Purpose: Extend boards with membership system, add join workflows
--
-- STRATEGY: Additive approach
--   1. Add new enums (if they don't exist)
--   2. Add new columns to boards table
--   3. Create board_memberships table
--   4. Create board_join_requests table
--   5. Add helper functions for RLS
--   6. Add RLS policies
--
-- IMPORTANT: This migration is designed to be safe and idempotent.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add New Enums
-- ============================================================================

DO $$
BEGIN
  -- Board join mode (how users can join a board)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'board_join_mode') THEN
    CREATE TYPE board_join_mode AS ENUM ('public', 'request', 'invite_only');
  END IF;

  -- Board membership role
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'board_role') THEN
    CREATE TYPE board_role AS ENUM ('member', 'moderator', 'admin', 'owner');
  END IF;

EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignore if types already exist
END $$;

-- ============================================================================
-- STEP 2: Add New Columns to boards Table
-- ============================================================================

-- Add slug column
ALTER TABLE boards ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add membership-related columns
ALTER TABLE boards ADD COLUMN IF NOT EXISTS join_mode board_join_mode NOT NULL DEFAULT 'public';
ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_boards_join_mode ON boards(join_mode) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_boards_default ON boards(is_default) WHERE is_default = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_boards_slug ON boards(slug) WHERE slug IS NOT NULL;

-- Add comments
COMMENT ON COLUMN boards.slug IS 'URL-friendly identifier (e.g., "student-council")';
COMMENT ON COLUMN boards.join_mode IS 'public: anyone can join; request: requires approval; invite_only: admin adds members';
COMMENT ON COLUMN boards.is_default IS 'If true, new users are automatically added as members';
COMMENT ON COLUMN boards.is_public IS 'If true, posts are readable by non-members; if false, members-only';

-- ============================================================================
-- STEP 3: Create board_memberships Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS board_memberships (
  id bigserial PRIMARY KEY,
  board_id bigint NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role board_role NOT NULL DEFAULT 'member',
  -- Membership flags
  is_locked boolean NOT NULL DEFAULT false,
  -- Timestamps
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT board_memberships_unique UNIQUE (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_memberships_board_id ON board_memberships(board_id);
CREATE INDEX IF NOT EXISTS idx_board_memberships_user_id ON board_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_board_memberships_role ON board_memberships(board_id, role);
CREATE INDEX IF NOT EXISTS idx_board_memberships_user_board ON board_memberships(user_id, board_id);

COMMENT ON TABLE board_memberships IS 'User membership in boards with role assignments';
COMMENT ON COLUMN board_memberships.role IS 'member: regular member; moderator: can moderate posts; admin: can manage members; owner: board creator with full control';
COMMENT ON COLUMN board_memberships.is_locked IS 'If true, user cannot leave this board (for default/required boards)';

-- ============================================================================
-- STEP 4: Create board_join_requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS board_join_requests (
  id bigserial PRIMARY KEY,
  board_id bigint NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status request_status NOT NULL DEFAULT 'pending',
  -- Review info
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one pending request per user per board
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_join_requests_pending ON board_join_requests(board_id, user_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_board_join_requests_board_id ON board_join_requests(board_id);
CREATE INDEX IF NOT EXISTS idx_board_join_requests_user_id ON board_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_board_join_requests_status ON board_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_board_join_requests_board_status ON board_join_requests(board_id, status);

COMMENT ON TABLE board_join_requests IS 'User requests to join boards with request join_mode';
COMMENT ON COLUMN board_join_requests.message IS 'Optional message/reason from user for joining';
COMMENT ON COLUMN board_join_requests.status IS 'pending: awaiting review; approved: user added to board; rejected: request denied';

-- ============================================================================
-- STEP 5: Add Helper Functions for RLS
-- ============================================================================

-- Check if user is a member of a board
CREATE OR REPLACE FUNCTION is_board_member(p_board_id bigint, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM board_memberships
    WHERE board_id = p_board_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is an admin/owner of a board
CREATE OR REPLACE FUNCTION is_board_admin(p_board_id bigint, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM board_memberships
    WHERE board_id = p_board_id
      AND user_id = p_user_id
      AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can moderate a board (admin, owner, or moderator)
CREATE OR REPLACE FUNCTION can_moderate_board(p_board_id bigint, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM board_memberships
    WHERE board_id = p_board_id
      AND user_id = p_user_id
      AND role IN ('admin', 'owner', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in a board (or NULL if not a member)
CREATE OR REPLACE FUNCTION get_board_role(p_board_id bigint, p_user_id uuid)
RETURNS board_role AS $$
DECLARE
  v_role board_role;
BEGIN
  SELECT role INTO v_role FROM board_memberships
  WHERE board_id = p_board_id AND user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 6: Apply updated_at Triggers to New Tables
-- ============================================================================

DO $$
BEGIN
  -- board_memberships trigger
  DROP TRIGGER IF EXISTS set_updated_at ON board_memberships;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON board_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- board_join_requests trigger
  DROP TRIGGER IF EXISTS set_updated_at ON board_join_requests;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON board_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- ============================================================================
-- STEP 7: Enable RLS on New Tables
-- ============================================================================

ALTER TABLE board_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_join_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Add RLS Policies for board_memberships
-- ============================================================================

-- Users can see memberships for boards they're members of (to see other members)
-- Or for public boards (to see member count/list)
DROP POLICY IF EXISTS "Members can view board memberships" ON board_memberships;
CREATE POLICY "Members can view board memberships" ON board_memberships
  FOR SELECT USING (
    -- User can see their own memberships
    auth.uid() = user_id
    OR
    -- User is a member of the same board
    is_board_member(board_id, auth.uid())
    OR
    -- Board is public
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_memberships.board_id
        AND boards.is_public = true
        AND boards.is_active = true
    )
  );

-- Users can join PUBLIC boards themselves
DROP POLICY IF EXISTS "Users can join public boards" ON board_memberships;
CREATE POLICY "Users can join public boards" ON board_memberships
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND role = 'member'  -- Can only add self as member, not admin
    AND EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_memberships.board_id
        AND boards.join_mode = 'public'
        AND boards.is_active = true
    )
  );

-- Board admins can add members (for any join mode)
DROP POLICY IF EXISTS "Board admins can add members" ON board_memberships;
CREATE POLICY "Board admins can add members" ON board_memberships
  FOR INSERT WITH CHECK (
    is_board_admin(board_id, auth.uid())
  );

-- Board admins can update member roles
DROP POLICY IF EXISTS "Board admins can update member roles" ON board_memberships;
CREATE POLICY "Board admins can update member roles" ON board_memberships
  FOR UPDATE USING (
    is_board_admin(board_id, auth.uid())
  ) WITH CHECK (
    is_board_admin(board_id, auth.uid())
    -- Owner role can only be changed by current owner
    AND (role != 'owner' OR is_board_admin(board_id, auth.uid()))
  );

-- Users can leave boards (delete own membership) unless locked
DROP POLICY IF EXISTS "Users can leave boards" ON board_memberships;
CREATE POLICY "Users can leave boards" ON board_memberships
  FOR DELETE USING (
    (auth.uid() = user_id AND is_locked = false)
    OR
    -- Board admins can remove members
    is_board_admin(board_id, auth.uid())
  );

-- ============================================================================
-- STEP 9: Add RLS Policies for board_join_requests
-- ============================================================================

-- Users can see their own join requests
DROP POLICY IF EXISTS "Users can view own join requests" ON board_join_requests;
CREATE POLICY "Users can view own join requests" ON board_join_requests
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Board admins can see all join requests for their boards
DROP POLICY IF EXISTS "Board admins can view join requests" ON board_join_requests;
CREATE POLICY "Board admins can view join requests" ON board_join_requests
  FOR SELECT USING (
    is_board_admin(board_id, auth.uid())
  );

-- Users can create join requests for REQUEST-mode boards
DROP POLICY IF EXISTS "Users can request to join boards" ON board_join_requests;
CREATE POLICY "Users can request to join boards" ON board_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    -- Board must be in request mode
    AND EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_join_requests.board_id
        AND boards.join_mode = 'request'
        AND boards.is_active = true
    )
    -- User must not already be a member
    AND NOT is_board_member(board_id, auth.uid())
  );

-- Board admins can update join requests (approve/reject)
DROP POLICY IF EXISTS "Board admins can review join requests" ON board_join_requests;
CREATE POLICY "Board admins can review join requests" ON board_join_requests
  FOR UPDATE USING (
    is_board_admin(board_id, auth.uid())
  ) WITH CHECK (
    is_board_admin(board_id, auth.uid())
  );

-- Users can withdraw their own pending requests
DROP POLICY IF EXISTS "Users can withdraw pending requests" ON board_join_requests;
CREATE POLICY "Users can withdraw pending requests" ON board_join_requests
  FOR DELETE USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- ============================================================================
-- STEP 10: Update Posts Policies to be Membership-Aware
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can soft-delete own posts" ON posts;

-- Posts in public boards are readable by anyone
-- Posts in non-public boards are only readable by members
DROP POLICY IF EXISTS "Posts readable based on board visibility" ON posts;
CREATE POLICY "Posts readable based on board visibility" ON posts
  FOR SELECT USING (
    is_deleted = false
    AND deleted_at IS NULL
    AND (
      -- Board is public: anyone can read
      EXISTS (
        SELECT 1 FROM boards
        WHERE boards.id = posts.board_id
          AND boards.is_active = true
          AND boards.is_public = true
      )
      OR
      -- User is a member of the board
      is_board_member(board_id, auth.uid())
      OR
      -- Post has no board (orphaned/general posts)
      board_id IS NULL
    )
  );

-- Only board members can create posts in a board
DROP POLICY IF EXISTS "Members can create posts" ON posts;
CREATE POLICY "Members can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND is_deleted = false
    AND (
      -- Board membership required
      is_board_member(board_id, auth.uid())
      OR
      -- Or no board specified (general post)
      board_id IS NULL
    )
  );

-- Users can update their own posts, or board moderators can update any post
DROP POLICY IF EXISTS "Authors and moderators can update posts" ON posts;
CREATE POLICY "Authors and moderators can update posts" ON posts
  FOR UPDATE USING (
    is_deleted = false
    AND (
      auth.uid() = user_id
      OR can_moderate_board(board_id, auth.uid())
    )
  ) WITH CHECK (
    -- Can't change ownership unless you're a moderator
    (auth.uid() = user_id OR can_moderate_board(board_id, auth.uid()))
  );

-- Users can soft-delete their own posts, or board moderators can delete any post
DROP POLICY IF EXISTS "Authors and moderators can delete posts" ON posts;
CREATE POLICY "Authors and moderators can delete posts" ON posts
  FOR DELETE USING (
    auth.uid() = user_id
    OR can_moderate_board(board_id, auth.uid())
  );

-- ============================================================================
-- STEP 11: Update Boards Policy for Admin Updates
-- ============================================================================

-- Board admins/owners can update their boards
DROP POLICY IF EXISTS "Board admins can update boards" ON boards;
CREATE POLICY "Board admins can update boards" ON boards
  FOR UPDATE USING (
    is_board_admin(id, auth.uid())
  ) WITH CHECK (
    is_board_admin(id, auth.uid())
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running this migration, verify with:
--
-- SELECT * FROM board_memberships LIMIT 5;
-- SELECT * FROM board_join_requests LIMIT 5;
-- SELECT join_mode, is_default, is_public FROM boards LIMIT 5;
--
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('board_memberships', 'board_join_requests');
--
-- Check policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('board_memberships', 'board_join_requests', 'posts', 'boards');

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. DEFAULT BOARD MEMBERSHIP:
--    To auto-add users to default boards on signup, either:
--    a) Create a trigger on auth.users (complex, requires Supabase config)
--    b) Handle in application code on user signup
--    c) Use Supabase Edge Function
--
-- 2. EXISTING BOARDS:
--    All existing boards will default to:
--    - join_mode = 'public' (anyone can join)
--    - is_default = false (not auto-join)
--    - is_public = true (posts visible to all)
--
-- 3. MIGRATING EXISTING USERS TO DEFAULT BOARDS:
--    Run this query to add all users to default boards:
--
--    INSERT INTO board_memberships (board_id, user_id, role, is_locked)
--    SELECT b.id, u.id, 'member', true
--    FROM boards b
--    CROSS JOIN auth.users u
--    WHERE b.is_default = true
--    ON CONFLICT (board_id, user_id) DO NOTHING;
--
