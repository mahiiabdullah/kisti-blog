"use client";

import { PostListSkeleton } from "@/components/Skeletons";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type LangCode = "bn" | "en" | "ar";

interface PostRow {
  id: string;
  slug: string;
  cover_url: string | null;
  category_bn: string | null;
  category_en: string | null;
  published_at: string | null;
  reading_minutes: number | null;
  author_id: string;
  post_translations: { lang: string; title: string; excerpt: string | null }[];
  post_tags: { tag: string }[];
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
}

const langClass: Record<string, string> = {
  bn: "font-bn",
  en: "font-en",
  ar: "font-ar text-right",
};

const heroFallback = "/hero-kisti.jpg";

export default function HomePage() {
  return (
    <Suspense fallback={<PostListSkeleton count={4} hasFeatured={true} />}>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("cat"); // category ID or legacy name
  const [tag, setTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [catLabel, setCatLabel] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 6;

  const loadPosts = async (pageToLoad: number, cat: string | null, currentTag: string | null, isReset = false) => {
    try {
      if (isReset) setLoading(true);
      else setLoadingMore(true);

      let postIds: string[] | null = null;
      let legacyCatName: string | null = null;

      // If filtering by category (UUID or legacy name)
      if (cat) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(cat);
        if (isUUID) {
          // New category system: look up by ID
          // Also include children of this category
          const { data: catData } = await supabase
            .from("categories")
            .select("id, name_bn")
            .or(`id.eq.${cat},parent_id.eq.${cat}`);
          
          if (catData && catData.length > 0) {
            const foundName = catData.find(c => c.id === cat)?.name_bn ?? catData[0].name_bn;
            setCatLabel(foundName);
            legacyCatName = foundName;
            const catIds = catData.map(c => c.id);
            const { data: pcData } = await supabase
              .from("post_categories")
              .select("post_id")
              .in("category_id", catIds);
            postIds = pcData?.map(pc => pc.post_id) ?? [];
          }
        } else {
          // Legacy: filter by category_bn text
          setCatLabel(cat);
          legacyCatName = cat;
        }
      } else {
        setCatLabel(null);
      }

      let query = supabase
        .from("posts")
        .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id,
               post_translations(lang, title, excerpt),
               ${currentTag ? 'post_tags!inner(tag)' : 'post_tags(tag)'}`)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      // Apply filter
      if (postIds !== null) {
        if (postIds.length === 0) {
          if (legacyCatName) {
            // Fallback entirely to legacy text
            query = query.eq("category_bn", legacyCatName);
          } else {
            // No matching posts
            setPosts(isReset ? [] : posts);
            setHasMore(false);
            if (isReset) setLoading(false);
            else setLoadingMore(false);
            return;
          }
        } else {
          if (legacyCatName) {
            // Mix of new and legacy
            query = query.or(`id.in.(${postIds.join(',')}),category_bn.eq.${legacyCatName}`);
          } else {
            query = query.in("id", postIds);
          }
        }
      } else if (cat && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(cat)) {
        // Legacy text-based filter
        query = query.eq("category_bn", cat);
      }

      const { data, error: fetchError } = await query
        .range(pageToLoad * ITEMS_PER_PAGE, (pageToLoad + 1) * ITEMS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      setPosts(prev => isReset ? (data ?? []) : [...prev, ...(data ?? [])]);
      setHasMore((data?.length ?? 0) === ITEMS_PER_PAGE);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      setError(error?.message ?? String(error ?? "Unknown error"));
      if (isReset) setPosts([]);
      setHasMore(false);
    } finally {
      if (isReset) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, activeCat, tag, false);
  };

  useEffect(() => {
    setPage(0);
    loadPosts(0, activeCat, tag, true);
  }, [activeCat, tag]);

  const featured = posts[0];
  const rest = posts.slice(1);
  const allTags = Array.from(new Set(posts.flatMap((p) => (p.post_tags ?? []).map((t) => t.tag))));

  const renderCard = (p: PostRow, primary = false) => {
    const t = p.post_translations[0];
    if (!t) return null;
    const lang = (t.lang as LangCode) ?? "bn";
    const dir = lang === "ar" ? "rtl" : "ltr";
    const author = p.profiles?.display_name_bn ?? p.profiles?.display_name ?? "—";

    return (
      <Link href={`/post/${p.slug}`} key={p.id} className={`group block ${primary ? "md:col-span-2" : ""}`}>
        <article className="grid md:grid-cols-12 gap-6 items-start">
          <div className={`${primary ? "md:col-span-7" : "md:col-span-12"} overflow-hidden bg-paper-deep`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.cover_url || heroFallback}
              alt=""
              loading="lazy"
              className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.02] mix-blend-multiply dark:mix-blend-screen opacity-90"
            />
          </div>
          <div className={primary ? "md:col-span-5" : "md:col-span-12"} dir={dir}>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 font-en-sans" dir="ltr">
              <span className="text-accent">{lang === "bn" ? p.category_bn : p.category_en}</span>
              <span className="w-6 h-px bg-border" />
              {p.published_at && <time>{new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>}
            </div>
            <h3 className={`${langClass[lang]} ${primary ? "text-3xl md:text-4xl" : "text-2xl"} leading-tight mb-3 group-hover:text-accent transition-colors`}>
              {t.title}
            </h3>
            {t.excerpt && (
              <p className={`${langClass[lang]} text-muted-foreground leading-relaxed mb-4`}>{t.excerpt}</p>
            )}
            <div className="font-en-sans text-xs text-muted-foreground" dir="ltr">
              <span className="font-bn">{author}</span>
              <span className="mx-2">·</span>
              <span>{p.reading_minutes ?? 5} min read</span>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  return (
    <>
      <section className="relative border-b border-border/60 paper-texture">
        <div className="container max-w-6xl py-20 md:py-28 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 animate-fade-up">
            <div className="font-bn uppercase text-xs tracking-[0.3em] text-accent mb-6">
              রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র
            </div>
            <h1 className="font-bn text-5xl md:text-7xl leading-[1.05] text-foreground mb-6">
              চিন্তার <span className="text-accent italic">কিস্তি</span>
            </h1>
            <p className="font-en text-xl md:text-2xl italic text-muted-foreground leading-relaxed max-w-xl">
              &quot;Between two words there is a third — unspoken, yet structurally essential.&quot;
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs uppercase tracking-[0.2em] font-en-sans text-muted-foreground">
              <span>বাংলা</span><span className="hidden sm:block w-6 h-px bg-border" /><span>English</span>
              <span className="hidden sm:block w-6 h-px bg-border" /><span className="font-ar text-base normal-case tracking-normal">العربية</span>
            </div>
          </div>
          <div className="md:col-span-5 animate-fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroFallback} alt="A solitary boat drifting on still water" width={1536} height={1024} className="w-full mix-blend-multiply dark:mix-blend-screen opacity-90" />
          </div>
        </div>
      </section>

      {allTags.length > 0 && (
        <section className="border-b border-border/60 bg-background/40">
          <div className="container max-w-6xl py-5 flex items-center gap-3 overflow-x-auto">
            <span className="font-en-sans uppercase text-[10px] tracking-[0.25em] text-muted-foreground shrink-0">Tags ·</span>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTag(tag === t ? null : t)}
                className={`shrink-0 text-xs px-3 py-1 border rounded-full transition-colors ${tag === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                {t}
              </button>
            ))}
            {(activeCat || tag) && (
              <Link href="/" onClick={() => setTag(null)} className="shrink-0 text-xs px-3 py-1 text-accent hover:underline">clear</Link>
            )}
          </div>
        </section>
      )}

      <main className="container max-w-6xl py-16 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-12 gap-4">
          <h2 className="font-bn text-3xl">{catLabel ?? "সাম্প্রতিক কিস্তি"}</h2>
          <span className="font-en italic text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "piece" : "pieces"} loaded</span>
        </div>

        {error && (
          <p className="text-center text-red-500 py-6 font-bn">{error}</p>
        )}

        {loading ? (
          <PostListSkeleton count={4} hasFeatured={true} />
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-20 font-bn">এখনো কোনো প্রকাশিত লেখা নেই। অ্যাডমিন প্যানেল থেকে লিখুন।</p>
        ) : (
          <>
            {featured && (
              <div className="mb-20 pb-20 border-b border-border/60">
                <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-6">◆ Featured</div>
                {renderCard(featured, true)}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-16 mb-16">
              {rest.map((p) => renderCard(p))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 font-bn-sans text-sm tracking-widest transition-colors border border-border text-foreground hover:bg-foreground hover:text-background disabled:opacity-50"
                >
                  {loadingMore ? "লোড হচ্ছে..." : "আরও দেখুন"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
