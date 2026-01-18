-- ============================================================================
-- CANONICAL SUPABASE SCHEMA FOR KMLA-ONLINE
-- ============================================================================
-- This schema is designed to be run in a fresh Supabase project.
-- It creates all tables, enums, indexes, and constraints needed.
-- Run this in Supabase Dashboard → SQL Editor.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
-- Using robust enum creation pattern that won't fail if re-run

DO $$
BEGIN
  -- Booking type categories
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type') THEN
    CREATE TYPE booking_type AS ENUM ('gongang', 'free', 'karaoke');
  END IF;

  -- Song submission status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'song_status') THEN
    CREATE TYPE song_status AS ENUM ('pending', 'approved', 'rejected', 'played');
  END IF;

  -- Board request status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;

  -- Board section categories
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'board_section') THEN
    CREATE TYPE board_section AS ENUM ('notice', 'favorite', 'general');
  END IF;

  -- Board side (for notice section layout)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'board_side') THEN
    CREATE TYPE board_side AS ENUM ('left', 'right');
  END IF;

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
-- REFERENCE TABLES (Enums/Lookups)
-- ============================================================================

-- Day of week reference (Korean)
CREATE TABLE IF NOT EXISTS day_of_week (
  id int PRIMARY KEY,
  name_kr text NOT NULL UNIQUE,
  name_en text NOT NULL UNIQUE,
  is_weekday boolean NOT NULL DEFAULT true
);

-- Time slots reference
CREATE TABLE IF NOT EXISTS time_slot (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slot_type text,
  sort_order int NOT NULL DEFAULT 0
);

-- Places reference
CREATE TABLE IF NOT EXISTS place (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  capacity int,
  is_active boolean NOT NULL DEFAULT true
);

-- Class periods reference
CREATE TABLE IF NOT EXISTS class_period (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);

-- ============================================================================
-- USER PROFILE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  phone_number text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profile data extending auth.users';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN profiles.display_name IS 'User chosen display name (e.g., "30기 고동재")';

-- ============================================================================
-- SONGS (기상송 Morning Music)
-- ============================================================================
CREATE TABLE IF NOT EXISTS songs (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_url text NOT NULL,
  youtube_video_id text,
  youtube_title text,
  youtube_thumbnail_url text,
  scheduled_date date NOT NULL,
  slot_number int CHECK (slot_number IN (1, 2)),
  status song_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT valid_youtube_url CHECK (youtube_url ~* '^https?://(www\.)?(youtube\.com|youtu\.be)/')
);

CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_songs_scheduled_date ON songs(scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_songs_unique_slot ON songs(scheduled_date, slot_number)
  WHERE deleted_at IS NULL AND status IN ('approved', 'played');

COMMENT ON TABLE songs IS 'Morning music (기상송) submissions';
COMMENT ON COLUMN songs.slot_number IS 'Which of the 2 daily slots (1 or 2)';
COMMENT ON COLUMN songs.status IS 'pending: awaiting approval, approved: scheduled, rejected: denied, played: already aired';

-- ============================================================================
-- GONGANG BOOKINGS (공강신청)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gongang_bookings (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_period text NOT NULL,
  day_of_week text NOT NULL,
  place text NOT NULL,
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT valid_day_of_week CHECK (day_of_week IN ('월', '화', '수', '목', '금', '토', '일')),
  CONSTRAINT valid_class_period CHECK (class_period IN ('1자습', '2자습')),
  CONSTRAINT valid_place CHECK (place IN ('4공', '10공', '지혼', '2혼'))
);

CREATE INDEX IF NOT EXISTS idx_gongang_bookings_user_id ON gongang_bookings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gongang_bookings_slot ON gongang_bookings(class_period, day_of_week, place) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gongang_bookings_unique ON gongang_bookings(class_period, day_of_week, place)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE gongang_bookings IS 'Class period "gongang" (free period) location bookings';
COMMENT ON INDEX idx_gongang_bookings_unique IS 'Prevent double-booking: one booking per class/day/place';

-- ============================================================================
-- FREE BOOKINGS (자유신청)
-- ============================================================================
CREATE TABLE IF NOT EXISTS free_bookings (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  time_slot text NOT NULL,
  place text NOT NULL,
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT valid_day_of_week CHECK (day_of_week IN ('월', '화', '수', '목', '금', '토', '일'))
);

CREATE INDEX IF NOT EXISTS idx_free_bookings_user_id ON free_bookings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_free_bookings_slot ON free_bookings(day_of_week, time_slot, place) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_bookings_unique ON free_bookings(day_of_week, time_slot, place)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE free_bookings IS 'Flexible free-time location bookings';

-- ============================================================================
-- KARAOKE BOOKINGS (노래방신청)
-- ============================================================================
CREATE TABLE IF NOT EXISTS karaoke_bookings (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  time_slot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT valid_day_of_week CHECK (day_of_week IN ('월', '화', '수', '목', '금', '토', '일'))
);

CREATE INDEX IF NOT EXISTS idx_karaoke_bookings_user_id ON karaoke_bookings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_karaoke_bookings_slot ON karaoke_bookings(day_of_week, time_slot) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_karaoke_bookings_unique ON karaoke_bookings(day_of_week, time_slot)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE karaoke_bookings IS 'Karaoke room time slot reservations';

-- ============================================================================
-- BOARDS (게시판 Categories/Communities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS boards (
  id bigserial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text UNIQUE,
  section board_section NOT NULL DEFAULT 'general',
  side board_side,
  position int NOT NULL DEFAULT 0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  -- Membership settings
  join_mode board_join_mode NOT NULL DEFAULT 'public',
  is_default boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  -- Creator/owner reference
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boards_section ON boards(section) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_boards_position ON boards(position);
CREATE INDEX IF NOT EXISTS idx_boards_join_mode ON boards(join_mode) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_boards_default ON boards(is_default) WHERE is_default = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_boards_slug ON boards(slug) WHERE slug IS NOT NULL;

COMMENT ON TABLE boards IS 'Board/forum categories configuration with membership support';
COMMENT ON COLUMN boards.slug IS 'URL-friendly identifier (e.g., "student-council")';
COMMENT ON COLUMN boards.side IS 'For notice section: left or right column placement';
COMMENT ON COLUMN boards.join_mode IS 'public: anyone can join; request: requires approval; invite_only: admin adds members';
COMMENT ON COLUMN boards.is_default IS 'If true, new users are automatically added as members';
COMMENT ON COLUMN boards.is_public IS 'If true, posts are readable by non-members; if false, members-only';

-- ============================================================================
-- POSTS (게시글 - replaces "group" table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id bigserial PRIMARY KEY,
  board_id bigint REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  writer_override text,
  view_count int NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts(board_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(writer_override, ''))) WHERE is_deleted = false;

COMMENT ON TABLE posts IS 'Board posts/articles (replaces old "group" table)';
COMMENT ON COLUMN posts.writer_override IS 'Optional display name override (for committee/official posts)';
COMMENT ON COLUMN posts.is_deleted IS 'Soft delete flag';

-- ============================================================================
-- BOARD REQUESTS (게시판 개설요청)
-- ============================================================================
CREATE TABLE IF NOT EXISTS board_requests (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  reason text,
  status request_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_requests_user_id ON board_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_board_requests_status ON board_requests(status);
CREATE INDEX IF NOT EXISTS idx_board_requests_created_at ON board_requests(created_at DESC);

COMMENT ON TABLE board_requests IS 'User requests for creating new boards';

-- ============================================================================
-- BOARD MEMBERSHIPS (게시판 회원)
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

COMMENT ON TABLE board_memberships IS 'User membership in boards with role assignments';
COMMENT ON COLUMN board_memberships.role IS 'member: regular member; moderator: can moderate posts; admin: can manage members; owner: board creator with full control';
COMMENT ON COLUMN board_memberships.is_locked IS 'If true, user cannot leave this board (for default/required boards)';

-- ============================================================================
-- BOARD JOIN REQUESTS (게시판 가입요청)
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
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that need it
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_songs_user_scheduled ON songs(user_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_board_created ON posts(board_id, created_at DESC) WHERE is_deleted = false;

-- Membership-aware post queries
CREATE INDEX IF NOT EXISTS idx_board_memberships_user_board ON board_memberships(user_id, board_id);

COMMENT ON INDEX idx_posts_search IS 'Full-text search index for posts (title + content + writer)';

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
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

-- Check if user is an admin/owner/moderator of a board
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
