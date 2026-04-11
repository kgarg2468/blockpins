# Chapman BlockPins

Minimal demo app: sign in with email/password, open a Mapbox map centered on Chapman University, click to add a title/note pin, and persist pins in Supabase.

## Stack

- Next.js App Router + TypeScript
- Supabase (Auth + Postgres)
- Mapbox GL JS
- Framer Motion
- Vercel deployment target

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

4. Run Supabase SQL in your Supabase SQL Editor:

- [supabase/schema.sql](./supabase/schema.sql)

5. Start dev server:

```bash
npm run dev
```

## Behavior Implemented

- Email/password sign up + sign in
- Auth gate before map access
- Map centered at Chapman (`33.7933, -117.8513`)
- Click map to stage a pin
- Pin form with validation (`title <= 80`, `note <= 280`)
- Save pin to Supabase, then refetch pins
- Pins list sorted newest first
- Click list item or map marker to view pin info
- Collapsible desktop panel + mobile drawer
- Session persistence across reloads via Supabase auth session

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
4. Deploy.

### Mapbox token recommendation

Restrict your public token by domain in Mapbox token settings (for example your Vercel production domain and preview domain).

## Testing Notes

Current automated tests cover:

- Pin input validation rules
- Newest-first pin sorting
- Chapman map defaults
- Save-then-refetch workflow behavior

RLS ownership behavior should be verified in Supabase with two users (user A cannot read user B pins).
