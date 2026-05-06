# কিস্তি (KiSti)

**রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র** — A multilingual Bengali literary platform.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL + Storage)
- **Language:** TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard (posts, comments, media, users)
│   ├── auth/               # Authentication page
│   ├── categories/         # Category listing
│   ├── post/[slug]/        # Dynamic post pages
│   ├── search/             # Search page
│   ├── layout.tsx          # Root layout (fonts, theme, header/footer)
│   └── page.tsx            # Homepage
├── components/             # Reusable React components
│   ├── ui/                 # shadcn/ui primitives
│   └── admin/              # Admin-specific components
├── hooks/                  # Custom React hooks (useAuth, etc.)
├── lib/                    # Utilities & Supabase client
│   └── supabase/           # Supabase client & types
├── public/                 # Static assets
└── supabase/               # Database schema & migrations
    └── master_reset.sql    # Full schema setup script
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

Deployed on [Vercel](https://kisti-next.vercel.app).

## License

MIT
