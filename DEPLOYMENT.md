# কিস্তি (kiSti) — Deployment & Developer Guide

This document explains two things:

1. **How to launch this site on your own domain / your own server.**
2. **A brief guideline for any future developer who picks up the codebase.**

---

## 1. Tech stack at a glance

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS v3 + shadcn/ui
- **Routing:** React Router (SPA, `BrowserRouter`)
- **Backend:** Supabase — Postgres, Auth, Storage, Edge Functions
- **Auth model:** Email/password + roles in `public.user_roles` (`super_admin`, `admin`, `user`)
- **Content model:** `posts` + `post_translations` (bn / en / ar) + `post_tags` + `post_images` + `comments`

The frontend is a fully static SPA. The backend is fully managed by Supabase.

---

## 2. Deployment Guide

1. Push your code to a static host (Vercel, Netlify, Cloudflare Pages).
2. Connect your domain in the host's dashboard.
3. Add your Supabase environment variables in the host's dashboard.

---

## 3. Hosting your own
The **frontend** can be hosted anywhere static (Vercel, Netlify, Cloudflare Pages, S3+CloudFront…). The **backend is on Supabase**.

### 3.1 Build the frontend

Requirements: **Node 20+** and **bun** (or npm).

```bash
# Install dependencies
bun install

# Production build → outputs to ./dist
bun run build

# Optional: preview the production build locally
bun run preview
```

The `dist/` folder is everything you need to deploy.

### 3.2 Environment variables

Create a `.env` file at the project root (already present in this repo for the Lovable backend):

```
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-ref>"
```

These are **publishable** keys — safe to ship in the bundle. The actual security comes from Postgres Row-Level Security policies (see `supabase/migrations/`).

> If you migrate the backend to your own Supabase project, also re-run the SQL files in `supabase/migrations/` against it, then update these three values.

### 3.3 Deploy `dist/` to a server

#### Option A — Nginx on a VPS

```nginx
server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  root /var/www/kisti/dist;
  index index.html;

  # SPA fallback — required so /post/:slug, /admin, /auth refresh correctly
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Long cache for hashed assets
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

Then add HTTPS with Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Option B — Caddy (auto HTTPS)

```
yourdomain.com {
  root * /var/www/kisti/dist
  try_files {path} /index.html
  file_server
  encode gzip
}
```

#### Option C — Static hosts (Vercel / Netlify / Cloudflare Pages)

- Build command: `bun run build`
- Output dir: `dist`
- Add a SPA fallback rewrite: `/* → /index.html` (status 200).
- Add the three `VITE_…` env vars in the host's dashboard.

### 3.4 Continuous deployment (optional)

Minimal GitHub Actions workflow:

```yaml
name: deploy
on: { push: { branches: [main] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
      # then rsync ./dist to your server, or upload to S3/Pages/etc.
```

---

## 4. Guideline for a future developer

A short orientation so a new dev can be productive in ~30 minutes.

### 4.1 Project layout

```
src/
  pages/                 Top-level routes
    Index.tsx            Home (post list)
    PostPage.tsx         Single post w/ language switcher, footnotes, citations
    Auth.tsx             Sign in / sign up (first user becomes super_admin)
    admin/               Admin dashboard (gated by RequireAdmin)
      AdminPosts.tsx
      AdminPostEditor.tsx   ← multilingual editor + live preview pane
      AdminComments.tsx
      AdminMedia.tsx
      AdminUsers.tsx
  components/
    PostPreview.tsx      Live preview + PNG/share-card export (html-to-image)
    PhotoCardGenerator.tsx
    Comments.tsx
    SiteHeader.tsx / SiteFooter.tsx / AdminLayout.tsx / RequireAdmin.tsx
    ui/                  shadcn primitives — do not hand-edit
  hooks/useAuth.ts       Session + roles (reads public.user_roles)
  integrations/supabase/ Auto-generated client + types — DO NOT EDIT
  index.css              Design tokens (HSL), font families, prose styles
supabase/
  config.toml            Project ref only
  migrations/            All schema + RLS — source of truth for the DB
```

### 4.2 Conventions to keep

- **Design tokens only.** Never use raw colors like `text-white` or `bg-[#000]` in components. Add semantic tokens in `src/index.css` and `tailwind.config.ts`, then use them (`bg-background`, `text-foreground`, `text-accent`, …). All colors are HSL.
- **Fonts:** `font-bn` (Noto Serif Bengali), `font-bn-sans` (Hind Siliguri), `font-en` (Cormorant Garamond), `font-en-sans` (Inter), `font-ar` (Amiri). Pick by language.
- **RTL:** Arabic uses `dir="rtl"` — see `PostPage.tsx` and `PostPreview.tsx` for the pattern.
- **Roles live in `public.user_roles`**, never on `profiles`. Always check via the `public.has_role(uid, role)` SECURITY DEFINER function in RLS policies — never query `user_roles` directly inside another table's policy.
- **Never edit** `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, or `supabase/config.toml`'s `project_id` — those are generated.
- **Database changes go through migrations** in `supabase/migrations/`. One file per logical change, timestamped.
- **No backend server in this repo.** Anything backend → Supabase Edge Functions under `supabase/functions/<name>/index.ts` (none yet, but that's where they'd go).

### 4.3 Common tasks

| Task | Where |
|---|---|
| Add a new page | `src/pages/Foo.tsx` + register in `src/App.tsx` |
| Add a new admin section | `src/pages/admin/Foo.tsx` + nested route in `App.tsx` + link in `AdminLayout.tsx` |
| Add a column to `posts` | New migration in `supabase/migrations/` (the types file regenerates automatically) |
| Add a footnote/citation feature | Extend `renderBody` in `PostPage.tsx` and the matching renderer in `PostPreview.tsx` |
| Promote a user to admin | Insert into `public.user_roles (user_id, role)` from the Supabase dashboard |

### 4.4 Local dev

```bash
bun install
bun run dev          # http://localhost:8080
bun run lint
bunx vitest run      # tests
```

The dev server uses the Supabase backend defined in `.env`.

### 4.5 Things explicitly NOT to do

- Don't store roles on the `profiles` table (privilege-escalation risk).
- Don't bypass RLS by using a service-role key in the frontend.
- Don't use anonymous sign-ups.
- Don't add a Node/Express backend to this repo — it won't deploy. Use Edge Functions.
- Don't put `<noscript><img>` pixels in `<head>` of `index.html` — browsers reject it. Put them in `<body>`.

---

- **Supabase docs:** https://supabase.com/docs

---

_Last updated: 2026-05-04_
