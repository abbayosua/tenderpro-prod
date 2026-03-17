# Supabase Credentials

> ⚠️ **IMPORTANT**: Keep this file secure and do not commit to public repositories!

---

## Database Connection

**Connection URL:**
```
postgresql://postgres.rzdivjatiblysmohhvkz:890iop%2A%28%29IOP@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct URL (for migrations):**
```
postgresql://postgres.rzdivjatiblysmohhvkz:890iop%2A%28%29IOP@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

> **Password:** `890iop*()IOP` (URL encoded: `890iop%2A%28%29IOP`)

---

## API Keys

**Project URL:**
```
https://rzdivjatiblysmohhvkz.supabase.co
```

**Anon Key (Public - safe for frontend):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGl2amF0aWJseXNtb2hodmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzkxNjAsImV4cCI6MjA4OTI1NTE2MH0.pPLZdrezWK8yJ7ROyVwkqCxK1O-SHBijVMIbQ9qxb7o
```

**Service Role Key (Secret - backend only!):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGl2amF0aWJseXNtb2hodmt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3OTE2MCwiZXhwIjoyMDg5MjU1MTYwfQ.b7cYC5PjFpkKpQpz9Mzsu_V_RYAM0JFo5xeei3snBRE
```

---

## Project Reference

- **Project ID:** `rzdivjatiblysmohhvkz`
- **Region:** `ap-northeast-1` (AWS Tokyo)

---

## Environment Variables

Add these to your `.env` file:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.rzdivjatiblysmohhvkz:890iop%2A%28%29IOP@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rzdivjatiblysmohhvkz:890iop%2A%28%29IOP@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://rzdivjatiblysmohhvkz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGl2amF0aWJseXNtb2hodmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzkxNjAsImV4cCI6MjA4OTI1NTE2MH0.pPLZdrezWK8yJ7ROyVwkqCxK1O-SHBijVMIbQ9qxb7o"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGl2amF0aWJseXNtb2hodmt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3OTE2MCwiZXhwIjoyMDg5MjU1MTYwfQ.b7cYC5PjFpkKpQpz9Mzsu_V_RYAM0JFo5xeei3snBRE"
```

---

## Notes

- Password: `890iop*()IOP` (special characters URL-encoded as `%2A%28%29`)
- Anon key is safe to use in frontend code
- Service role key should ONLY be used in backend/server-side code
- Never expose service role key to the client

---

*Created: March 2025*
