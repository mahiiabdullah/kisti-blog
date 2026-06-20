"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Scale, Landmark, Lightbulb, ScrollText,
  Users, PenSquare, ChevronRight, Hash,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  slug: string;
  cover_url: string | null;
  category_bn: string | null;
  category_en: string | null;
  published_at: string | null;
  reading_minutes: number | null;
  is_featured?: boolean;
  post_translations: { lang: string; title: string; excerpt: string | null }[];
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
}

interface Category {
  id: string;
  name_bn: string;
  name_en: string | null;
  slug: string | null;
  position: number;
}

interface Writer {
  id: string;
  name: string;
  bengali_name: string | null;
  post_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCategoryIcon = (nameBn: string | null) => {
  if (!nameBn) return BookOpen;
  if (nameBn.includes("ইতিহাস")) return ScrollText;
  if (nameBn.includes("আইন")) return Scale;
  if (nameBn.includes("রাষ্ট্র")) return Landmark;
  if (nameBn.includes("চিন্তা") || nameBn.includes("সমকালীন")) return Lightbulb;
  if (nameBn.includes("বই")) return BookOpen;
  if (nameBn.includes("চিন্তাবিদ")) return Users;
  return PenSquare;
};

const WRITER_COLORS = [
  "hsl(225,45%,30%)",
  "hsl(14,60%,44%)",
  "hsl(160,45%,32%)",
  "hsl(38,55%,42%)",
  "hsl(290,35%,40%)",
  "hsl(200,50%,36%)",
];

const toBengaliDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const bn = (n: number) => n.toString().replace(/\d/g, (x) => "০১২৩৪৫৬৭৮৯"[+x]);
    return `${bn(d.getDate())} ${months[d.getMonth()]} ${bn(d.getFullYear())}`;
  } catch { return ""; }
};

const getBengaliNum = (n: number) => n.toString().replace(/\d/g, (x) => "০১২৩৪৫৬৭৮৯"[+x]);

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] || "") + (parts[1][0] || "");
  return name.substring(0, 2);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Left column — large featured article */
const FeaturedCard = ({ post }: { post: Post }) => {
  const t = post.post_translations[0];
  if (!t) return null;
  const Icon = getCategoryIcon(post.category_bn);

  return (
    <article>
      <Link href={`/post/${post.slug}`} className="group block mb-3">
        <div className="aspect-[4/3] bg-primary overflow-hidden relative">
          {post.cover_url ? (
            <Image
              src={post.cover_url}
              alt={t.title}
              fill
              className="object-cover opacity-75 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary">
              <img src="/kishti%20logo.png" alt="Kisti Logo" className="w-full h-full object-cover opacity-80" />
            </div>
          )}
        </div>
      </Link>
      {post.category_bn && (
        <p className="text-[11px] font-bn-sans text-gold uppercase tracking-wider mb-1.5">{post.category_bn}</p>
      )}
      <Link href={`/post/${post.slug}`} className="group block mb-2">
        <h3 className="font-bn text-[1.35rem] leading-tight group-hover:text-gold transition-colors">{t.title}</h3>
      </Link>
      {t.excerpt && (
        <p className="text-muted-foreground text-sm font-bn leading-relaxed mb-3 line-clamp-2">{t.excerpt}</p>
      )}
      <div className="flex items-center gap-4">
        <Link href={`/post/${post.slug}`} className="flex items-center gap-0.5 text-xs font-bn-sans text-gold hover:underline">
          বিস্তারিত দেখুন <ChevronRight className="w-3 h-3" />
        </Link>
        {post.published_at && (
          <span className="text-xs text-muted-foreground font-en-sans">{toBengaliDate(post.published_at)}</span>
        )}
      </div>
    </article>
  );
};

/** Middle column — text-only article list */
const ListCard = ({ post }: { post: Post }) => {
  const t = post.post_translations[0];
  if (!t) return null;
  return (
    <div className="py-3 border-b border-border/70 last:border-0">
      <Link href={`/post/${post.slug}`} className="group block">
        {post.category_bn && (
          <p className="text-[10px] font-bn-sans text-gold uppercase tracking-wider mb-1">{post.category_bn}</p>
        )}
        <h4 className="font-bn text-[0.95rem] leading-snug mb-1.5 group-hover:text-gold transition-colors">{t.title}</h4>
        {t.excerpt && (
          <p className="text-muted-foreground text-xs font-bn line-clamp-2 mb-1">{t.excerpt}</p>
        )}
        {post.published_at && (
          <p className="text-[10px] text-muted-foreground font-en-sans">{toBengaliDate(post.published_at)}</p>
        )}
      </Link>
    </div>
  );
};

/** Right column — dark navy thumbnail card */
const ThumbCard = ({ post }: { post: Post }) => {
  const t = post.post_translations[0];
  if (!t) return null;
  const Icon = getCategoryIcon(post.category_bn);
  return (
    <Link href={`/post/${post.slug}`} className="group flex items-start gap-2.5 py-2.5 border-b border-white/10 last:border-0">
      <div className="w-14 h-14 shrink-0 bg-white/10 flex items-center justify-center overflow-hidden rounded-sm">
        {post.cover_url ? (
          <Image src={post.cover_url} alt={t.title} width={56} height={56} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
        ) : (
          <img src="/kishti%20logo.png" alt="Kisti Logo" className="w-full h-full object-cover opacity-80" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {post.category_bn && (
          <p className="text-[9px] text-gold uppercase tracking-wider mb-0.5 font-en-sans">{post.category_bn}</p>
        )}
        <h5 className="text-white text-[0.95rem] font-bn leading-snug line-clamp-3 group-hover:text-gold transition-colors">{t.title}</h5>
        {post.published_at && (
          <p className="text-white/35 text-[9px] font-en-sans mt-0.5">{toBengaliDate(post.published_at)}</p>
        )}
      </div>
    </Link>
  );
};

/** Section header bar — slim compact strip */
const SectionHeader = ({ category, hasMore }: { category: Category; hasMore: boolean }) => (
  <div className="flex items-center justify-between bg-primary px-4 py-1.5 mb-4 border-b-2 border-gold">
    <Link
      href={category.slug ? `/category/${category.slug}` : `/?cat=${category.id}`}
      className="flex items-center gap-1 group"
    >
      <h2 className="font-bn text-[1.05rem] font-semibold text-gold group-hover:text-yellow-300 transition-colors">{category.name_bn}</h2>
      <ChevronRight className="w-3.5 h-3.5 text-gold/70" />
    </Link>
    {hasMore && (
      <Link
        href={category.slug ? `/category/${category.slug}` : `/?cat=${category.id}`}
        className="text-[11px] font-bn text-white/50 hover:text-white/90 transition-colors"
      >
        সব লেখা দেখুন
      </Link>
    )}
  </div>
);

/** List item with small thumbnail on right — for category sections */
const SectionListItem = ({ post }: { post: Post }) => {
  const t = post.post_translations[0];
  if (!t) return null;
  const Icon = getCategoryIcon(post.category_bn);
  return (
    <Link href={`/post/${post.slug}`} className="group flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        {post.category_bn && (
          <p className="text-[10px] font-bn-sans text-gold uppercase tracking-wider mb-1">{post.category_bn}</p>
        )}
        <h4 className="font-bn text-[0.92rem] leading-snug mb-1 group-hover:text-gold transition-colors">{t.title}</h4>
        {t.excerpt && (
          <p className="text-muted-foreground text-xs font-bn line-clamp-2 mb-1">{t.excerpt}</p>
        )}
        {post.published_at && (
          <p className="text-[10px] text-muted-foreground font-en-sans">{toBengaliDate(post.published_at)}</p>
        )}
      </div>
      <div className="w-[72px] h-[72px] shrink-0 bg-primary/5 border border-border/40 overflow-hidden rounded-sm flex items-center justify-center">
        {post.cover_url ? (
          <Image src={post.cover_url} alt={t.title} width={72} height={72} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Icon className="w-7 h-7 text-primary/20" />
        )}
      </div>
    </Link>
  );
};

/** 2-column editorial section: featured card + list items with thumbnails */
const EditorialSection = ({ category, posts }: { category: Category; posts: Post[] }) => {
  if (posts.length === 0) return null;
  const featured = posts[0];
  const listPosts = posts.slice(1, 5);

  return (
    <section className="mb-8">
      <SectionHeader category={category} hasMore={posts.length >= 4} />
      <div className="grid grid-cols-12 gap-0 border border-border/60">
        {/* Left: featured card */}
        <div className="col-span-12 md:col-span-5 p-4 border-b md:border-b-0 md:border-r border-border/60">
          <FeaturedCard post={featured} />
        </div>

        {/* Right: stacked list items with thumbnails */}
        <div className="col-span-12 md:col-span-7 px-4 py-2">
          {listPosts.map((p) => <SectionListItem key={p.id} post={p} />)}
          {listPosts.length === 0 && (
            <p className="text-muted-foreground text-sm font-bn py-4">আরও লেখা নেই।</p>
          )}
        </div>
      </div>
    </section>
  );
};

/** Hero (top) section — same structure, no header */
const HeroSection = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) return null;
  const featured = posts[0];
  const listPosts = posts.slice(1, 4);
  const thumbPosts = posts.slice(4, 8);

  return (
    <section className="mb-8 border border-border/60">
      <div className="grid grid-cols-12 gap-0">
        <div className="col-span-12 md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-border/60">
          <FeaturedCard post={featured} />
        </div>
        <div className="col-span-12 md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-border/60">
          {listPosts.map((p) => <ListCard key={p.id} post={p} />)}
        </div>
        <div className="col-span-12 md:col-span-4 bg-primary p-4">
          {thumbPosts.map((p) => <ThumbCard key={p.id} post={p} />)}
        </div>
      </div>
    </section>
  );
};

// ─── Sidebar components ───────────────────────────────────────────────────────

const MostReadWidget = ({ posts }: { posts: Post[] }) => (
  <div className="mb-6">
    <div className="bg-primary px-4 py-1.5 mb-4 border-b-2 border-transparent">
      <h3 className="font-bn text-[1.05rem] font-semibold text-gold">সর্বাধিক পঠিত</h3>
    </div>
    <ol className="space-y-2 px-1">
      {posts.slice(0, 5).map((p, i) => {
        const t = p.post_translations[0];
        if (!t) return null;
        return (
          <li key={p.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
            <span
              className="text-[1.8rem] font-bold leading-none shrink-0 w-8 text-right text-gold opacity-90"
              style={{ opacity: `${1 - i * 0.15}` }}
            >
              {getBengaliNum(i + 1)}
            </span>
            <Link href={`/post/${p.slug}`} className="font-bn text-[0.95rem] leading-snug hover:text-gold transition-colors line-clamp-3">
              {t.title}
            </Link>
          </li>
        );
      })}
    </ol>
  </div>
);

const WritersWidget = ({ writers }: { writers: Writer[] }) => (
  <div className="mb-6">
    <div className="bg-primary px-4 py-1.5 mb-4 border-b-2 border-transparent">
      <h3 className="font-bn text-[1.05rem] font-semibold text-gold">বিশিষ্ট লেখক</h3>
    </div>
    <ul className="space-y-2 px-1">
      {writers.map((w, i) => {
        const name = w.bengali_name || w.name;
        return (
          <li key={w.id} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bn font-bold shrink-0"
              style={{ backgroundColor: WRITER_COLORS[i % WRITER_COLORS.length] }}
            >
              {getInitials(name)}
            </div>
            <p className="font-bn text-[0.95rem] font-medium leading-tight">{name}</p>
          </li>
        );
      })}
    </ul>
  </div>
);

const TagsWidget = ({ tags }: { tags: string[] }) => (
  <div className="mb-6">
    <div className="bg-primary px-4 py-1.5 mb-4 border-b-2 border-transparent">
      <h3 className="font-bn text-[1.05rem] font-semibold text-gold">বিভিন্ন ট্যাগ</h3>
    </div>
    <div className="flex flex-wrap gap-2 px-1">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/search?q=${encodeURIComponent(tag)}`}
          className="inline-flex items-center gap-1.5 text-[0.95rem] font-bn-sans px-2.5 py-1.5 border border-border rounded-sm text-muted-foreground hover:border-gold hover:text-gold transition-colors"
        >
          <Hash className="w-3.5 h-3.5 opacity-50" />{tag}
        </Link>
      ))}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [postsRes, catsRes, writersRes, tagsRes, statsRes] = await Promise.all([
          // All published posts
          (supabase as any)
            .from("posts")
            .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, is_featured,
              post_translations(lang, title, excerpt),
              profiles(display_name, display_name_bn)`)
            .eq("status", "published")
            .order("is_featured", { ascending: false, nullsFirst: false })
            .order("published_at", { ascending: false })
            .limit(120),

          // Top-level categories
          supabase
            .from("categories")
            .select("id, name_bn, name_en, slug, position")
            .is("parent_id", null)
            .order("position"),

          // Writers
          supabase
            .from("writers")
            .select("id, name, bengali_name")
            .order("name")
            .limit(6),

          // Tags
          supabase.from("post_tags").select("tag"),

          // Most read via post_stats
          supabase
            .from("post_stats")
            .select("post_id, view_count")
            .order("view_count", { ascending: false })
            .limit(10),
        ]);

        const allPosts: Post[] = postsRes.data || [];
        setPosts(allPosts);
        setCategories((catsRes.data as Category[]) || []);

        // Build most-read list
        if (statsRes.data && statsRes.data.length > 0) {
          const topIds = (statsRes.data as any[]).map((s: any) => s.post_id);
          const topPosts = topIds
            .map((id: string) => allPosts.find((p) => p.id === id))
            .filter(Boolean) as Post[];
          setMostRead(topPosts.slice(0, 5));
        } else {
          setMostRead(allPosts.slice(0, 5));
        }

        // Writers with post count
        const writerData: Writer[] = ((writersRes.data as any[]) || []).map((w: any) => ({
          id: w.id,
          name: w.name,
          bengali_name: w.bengali_name,
          post_count: allPosts.filter(
            (p) => (p as any).writer_id === w.id
          ).length,
        }));
        setWriters(writerData);

        // Unique tags
        const rawTags = (tagsRes.data as any[] || []).map((t: any) => t.tag as string);
        setAllTags(Array.from(new Set(rawTags)).slice(0, 24));
      } catch (err) {
        console.error("Homepage load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group posts by category_bn
  const postsByCategory: Record<string, Post[]> = {};
  for (const cat of categories) {
    postsByCategory[cat.name_bn] = posts.filter((p) => p.category_bn === cat.name_bn);
  }

  // Hero posts: featured first, then recent
  const heroPosts = posts.slice(0, 8);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4 animate-pulse">
            <div className="h-64 bg-secondary rounded-sm" />
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-4 bg-secondary rounded w-1/2" />
            <div className="h-48 bg-secondary rounded-sm mt-8" />
            <div className="h-48 bg-secondary rounded-sm mt-4" />
          </div>
          <div className="w-64 shrink-0 space-y-4 animate-pulse">
            <div className="h-48 bg-secondary rounded-sm" />
            <div className="h-48 bg-secondary rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1">
      {/* ── Hero section — full width ──────────────────── */}
      {heroPosts.length > 0 && <HeroSection posts={heroPosts} />}

      {/* ── Category sections + Sidebar ───────────────── */}
      <div className="grid grid-cols-12 gap-0 items-start">
        {/* Main: category editorial sections */}
        <main className="col-span-12 lg:col-span-8 lg:pr-6 min-w-0">
          {categories.map((cat) => (
            <EditorialSection
              key={cat.id}
              category={cat}
              posts={postsByCategory[cat.name_bn] || []}
            />
          ))}

          {categories.length === 0 && posts.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-bn text-muted-foreground text-lg">এখনো কোনো প্রকাশিত লেখা নেই।</p>
            </div>
          )}
        </main>

        {/* ── Right Sidebar ──────────────────────────────── */}
        <aside className="col-span-12 lg:col-span-4 shrink-0 hidden lg:block pb-8">
          <div className="sticky top-[6.5rem]">
            {mostRead.length > 0 && <MostReadWidget posts={mostRead} />}
            {writers.length > 0 && <WritersWidget writers={writers} />}
            {allTags.length > 0 && <TagsWidget tags={allTags} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
