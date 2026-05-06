import { SiteFooter } from '@/components/SiteFooter';
import { PostListSkeleton } from '@/components/Skeletons';
import { supabase } from '@/integrations/supabase/client';
import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom';
import heroFallback from "@/assets/hero-kisti.jpg";
import { SiteHeader } from '@/components/SiteHeader';

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

export default function Index() {
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat");
  const [tag, setTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 6;

  const loadPosts = async (pageToLoad: number, cat: string | null, currentTag: string | null, isReset = false) => {
    try {
      // ✅ FIX 1: Only set the correct loading state for each scenario
      if (isReset) setLoading(true);
      else setLoadingMore(true);  // ← was missing entirely

      const { data, error } = await supabase
        .from("posts")
        .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id,
               post_translations(lang, title, excerpt),
               ${currentTag ? 'post_tags!inner(tag)' : 'post_tags(tag)'}`)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .range(pageToLoad * ITEMS_PER_PAGE, (pageToLoad + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setPosts(prev => isReset ? data : [...prev, ...data]);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading posts:", error);
      setError(error?.message ?? String(error ?? "Unknown error"));
      if (isReset) setPosts([]);
      setHasMore(false);
    } finally {
      // ✅ FIX 2: Always clear the correct loading state
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
      <Link to={`/post/${p.slug}`} key={p.id} className={`group block ${primary ? "md:col-span-2" : ""}`}>
        <article className="grid md:grid-cols-12 gap-6 items-start">
          <div className={`${primary ? "md:col-span-7" : "md:col-span-12"} overflow-hidden bg-paper-deep`}>
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
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />

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
              "Between two words there is a third — unspoken, yet structurally essential."
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs uppercase tracking-[0.2em] font-en-sans text-muted-foreground">
              <span>বাংলা</span><span className="hidden sm:block w-6 h-px bg-border" /><span>English</span>
              <span className="hidden sm:block w-6 h-px bg-border" /><span className="font-ar text-base normal-case tracking-normal">العربية</span>
            </div>
          </div>
          <div className="md:col-span-5 animate-fade-in">
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
              <button onClick={() => { setTag(null); setParams({}); }} className="shrink-0 text-xs px-3 py-1 text-accent hover:underline">clear</button>
            )}
          </div>
        </section>
      )}

      <main className="container max-w-6xl py-16 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-12 gap-4">
          <h2 className="font-bn text-3xl">{activeCat ? activeCat : "সাম্প্রতিক কিস্তি"}</h2>
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

      <SiteFooter />
    </div>
  );
};