import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { PostListSkeleton } from "@/components/Skeletons";
import heroFallback from "@/assets/hero-kisti.jpg";

const langClass: Record<string, string> = {
  bn: "font-bn",
  en: "font-en",
  ar: "font-ar text-right",
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      if (!query.trim()) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Sanitize query to prevent PostgREST syntax injection
      const safeQuery = query.replace(/[%,.\\"'\(\)]/g, "").trim() || query;

      // Find matching post IDs from translations (title/body)
      const { data: tMatches } = await supabase
        .from("post_translations")
        .select("post_id")
        .or(`title.ilike.%${safeQuery}%,body.ilike.%${safeQuery}%`);

      // Find matching post IDs from tags
      const { data: tagMatches } = await supabase
        .from("post_tags")
        .select("post_id")
        .ilike("tag", `%${safeQuery}%`);

      const matchingIds = Array.from(new Set([
        ...(tMatches?.map(m => m.post_id) || []),
        ...(tagMatches?.map(m => m.post_id) || [])
      ]));

      if (matchingIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch the actual posts
      const { data } = await supabase
        .from("posts")
        .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id,
                 post_translations(lang, title, excerpt),
                 post_tags(tag),
                 profiles:author_id(display_name, display_name_bn)`)
        .in("id", matchingIds)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      setPosts(data || []);
      setLoading(false);
    };

    fetchResults();
  }, [query]);

  const renderCard = (p: any) => {
    const t = p.post_translations[0];
    if (!t) return null;
    const lang = t.lang ?? "bn";
    const dir = lang === "ar" ? "rtl" : "ltr";
    const author = p.profiles?.display_name_bn ?? p.profiles?.display_name ?? "—";

    return (
      <Link to={`/post/${p.slug}`} key={p.id} className="group block">
        <article className="grid md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-12 overflow-hidden bg-paper-deep">
            <img
              src={p.cover_url || heroFallback}
              alt=""
              loading="lazy"
              className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.02] mix-blend-multiply dark:mix-blend-screen opacity-90"
            />
          </div>
          <div className="md:col-span-12" dir={dir}>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 font-en-sans" dir="ltr">
              <span className="text-accent">{lang === "bn" ? p.category_bn : p.category_en}</span>
              <span className="w-6 h-px bg-border" />
              {p.published_at && <time>{new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>}
            </div>
            <h3 className={`${langClass[lang]} text-2xl leading-tight mb-3 group-hover:text-accent transition-colors`}>
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
      <main className="container max-w-6xl py-16 flex-1">
        <div className="mb-12 border-b border-border/60 pb-8">
          <h1 className="text-3xl font-bn font-semibold mb-2">অনুসন্ধান: "{query}"</h1>
          <p className="text-muted-foreground font-en-sans text-sm">
            {loading ? "Searching..." : `Found ${posts.length} result${posts.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {loading ? (
          <PostListSkeleton count={6} hasFeatured={false} />
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-20 font-bn">কোনো ফলাফল পাওয়া যায়নি।</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map(renderCard)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
