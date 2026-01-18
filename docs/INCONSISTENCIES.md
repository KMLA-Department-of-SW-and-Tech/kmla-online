# Codebase Inconsistencies & Issues

This document catalogs schema drift, naming conflicts, SSR violations, and architectural issues found in the codebase.

---

## 1. Supabase Client Initialization (CRITICAL)

### Problem
**Four different client initialization patterns** across the codebase:

| File | Export | Library | Usage Pattern |
|------|--------|---------|---------------|
| `app/supabaseClient.js` | `getSupabase()` | `@supabase/supabase-js` | Singleton with lazy init |
| `app/supabase.js` | `supabase` | `@supabase/supabase-js` | Direct singleton |
| `app/lib/client.js` | `createClient()` | `@supabase/ssr` | Browser client factory |
| `app/lib/server.js` | `createClient(request)` | `@supabase/ssr` | Server client factory |

### Impact
- Inconsistent cookie handling (SSR auth won't work reliably)
- Some clients don't support server-side auth state
- `@supabase/ssr` vs `@supabase/supabase-js` have different capabilities

### Files Affected
- `routes/home.jsx` → uses `getSupabase()` ❌
- `routes/gongang_other.jsx` → uses `supabase` singleton ❌
- `BookingModal.jsx`, `FreeBookingModal.jsx`, `KaraokeBookingModal.jsx` → use `supabase` ❌
- `routes/page.tsx` → uses `createClient()` from `lib/client` ⚠️
- `routes/profile.jsx`, `searchEasy.jsx`, `boards.jsx` → use `createClient(request)` ✅

### Fix Required
- **Server-side (loaders/actions):** Always use `lib/server.js` → `createClient(request)`
- **Client-side (if needed):** Use `lib/client.js` → `createClient()`
- **Delete:** `app/supabaseClient.js` and `app/supabase.js`

---

## 2. SSR Pattern Violations

### Routes Using Client-Side Fetching (Should Use Loaders)

| Route | File | Current | Should Be |
|-------|------|---------|-----------|
| `/` | `home.jsx` | `useEffect` + client fetch | `loader` function |
| `/gongang_other` | `gongang_other.jsx` | `useEffect` + client fetch | `loader` function |
| `/submitsong` | `page.tsx` | Client-side insert | `action` function |
| `/boards/request` | `boards-request.jsx` | Action uses raw `fetch` | Use server Supabase client |

### Impact
- Poor SEO (content not in initial HTML)
- Slower perceived performance (data fetch after JS loads)
- Flash of loading states
- Waterfall requests (HTML → JS → Data)
- Can't take advantage of React Router's loader caching

### Example Violation (home.jsx:46-104)
```javascript
useEffect(() => {
  const supabase = getSupabase();
  async function fetchTodaySongs() {
    const { data, error } = await supabase.from("items").select(...);
    // ...
  }
  fetchTodaySongs();
}, []);
```

**Should be:**
```javascript
export async function loader({ request }) {
  const { supabase } = createClient(request);
  const { data, error } = await supabase.from("items").select(...);
  return { songs: data };
}
```

---

## 3. Table/Field Naming Inconsistencies

### Reserved SQL Keywords
**`group` table** (searchEasy.jsx:19)
- `group` is a reserved SQL keyword
- Requires quoting: `"group"`
- Causes issues in some SQL contexts

**Fix:** Rename to `posts` or `committee_posts`

### Semantic Confusion: `items.title` vs `items.name`
**Problem:** The `items` table has confusing field semantics

```sql
-- What the code does:
INSERT INTO items (title, url, date) VALUES ('<USER_NAME>', '<youtube_url>', '<date>');
-- But displays: items.name (which should be the song submitter)

-- From home.jsx:52-53
SELECT id, name, url, date FROM items  -- name = submitter
-- From page.tsx:46
INSERT INTO items (title, url, date)   -- title = submitter (??)
```

**Actual usage:**
- `name` field = user name (submitter)
- `title` field = ALSO stores user name (duplicate?)
- Actual song title = fetched from YouTube API (not stored!)

**Fix:** Canonical schema should have:
```sql
songs (
  id,
  user_id FK,           -- reference to auth.users
  youtube_url,
  youtube_title text,   -- cached from API
  scheduled_date,
  ...
)
```

### Timestamp Field Naming
Different patterns across tables:

| Table | Timestamp Field | Type Assumption |
|-------|----------------|-----------------|
| `items` | `date` | ISO string? |
| `group` | `created_at` | timestamp |
| `board_requests` | `created_at` | timestamptz (manually set) |
| `boards` | (none) | - |
| `bookings` | (none) | - |
| `profile` | (none) | - |

**Fix:** Standardize on:
- `created_at timestamptz DEFAULT now()`
- `updated_at timestamptz DEFAULT now()`

---

## 4. Authentication Gaps

### No Auth Usage
**Zero routes use authentication** despite:
- Supabase Auth configured (SSR clients available)
- `auth.users` table available
- Personal data (profiles, bookings) stored

### Hardcoded Users
```javascript
// home.jsx:5, page.tsx:7
const USER_NAME = "30기 고동재";
```

### Missing User Ownership
No table has `user_id` foreign key:
- Who submitted which song?
- Who made which booking?
- Who requested which board?
- Whose profile is this?

### Impact
- Can't differentiate users
- Can't show "my bookings"
- Can't restrict edits/deletes
- No RLS protection possible
- Security risk (anyone can delete anything)

---

## 5. Schema Drift & Duplication

### Multiple "Booking" Concepts
Three separate booking tables with overlapping purposes:

| Table | Purpose | Common Fields |
|-------|---------|---------------|
| `bookings` | 공강 class bookings | day, place, purpose |
| `free_bookings` | 자유신청 free bookings | day, time, place, purpose |
| `karaoke_bookings` | 노래방 karaoke bookings | day, time, applicant |

**Could normalize to:**
```sql
bookings (
  id, user_id, booking_type, day, time_slot, place, purpose, ...
)
-- booking_type: enum('gongang', 'free', 'karaoke')
```

### Separate Client Patterns
- `BookingModal`, `FreeBookingModal`, `KaraokeBookingModal` have near-identical structure
- Could be one generic `<BookingModal type="..." />`

---

## 6. External API Key Exposure

### Hardcoded API Keys in Client Code

**page.tsx:6**
```typescript
const YOUTUBE_API_KEY = "AIzaSyBrAr6dxzLvW8t8apB3hw_-Fucn1nzcOvk";
```

**home.jsx:4**
```javascript
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
```

**boards-request.jsx:157-164**
```javascript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ||
  "https://pknwhzohdspdixdywktn.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### Impact
- API keys exposed in client bundle (can be extracted)
- YouTube quota abuse risk
- Credentials in version control

### Fix
- Move YouTube API calls to server action
- Don't hardcode fallback credentials
- Use environment variables exclusively

---

## 7. Type Safety Issues

### Mixed JS/TS Usage
- Most files are `.jsx`
- One route is `.tsx` (page.tsx)
- No shared type definitions
- No Zod schemas for validation

### Missing Enums
Hardcoded string arrays:
```javascript
const days = ["월", "화", "수", "목", "금", "토", "일"];
const classes = ["1자습", "2자습"];
const places = ["4공", "10공", "지혼", "2혼"];
```

**Should be:** Database enums or reference tables

---

## 8. Data Validation Gaps

### No Server-Side Validation
- `boards-request.jsx` action only checks `if (!name)`
- No validation of:
  - Field lengths
  - URL formats
  - Date ranges
  - Duplicate constraints (beyond client-side checks)

### Client-Side Duplicate Prevention
```javascript
// BookingModal.jsx:45-60
const { data: latestBookings } = await supabase
  .from("bookings")
  .select("cls, day, place")
  .eq("cls", openModal.cls)
  .eq("day", openModal.day)
  .eq("place", selectedPlace);

if (latestBookings.length > 0) {
  return alert("이미 예약된 장소입니다!");
}
```

**Problem:** Race condition (two users can double-book)
**Fix:** Database UNIQUE constraint + server-side validation

---

## 9. Missing Features Referenced in UI

### Profile Edit
- Edit button exists (profile.jsx:38)
- `isEditing` state toggled
- No save functionality
- No form inputs

### Board Posts
- `/boards/:name` route exists
- Shows board name
- No post listing, no create post

### Weekly Reset Logic
```javascript
// gongang_other.jsx:76
"매주 일요일 자정에 초기화됩니다"
```
- UI mentions reset behavior
- No cron job, trigger, or scheduled function
- Reset logic not implemented

---

## 10. SQL/Query Issues

### Timezone Handling Complexity
**searchEasy.jsx:36-59** has 60 lines of timezone parsing logic:
```javascript
const toTs = (s) => {
  if (/(Z|[+-]\d{2}:\d{2}|...)/.test(s)) { /* ... */ }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})...$/);
  // Complex parsing to handle "naive" timestamps
}
```

**Root cause:** `created_at` stored inconsistently
**Fix:** Always use `timestamptz` in database

### Inefficient Queries
**home.jsx:51-57** fetches all today's songs then enriches with YouTube API:
```javascript
const { data } = await supabase.from("items")
  .select("id, name, url, date")
  .gte("date", start).lt("date", end)
  .limit(2);

const enriched = await Promise.all(
  data.map(async (song) => {
    const title = await getVideoTitle(videoId); // N+1 API calls
  })
);
```

**Fix:** Cache YouTube metadata in database

---

## 11. RLS Not Enabled

**Current state:** No evidence of Row Level Security policies
- All data publicly readable/writable
- No user-level access control
- Anyone can delete any booking, song, profile

**Required:** RLS policies for all tables

---

## 12. Error Handling

### Inconsistent Error Patterns
- Some routes: `console.error()` then silent fail
- Some routes: `alert()` with user message
- Some routes: throw error (500 response)
- No error boundaries
- No user-friendly error pages

### Examples
```javascript
// home.jsx:59
if (error) {
  console.error(error);
  return;  // Silent failure, UI shows stale data
}

// BookingModal.jsx:72-74
if (insertError) {
  console.error("예약 실패:", insertError);
  alert("예약에 실패했습니다."); // Generic message
}
```

---

## Summary: Critical Fixes Needed

### High Priority
1. ✅ **Unify Supabase client usage** → `lib/server.js` for SSR
2. ✅ **Add authentication** → integrate `auth.users`
3. ✅ **Add `user_id` FK** to all user content tables
4. ✅ **Enable RLS** on all tables
5. ✅ **Convert client fetches to loaders/actions**
6. ✅ **Fix table/field naming** (group → posts, items clarification)

### Medium Priority
7. ✅ **Add unique constraints** (prevent double-booking)
8. ✅ **Standardize timestamps** (created_at, updated_at)
9. ✅ **Remove hardcoded credentials**
10. ✅ **Add server-side validation**

### Nice-to-Have
11. Add TypeScript types
12. Add error boundaries
13. Implement missing features (profile edit, posts)
14. Normalize booking tables
15. Cache YouTube metadata
