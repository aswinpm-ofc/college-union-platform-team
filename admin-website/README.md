# UnionHub Management Portal

Separate staff-only Vite app. Uses the same Supabase project as the public website.

## Run

Copy `.env.example` to `.env`, add the same Supabase URL and anon key, then:

```bash
npm install
npm run dev
```

The portal runs on port 5174. Authorization is checked against the `profiles.role` value; Supabase RLS remains the real security boundary.
