# Schema Cutover Plan

This document provides step-by-step instructions for deploying the canonical Supabase schema.

---

## Prerequisites

Before starting:

1. ✅ **Fresh Supabase Project** created (or existing project with backup)
2. ✅ **Supabase Dashboard Access** (project owner or admin)
3. ✅ **Database Backup** (if migrating from existing schema)
4. ✅ **All SQL files reviewed** (schema.sql, seed.sql, rls.sql)
5. ✅ **User creation plan** (if migrating existing data without users)

---

## Deployment Scenarios

### Scenario A: Fresh Installation (New Project, No Legacy Data)

**Use this if:** Starting from scratch, no existing database tables

**Advantages:**
- Clean, no migration complexity
- All constraints and RLS from start
- No data mapping needed

**Steps:** See [Fresh Installation](#fresh-installation) below

---

### Scenario B: Migration from Legacy Schema

**Use this if:** Existing Supabase project with old tables (items, bookings, profile, group, etc.)

**Advantages:**
- Preserves existing data
- Incremental cutover possible
- Rollback option

**Steps:** See [Migration from Legacy](#migration-from-legacy-schema) below

---

## Fresh Installation

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name:** kmla-online
   - **Database Password:** (generate strong password, save it!)
   - **Region:** Southeast Asia (Singapore) or closest to Korea
4. Wait for project provisioning (~2 minutes)

### Step 2: Configure Environment Variables

1. In Supabase Dashboard → Settings → API
2. Copy these values:

   ```env
   # Add to .env or .env.local in project root
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key-here
   ```

3. **DO NOT commit these to git** (already in .gitignore)

### Step 3: Run Schema Creation

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/schema.sql`
4. Paste into editor
5. Click "Run" (bottom right)
6. ✅ Should see "Success. No rows returned"

**Verify:**
```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see: boards, board_requests, class_period, day_of_week,
--             free_bookings, gongang_bookings, karaoke_bookings,
--             place, posts, profiles, songs, time_slot
```

### Step 4: Run Seed Data

1. SQL Editor → New Query
2. Copy contents of `supabase/seed.sql`
3. Paste and run
4. ✅ Should see "Success. No rows returned"

**Verify:**
```sql
SELECT * FROM boards ORDER BY section, position;
SELECT * FROM place;
SELECT * FROM time_slot;
-- Should see reference data populated
```

### Step 5: Enable Row Level Security

1. SQL Editor → New Query
2. Copy contents of `supabase/rls.sql`
3. Paste and run
4. ✅ Should see "Success. No rows returned"

**Verify:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- rowsecurity should be 't' (true) for all tables

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 6: Create First User (Optional, for Testing)

1. Dashboard → Authentication → Users
2. Click "Add User" → "Create New User"
3. Fill in:
   - **Email:** test@example.com
   - **Password:** (strong password)
   - **Auto Confirm User:** ✅ Check this
4. Click "Create User"
5. Copy the User ID (UUID)

6. Create profile for this user:
   ```sql
   INSERT INTO profiles (id, display_name, bio)
   VALUES (
     '<user-uuid-here>',
     '30기 고동재',
     '테스트 사용자'
   );
   ```

### Step 7: Test Application Connection

1. Start dev server: `npm run dev`
2. Application should connect successfully
3. Check console for errors
4. Test basic operations (view boards, etc.)

---

## Migration from Legacy Schema

### Prerequisites

1. **Backup existing database:**
   - Dashboard → Database → Backups → "Create Backup"
   - Wait for backup to complete

2. **Identify existing users:**
   - Do you have users in `auth.users`?
   - If yes, note their UUIDs
   - If no, create them first (see Step 6 above)

3. **Map legacy data to users:**
   - Create a mapping: old user names → new user UUIDs
   - Example: "30기 고동재" → `uuid-here`

### Step 1: Run Schema Creation (Additive)

1. SQL Editor → New Query
2. Copy `supabase/schema.sql`
3. Run it
4. This creates NEW tables alongside existing ones
5. Old tables remain untouched

### Step 2: Customize Migration Script

1. Open `supabase/migrations/000_unify_schema.sql`
2. **CRITICAL:** Replace all instances of `00000000-0000-0000-0000-000000000000` with actual user UUIDs
3. Uncomment the migration sections you need:
   - Section 2.1 for profile migration
   - Section 2.2 for items → songs
   - Section 2.3 for bookings → gongang_bookings
   - Section 2.6 for group → posts
   - etc.

4. Review the user_id mapping logic in each section

### Step 3: Run Migration

1. SQL Editor → New Query
2. Copy your customized `000_unify_schema.sql`
3. **Test on copy first!** (Supabase allows database branching)
4. Run migration
5. Check for errors

**Verify data migrated:**
```sql
-- Compare counts
SELECT 'items_old' as table_name, COUNT(*) as count FROM items
UNION ALL
SELECT 'songs', COUNT(*) FROM songs;

SELECT 'bookings_old', COUNT(*) FROM bookings
UNION ALL
SELECT 'gongang_bookings', COUNT(*) FROM gongang_bookings;

-- Check sample data
SELECT * FROM songs LIMIT 5;
SELECT * FROM gongang_bookings LIMIT 5;
```

### Step 4: Run Seed Data (Reference Tables Only)

1. Since you migrated data, only seed reference tables:
   ```sql
   -- From seed.sql, only run the reference data inserts:
   -- day_of_week, time_slot, place, class_period, boards
   ```

2. Or run full `seed.sql` (it uses ON CONFLICT DO NOTHING, safe)

### Step 5: Enable RLS

1. Run `supabase/rls.sql` as in fresh installation
2. **IMPORTANT:** This may block access to migrated data if user_id is NULL
3. Test with real user authentication

### Step 6: Update Application Code

**Code changes needed** (see separate refactoring guide):

1. Update all imports:
   ```javascript
   // OLD
   import { getSupabase } from "../supabaseClient";
   import { supabase } from "./supabase";

   // NEW (server-side)
   import { createClient } from "../lib/server.js";

   // NEW (client-side, if needed)
   import { createClient } from "~/lib/client";
   ```

2. Update table names:
   - `items` → `songs`
   - `bookings` → `gongang_bookings`
   - `profile` → `profiles`
   - `"group"` → `posts`

3. Update column names:
   - `items.name` → use `user_id` FK
   - `items.date` → `songs.scheduled_date`
   - `bookings.cls` → `gongang_bookings.class_period`
   - `group.description` → `posts.content`

4. Convert client-side fetches to loaders/actions

5. Add authentication

### Step 7: Test with Real Data

1. Test all routes
2. Verify data displays correctly
3. Test create/update/delete operations
4. Check RLS policies work (users can only edit own data)

### Step 8: Rename Old Tables (Backup)

**After confirming everything works for 1-2 weeks:**

```sql
ALTER TABLE items RENAME TO items_old;
ALTER TABLE bookings RENAME TO bookings_old;
ALTER TABLE profile RENAME TO profile_old;
ALTER TABLE "group" RENAME TO group_old;
```

Keep these for rollback safety.

### Step 9: Cleanup (Later)

**After 30 days of stable operation:**

```sql
DROP TABLE IF EXISTS items_old;
DROP TABLE IF EXISTS bookings_old;
DROP TABLE IF EXISTS profile_old;
DROP TABLE IF EXISTS group_old;
```

---

## Exact Run Order in Supabase SQL Editor

### For Fresh Installation:

```
1. supabase/schema.sql       ← Creates tables, enums, indexes
2. supabase/seed.sql         ← Populates reference data
3. supabase/rls.sql          ← Enables RLS and policies
```

**Critical:** Run seed.sql BEFORE rls.sql (otherwise RLS blocks inserts)

### For Migration:

```
1. supabase/schema.sql                        ← Creates NEW tables
2. supabase/migrations/000_unify_schema.sql   ← Migrates data (customized)
3. supabase/seed.sql                          ← Fills reference tables
4. supabase/rls.sql                           ← Enables RLS
```

---

## Post-Deployment Code Refactoring Checklist

After database schema is deployed, application code needs updates:

### High Priority (Breaks Without These)

- [ ] Delete `app/supabaseClient.js`
- [ ] Delete `app/supabase.js`
- [ ] Update all imports to use `lib/server.js` or `lib/client.js`
- [ ] Update table names in all queries
- [ ] Update column names in all queries

### Medium Priority (Functional Issues)

- [ ] Convert `routes/home.jsx` to use loader (SSR)
- [ ] Convert `routes/gongang_other.jsx` to use loader
- [ ] Convert `routes/page.tsx` to use action
- [ ] Fix `boards-request.jsx` action to use Supabase client
- [ ] Add authentication to all routes
- [ ] Update modal components to use server-side actions

### Low Priority (Code Quality)

- [ ] Remove hardcoded `USER_NAME` constants
- [ ] Move YouTube API calls to server actions
- [ ] Remove hardcoded API keys from client code
- [ ] Add TypeScript types based on schema
- [ ] Add form validation (Zod schemas)
- [ ] Implement weekly booking reset (cron job or Edge Function)

---

## Rollback Plan

If deployment fails and you need to revert:

### Fresh Installation:
1. Drop all tables: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
2. Re-run old schema (if you have it)

### Migration:
1. Rename tables back:
   ```sql
   ALTER TABLE items_old RENAME TO items;
   ALTER TABLE bookings_old RENAME TO bookings;
   -- etc.
   ```

2. Drop new tables:
   ```sql
   DROP TABLE IF EXISTS songs CASCADE;
   DROP TABLE IF EXISTS gongang_bookings CASCADE;
   -- etc.
   ```

3. Disable RLS on old tables:
   ```sql
   ALTER TABLE items DISABLE ROW LEVEL SECURITY;
   -- etc.
   ```

4. Revert application code to old imports/table names

---

## Troubleshooting

### "relation does not exist" error
- **Cause:** Table not created yet
- **Fix:** Run schema.sql first

### "permission denied for table" error
- **Cause:** RLS enabled but no matching policy
- **Fix:** Check rls.sql ran correctly, verify user is authenticated

### "duplicate key value violates unique constraint" error
- **Cause:** Trying to insert data that already exists
- **Fix:** Normal if re-running seed.sql (uses ON CONFLICT DO NOTHING)

### "insert or update on table violates foreign key constraint" error
- **Cause:** Referencing a user_id that doesn't exist in auth.users
- **Fix:** Create user first via Supabase Auth UI

### "cannot insert NULL into column user_id" error
- **Cause:** Trying to insert user content without authentication
- **Fix:** Ensure `auth.uid()` is available (user logged in), or use service_role for seed data

### Seed data not inserting
- **Cause:** RLS is already enabled, blocking inserts
- **Fix:** Run seed.sql BEFORE rls.sql, or use service_role connection

---

## Validation Queries

After deployment, run these to verify success:

```sql
-- 1. Check all tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should be 12+ tables

-- 2. Check RLS enabled
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Should equal table count

-- 3. Check policies exist
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Should be 30+ policies

-- 4. Check reference data
SELECT COUNT(*) FROM boards;  -- Should be ~8
SELECT COUNT(*) FROM place;   -- Should be 4
SELECT COUNT(*) FROM time_slot; -- Should be 3

-- 5. Check indexes
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
-- Should be 20+ indexes

-- 6. Test a simple query (as authenticated user)
SELECT * FROM profiles LIMIT 1;
```

---

## Support & Next Steps

After successful deployment:

1. **Monitor Errors:**
   - Dashboard → Logs → Check for SQL errors
   - Application console → Check for Supabase errors

2. **Test All Features:**
   - Test each route
   - Test create/read/update/delete
   - Test with multiple users
   - Test RLS (users can't edit others' data)

3. **Performance Tuning:**
   - Dashboard → Database → Query Performance
   - Add indexes for slow queries

4. **Documentation:**
   - Update README with new env vars
   - Document auth flow
   - Update developer onboarding

---

## Questions or Issues?

Refer to:
- `supabase/SCHEMA.md` - Schema design rationale
- `docs/INCONSISTENCIES.md` - Known issues
- `docs/DATA_REQUIREMENTS.md` - Data model details
- Supabase Docs: https://supabase.com/docs
