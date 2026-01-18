-- ============================================================================
-- MIGRATION: Unify Schema from Legacy to Canonical
-- ============================================================================
-- File: 000_unify_schema.sql
-- Purpose: Migrate from old inconsistent schema to canonical unified schema
--
-- STRATEGY: Additive-first approach
--   1. Create new canonical tables (if they don't exist)
--   2. Optionally migrate data from old tables
--   3. Rename old tables to *_old (don't drop immediately)
--   4. Application code updated separately to use new tables
--
-- IMPORTANT: This migration is designed to be safe and reversible.
--            Test thoroughly in development before running in production.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Canonical Schema (Idempotent)
-- ============================================================================
-- This essentially runs schema.sql in an idempotent way

\i schema.sql

-- If you can't use \i (include) in Supabase SQL Editor, copy-paste schema.sql
-- contents here instead.

-- ============================================================================
-- STEP 2: Data Migration from Old Tables (OPTIONAL)
-- ============================================================================
-- This section is OPTIONAL and only needed if you have existing data.
-- Uncomment and customize based on your actual legacy table structure.

-- ----------------------------------------------------------------------------
-- 2.1: Migrate PROFILES (profile → profiles)
-- ----------------------------------------------------------------------------
-- OLD: profile (name, introduce, phone_number, email)
-- NEW: profiles (id FK auth.users, display_name, bio, phone_number, email)
--
-- CHALLENGE: Old table has no user_id. Need to create/link auth users.
-- APPROACH: Manual mapping or create placeholder user

-- Example: Create a placeholder user (if needed)
-- You should do this via Supabase Auth dashboard, then use that UUID here.
--
-- DO $$
-- DECLARE
--   legacy_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE WITH REAL UUID
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile') THEN
--     INSERT INTO profiles (id, display_name, bio, phone_number, email)
--     SELECT
--       legacy_user_id,
--       name,
--       introduce,
--       phone_number,
--       email
--     FROM profile
--     WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = legacy_user_id)
--     LIMIT 1; -- Old schema seemed to have only one profile
--   END IF;
-- END $$;

-- ----------------------------------------------------------------------------
-- 2.2: Migrate SONGS (items → songs)
-- ----------------------------------------------------------------------------
-- OLD: items (id, name, url, date)
-- NEW: songs (id, user_id, youtube_url, scheduled_date, youtube_title, ...)
--
-- CHALLENGE: items.name stores user name (e.g., "30기 고동재"), not user_id
-- APPROACH: Map hardcoded names to real user IDs

-- Example migration (customize user_id mapping)
--
-- DO $$
-- DECLARE
--   default_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
--     INSERT INTO songs (
--       user_id,
--       youtube_url,
--       youtube_video_id,
--       scheduled_date,
--       status,
--       created_at
--     )
--     SELECT
--       default_user_id,  -- TODO: Map items.name to actual user_id
--       url,
--       -- Extract video ID from URL (simplified regex)
--       CASE
--         WHEN url ~ 'v=([^&]+)' THEN substring(url from 'v=([^&]+)')
--         WHEN url ~ 'youtu.be/([^?]+)' THEN substring(url from 'youtu.be/([^?]+)')
--         ELSE NULL
--       END,
--       date::date,  -- Cast if needed
--       'pending',   -- Default status
--       now()
--     FROM items
--     WHERE NOT EXISTS (
--       -- Avoid duplicate migration if re-run
--       SELECT 1 FROM songs WHERE youtube_url = items.url
--     );
--   END IF;
-- END $$;

-- ----------------------------------------------------------------------------
-- 2.3: Migrate BOOKINGS (bookings → gongang_bookings)
-- ----------------------------------------------------------------------------
-- OLD: bookings (id, cls, day, place, purpose)
-- NEW: gongang_bookings (id, user_id, class_period, day_of_week, place, purpose)
--
-- CHALLENGE: No user_id in old table
-- APPROACH: Assign to default user or skip (since weekly reset expected)

-- Example migration:
--
-- DO $$
-- DECLARE
--   default_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
--     INSERT INTO gongang_bookings (user_id, class_period, day_of_week, place, purpose)
--     SELECT
--       default_user_id,
--       cls,
--       day,
--       place,
--       purpose
--     FROM bookings
--     WHERE NOT EXISTS (
--       SELECT 1 FROM gongang_bookings
--       WHERE class_period = bookings.cls
--         AND day_of_week = bookings.day
--         AND place = bookings.place
--     );
--   END IF;
-- END $$;

-- ----------------------------------------------------------------------------
-- 2.4: Migrate FREE_BOOKINGS (same name, add user_id)
-- ----------------------------------------------------------------------------
-- Similar to above, add user_id mapping

-- ----------------------------------------------------------------------------
-- 2.5: Migrate KARAOKE_BOOKINGS (same name, add user_id)
-- ----------------------------------------------------------------------------
-- OLD: karaoke_bookings (id, day, time, applicant)
-- NEW: karaoke_bookings (id, user_id, day_of_week, time_slot)
--
-- Note: applicant field removed, now use user_id → profile.display_name

-- ----------------------------------------------------------------------------
-- 2.6: Migrate POSTS (group → posts)
-- ----------------------------------------------------------------------------
-- OLD: "group" (id, title, description, writer, created_at)
-- NEW: posts (id, board_id, user_id, title, content, writer_override, created_at)
--
-- CHALLENGE: No board_id, no user_id, writer is text
-- APPROACH: Assign to default board, map writer to user_id or use writer_override

-- Example:
--
-- DO $$
-- DECLARE
--   default_board_id bigint;
--   default_user_id uuid := '00000000-0000-0000-0000-000000000000';
-- BEGIN
--   -- Get or create a default board for migrated posts
--   SELECT id INTO default_board_id FROM boards WHERE name = '행정위원회' LIMIT 1;
--   IF default_board_id IS NULL THEN
--     INSERT INTO boards (name, section, position, description)
--     VALUES ('행정위원회', 'general', 100, 'Migrated posts from old group table')
--     RETURNING id INTO default_board_id;
--   END IF;
--
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group') THEN
--     INSERT INTO posts (board_id, user_id, title, content, writer_override, created_at)
--     SELECT
--       default_board_id,
--       default_user_id,
--       title,
--       description,
--       writer,  -- Preserve original writer name in override field
--       created_at
--     FROM "group"  -- Must quote reserved keyword
--     WHERE NOT EXISTS (
--       SELECT 1 FROM posts WHERE title = "group".title AND created_at = "group".created_at
--     );
--   END IF;
-- END $$;

-- ----------------------------------------------------------------------------
-- 2.7: Migrate BOARD_REQUESTS (add user_id and status)
-- ----------------------------------------------------------------------------
-- OLD: board_requests (id, name, description, reason, created_at)
-- NEW: board_requests (id, user_id, name, description, reason, status, created_at)

-- Example:
--
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_name = 'board_requests' AND column_name = 'name'
--   ) AND NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_name = 'board_requests' AND column_name = 'status'
--   ) THEN
--     -- Old schema exists, migrate by adding new columns
--     ALTER TABLE board_requests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
--     ALTER TABLE board_requests ADD COLUMN IF NOT EXISTS status request_status DEFAULT 'pending';
--     ALTER TABLE board_requests ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
--     ALTER TABLE board_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
--     ALTER TABLE board_requests ADD COLUMN IF NOT EXISTS review_notes text;
--     ALTER TABLE board_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
--
--     -- Set status for existing rows
--     UPDATE board_requests SET status = 'pending' WHERE status IS NULL;
--   END IF;
-- END $$;

-- ============================================================================
-- STEP 3: Rename Old Tables (Backup, don't drop)
-- ============================================================================
-- After confirming migration success, rename old tables for safety.
-- This allows rollback if needed.

-- DO $$
-- BEGIN
--   -- Rename old tables to *_old
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
--     ALTER TABLE items RENAME TO items_old;
--   END IF;
--
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
--     ALTER TABLE bookings RENAME TO bookings_old;
--   END IF;
--
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile') THEN
--     ALTER TABLE profile RENAME TO profile_old;
--   END IF;
--
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group') THEN
--     ALTER TABLE "group" RENAME TO group_old;
--   END IF;
-- END $$;

-- ============================================================================
-- STEP 4: Verify Migration
-- ============================================================================
-- After running migration, verify data:

-- SELECT COUNT(*) FROM profiles;
-- SELECT COUNT(*) FROM songs;
-- SELECT COUNT(*) FROM gongang_bookings;
-- SELECT COUNT(*) FROM posts;

-- Compare to old tables:
-- SELECT COUNT(*) FROM items_old;
-- SELECT COUNT(*) FROM bookings_old;
-- SELECT COUNT(*) FROM profile_old;
-- SELECT COUNT(*) FROM group_old;

-- ============================================================================
-- STEP 5: Cleanup (Do NOT run immediately!)
-- ============================================================================
-- After thorough testing in production, drop old tables.
-- Wait at least 1-2 weeks to ensure no rollback needed.

-- DROP TABLE IF EXISTS items_old;
-- DROP TABLE IF EXISTS bookings_old;
-- DROP TABLE IF EXISTS free_bookings_old;  -- if renamed
-- DROP TABLE IF EXISTS karaoke_bookings_old;  -- if renamed
-- DROP TABLE IF EXISTS profile_old;
-- DROP TABLE IF EXISTS group_old;

-- ============================================================================
-- ROLLBACK STRATEGY (If migration fails)
-- ============================================================================
-- If migration has issues and you need to rollback:

-- 1. Rename old tables back:
--    ALTER TABLE items_old RENAME TO items;
--    ALTER TABLE bookings_old RENAME TO bookings;
--    etc.

-- 2. Drop new tables if needed:
--    DROP TABLE IF EXISTS songs CASCADE;
--    DROP TABLE IF EXISTS gongang_bookings CASCADE;
--    etc.

-- 3. Revert application code to use old table names

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. USER MAPPING REQUIRED:
--    This migration requires manual user_id mapping because old schema
--    didn't track users. You MUST:
--    - Create actual users via Supabase Auth
--    - Update migration script with real UUIDs
--    - Or implement a mapping table

-- 2. FRESH INSTALL (No Legacy Data):
--    If starting fresh (new Supabase project), you can SKIP this migration.
--    Just run: schema.sql → seed.sql → rls.sql

-- 3. TESTING:
--    Test migration on a copy of production database first.
--    Supabase allows database branching for testing.

-- 4. EXECUTION ORDER:
--    Option A (Separate files):
--      1. schema.sql
--      2. This migration script (000_unify_schema.sql)
--      3. seed.sql
--      4. rls.sql
--
--    Option B (All-in-one for fresh install):
--      Just run schema.sql → seed.sql → rls.sql
