-- ============================================================================
-- SEED DATA
-- ============================================================================
-- This file populates reference tables and optional example data.
-- IMPORTANT: Run BEFORE rls.sql to avoid RLS blocking inserts.
-- Run order: 1) schema.sql  2) seed.sql  3) rls.sql
-- ============================================================================

-- ============================================================================
-- REFERENCE DATA (Required for Application)
-- ============================================================================

-- Days of Week (Korean school week)
INSERT INTO day_of_week (id, name_kr, name_en, is_weekday) VALUES
  (1, '월', 'Monday', true),
  (2, '화', 'Tuesday', true),
  (3, '수', 'Wednesday', true),
  (4, '목', 'Thursday', true),
  (5, '금', 'Friday', true),
  (6, '토', 'Saturday', false),
  (7, '일', 'Sunday', false)
ON CONFLICT (id) DO NOTHING;

-- Time Slots
INSERT INTO time_slot (name, slot_type, sort_order) VALUES
  ('점심', 'lunch', 1),
  ('혼끝', 'after_study', 2),
  ('저녁', 'dinner', 3)
ON CONFLICT (name) DO NOTHING;

-- Places (Study/Activity Locations)
INSERT INTO place (name, capacity, is_active) VALUES
  ('4공', 30, true),
  ('10공', 40, true),
  ('지혼', 20, true),
  ('2혼', 25, true)
ON CONFLICT (name) DO NOTHING;

-- Class Periods
INSERT INTO class_period (name, sort_order) VALUES
  ('1자습', 1),
  ('2자습', 2)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- BOARDS CONFIGURATION
-- ============================================================================

-- Student Notice Boards (displayed in two columns)
INSERT INTO boards (name, section, side, position, description, is_active) VALUES
  ('학생회', 'notice', 'left', 1, '학생회 공지사항', true),
  ('학년별 공지', 'notice', 'left', 2, '학년별 중요 공지', true),
  ('행정실', 'notice', 'left', 3, '행정실 공지사항', true),
  ('기숙사', 'notice', 'right', 4, '기숙사 관련 공지', true),
  ('급식', 'notice', 'right', 5, '급식 안내 및 메뉴', true),
  ('보건실', 'notice', 'right', 6, '보건 관련 안내', true)
ON CONFLICT (name) DO NOTHING;

-- Favorite/Popular Boards
INSERT INTO boards (name, section, side, position, description, is_active) VALUES
  ('자유게시판', 'favorite', NULL, 10, '자유로운 소통 공간', true),
  ('질문게시판', 'favorite', NULL, 11, '궁금한 것을 물어보세요', true),
  ('정보공유', 'favorite', NULL, 12, '유용한 정보 공유', true)
ON CONFLICT (name) DO NOTHING;

-- General Boards
INSERT INTO boards (name, section, side, position, description, is_active) VALUES
  ('동아리', 'general', NULL, 20, '동아리 활동 게시판', true),
  ('학습자료', 'general', NULL, 21, '학습 자료 공유', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- EXAMPLE/DEMO DATA (OPTIONAL - Comment out for production)
-- ============================================================================
-- The sections below create example data for development/testing.
-- DELETE OR COMMENT OUT before deploying to production.

-- NOTE: These inserts will FAIL if RLS is already enabled because we're not
-- authenticated. That's why seed.sql must run BEFORE rls.sql.

-- Example: Create a test user profile
-- (You'll need a real user from auth.users. Get UUID from Supabase Auth dashboard)
--
-- INSERT INTO profiles (id, display_name, bio, phone_number, email) VALUES
--   ('00000000-0000-0000-0000-000000000000', '30기 고동재', '테스트 사용자', '010-1234-5678', 'test@example.com')
-- ON CONFLICT (id) DO NOTHING;

-- Example: Sample song submission
-- INSERT INTO songs (user_id, youtube_url, youtube_video_id, youtube_title, youtube_thumbnail_url, scheduled_date, slot_number, status) VALUES
--   ('00000000-0000-0000-0000-000000000000',
--    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
--    'dQw4w9WgXcQ',
--    'Never Gonna Give You Up',
--    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
--    CURRENT_DATE + INTERVAL '1 day',
--    1,
--    'pending');

-- Example: Sample booking
-- INSERT INTO gongang_bookings (user_id, class_period, day_of_week, place, purpose) VALUES
--   ('00000000-0000-0000-0000-000000000000', '1자습', '월', '4공', '스터디 모임');

-- Example: Sample post
-- INSERT INTO posts (board_id, user_id, title, content) VALUES
--   ((SELECT id FROM boards WHERE name = '자유게시판' LIMIT 1),
--    '00000000-0000-0000-0000-000000000000',
--    '첫 번째 게시글',
--    '안녕하세요! 첫 게시글입니다.');

-- ============================================================================
-- SEED DATA VERIFICATION
-- ============================================================================
-- After running this file, verify data was inserted:
--
-- SELECT * FROM day_of_week;
-- SELECT * FROM time_slot;
-- SELECT * FROM place;
-- SELECT * FROM class_period;
-- SELECT * FROM boards ORDER BY section, position;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. RLS COMPATIBILITY:
--    This seed file inserts into reference tables (day_of_week, time_slot, etc.)
--    which should be seeded BEFORE enabling RLS.
--
--    If you need to seed user data (profiles, songs, posts), you have two options:
--    a) Run seed.sql before rls.sql (recommended)
--    b) Use service_role connection to bypass RLS

-- 2. PRODUCTION SETUP:
--    - Keep reference data (days, time_slots, places, class_periods, boards)
--    - Remove or comment out example user data
--    - Consider creating an admin user via Supabase Auth UI first

-- 3. UPDATING REFERENCE DATA:
--    Reference tables use "ON CONFLICT DO NOTHING" to allow safe re-runs.
--    To update existing data, use UPDATE statements or change to "ON CONFLICT DO UPDATE".
