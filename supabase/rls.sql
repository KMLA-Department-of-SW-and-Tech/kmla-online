-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This file enables RLS and creates security policies for all tables.
-- Run AFTER schema.sql in Supabase Dashboard → SQL Editor.
-- ============================================================================

-- ============================================================================
-- REFERENCE TABLES (Public Read, Admin Write)
-- ============================================================================

ALTER TABLE day_of_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE place ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_period ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reference data
DROP POLICY IF EXISTS "Reference tables are publicly readable" ON day_of_week;
CREATE POLICY "Reference tables are publicly readable" ON day_of_week
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reference tables are publicly readable" ON time_slot;
CREATE POLICY "Reference tables are publicly readable" ON time_slot
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reference tables are publicly readable" ON place;
CREATE POLICY "Reference tables are publicly readable" ON place
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reference tables are publicly readable" ON class_period;
CREATE POLICY "Reference tables are publicly readable" ON class_period
  FOR SELECT USING (true);

-- Admin-only write access (implement custom role check when ready)
-- For now, rely on API security (don't expose insert/update endpoints)

-- ============================================================================
-- PROFILES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (for displaying author names, etc.)
DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
CREATE POLICY "Profiles are publicly readable" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile (triggered on signup)
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot delete profiles (CASCADE from auth.users handles this)
DROP POLICY IF EXISTS "Users cannot delete profiles" ON profiles;
CREATE POLICY "Users cannot delete profiles" ON profiles
  FOR DELETE USING (false);

-- ============================================================================
-- SONGS (기상송 Morning Music)
-- ============================================================================

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Everyone can read approved/played songs (not deleted)
DROP POLICY IF EXISTS "Anyone can view approved songs" ON songs;
CREATE POLICY "Anyone can view approved songs" ON songs
  FOR SELECT USING (
    deleted_at IS NULL
    AND status IN ('approved', 'played')
  );

-- Users can view their own songs regardless of status
DROP POLICY IF EXISTS "Users can view own songs" ON songs;
CREATE POLICY "Users can view own songs" ON songs
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Authenticated users can submit songs
DROP POLICY IF EXISTS "Authenticated users can submit songs" ON songs;
CREATE POLICY "Authenticated users can submit songs" ON songs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Users can update their own pending songs
DROP POLICY IF EXISTS "Users can update own pending songs" ON songs;
CREATE POLICY "Users can update own pending songs" ON songs
  FOR UPDATE USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
    AND status = 'pending'
  ) WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Users can soft-delete their own pending songs
DROP POLICY IF EXISTS "Users can delete own pending songs" ON songs;
CREATE POLICY "Users can delete own pending songs" ON songs
  FOR DELETE USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Note: Admin approval (status update) requires separate admin policy or service role

-- ============================================================================
-- GONGANG BOOKINGS (공강신청)
-- ============================================================================

ALTER TABLE gongang_bookings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view bookings (to see availability)
DROP POLICY IF EXISTS "Authenticated users can view gongang bookings" ON gongang_bookings;
CREATE POLICY "Authenticated users can view gongang bookings" ON gongang_bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

-- Authenticated users can create bookings
DROP POLICY IF EXISTS "Authenticated users can create gongang bookings" ON gongang_bookings;
CREATE POLICY "Authenticated users can create gongang bookings" ON gongang_bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own bookings
DROP POLICY IF EXISTS "Users can update own gongang bookings" ON gongang_bookings;
CREATE POLICY "Users can update own gongang bookings" ON gongang_bookings
  FOR UPDATE USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- Users can delete (soft or hard) their own bookings
DROP POLICY IF EXISTS "Users can delete own gongang bookings" ON gongang_bookings;
CREATE POLICY "Users can delete own gongang bookings" ON gongang_bookings
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- FREE BOOKINGS (자유신청)
-- ============================================================================

ALTER TABLE free_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view free bookings" ON free_bookings;
CREATE POLICY "Authenticated users can view free bookings" ON free_bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Authenticated users can create free bookings" ON free_bookings;
CREATE POLICY "Authenticated users can create free bookings" ON free_bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own free bookings" ON free_bookings;
CREATE POLICY "Users can update own free bookings" ON free_bookings
  FOR UPDATE USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
  ) WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can delete own free bookings" ON free_bookings;
CREATE POLICY "Users can delete own free bookings" ON free_bookings
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- KARAOKE BOOKINGS (노래방신청)
-- ============================================================================

ALTER TABLE karaoke_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view karaoke bookings" ON karaoke_bookings;
CREATE POLICY "Authenticated users can view karaoke bookings" ON karaoke_bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Authenticated users can create karaoke bookings" ON karaoke_bookings;
CREATE POLICY "Authenticated users can create karaoke bookings" ON karaoke_bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own karaoke bookings" ON karaoke_bookings;
CREATE POLICY "Users can update own karaoke bookings" ON karaoke_bookings
  FOR UPDATE USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
  ) WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can delete own karaoke bookings" ON karaoke_bookings;
CREATE POLICY "Users can delete own karaoke bookings" ON karaoke_bookings
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- BOARDS (게시판 Categories)
-- ============================================================================

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Everyone can view active boards (public metadata)
DROP POLICY IF EXISTS "Anyone can view active boards" ON boards;
CREATE POLICY "Anyone can view active boards" ON boards
  FOR SELECT USING (is_active = true);

-- Board admins/owners can update their boards
DROP POLICY IF EXISTS "Board admins can update boards" ON boards;
CREATE POLICY "Board admins can update boards" ON boards
  FOR UPDATE USING (
    is_board_admin(id, auth.uid())
  ) WITH CHECK (
    is_board_admin(id, auth.uid())
  );

-- Note: Board creation and deletion still require service role or system admin

-- ============================================================================
-- POSTS (게시글) - Membership-Aware Policies
-- ============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts in public boards are readable by anyone
-- Posts in non-public boards are only readable by members
DROP POLICY IF EXISTS "Anyone can view published posts" ON posts;
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
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
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
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
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
DROP POLICY IF EXISTS "Users can soft-delete own posts" ON posts;
DROP POLICY IF EXISTS "Authors and moderators can delete posts" ON posts;
CREATE POLICY "Authors and moderators can delete posts" ON posts
  FOR DELETE USING (
    auth.uid() = user_id
    OR can_moderate_board(board_id, auth.uid())
  );

-- Note: Actual deletion sets is_deleted=true and deleted_at=now()
-- Hard DELETE is allowed by policy but app should do UPDATE instead

-- ============================================================================
-- BOARD REQUESTS (게시판 개설요청)
-- ============================================================================

ALTER TABLE board_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own board requests" ON board_requests;
CREATE POLICY "Users can view own board requests" ON board_requests
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Authenticated users can create requests
DROP POLICY IF EXISTS "Authenticated users can create board requests" ON board_requests;
CREATE POLICY "Authenticated users can create board requests" ON board_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Users can update their own pending requests
DROP POLICY IF EXISTS "Users can update own pending board requests" ON board_requests;
CREATE POLICY "Users can update own pending board requests" ON board_requests
  FOR UPDATE USING (
    auth.uid() = user_id
    AND status = 'pending'
  ) WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Users cannot delete requests (keep audit trail)
DROP POLICY IF EXISTS "Users cannot delete board requests" ON board_requests;
CREATE POLICY "Users cannot delete board requests" ON board_requests
  FOR DELETE USING (false);

-- Note: Admin review (status update) requires service role or admin policy

-- ============================================================================
-- BOARD MEMBERSHIPS (게시판 회원)
-- ============================================================================

ALTER TABLE board_memberships ENABLE ROW LEVEL SECURITY;

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
-- BOARD JOIN REQUESTS (게시판 가입요청)
-- ============================================================================

ALTER TABLE board_join_requests ENABLE ROW LEVEL SECURITY;

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
-- ADMIN POLICIES (TODO)
-- ============================================================================

-- When user_roles table or JWT claims are implemented, add policies like:
--
-- CREATE POLICY "Admins can view all songs" ON songs
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );
--
-- CREATE POLICY "Admins can update song status" ON songs
--   FOR UPDATE USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

-- 1. TESTING RLS:
--    After applying these policies, test with a regular user account.
--    RLS is NOT enforced when using service_role key (Supabase dashboard SQL editor).
--    You must test with anon or authenticated user JWT.

-- 2. SEED DATA:
--    Run seed.sql BEFORE rls.sql if you need to insert reference data.
--    Or use service_role connection to bypass RLS temporarily.

-- 3. ADMIN OPERATIONS:
--    Operations like approving songs, reviewing board requests, managing boards
--    should use service_role key in server-side actions (NOT exposed to client).

-- 4. SOFT DELETES:
--    Most policies check `deleted_at IS NULL`.
--    Application code should set deleted_at instead of hard DELETE.
