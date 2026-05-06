"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PostCardSkeleton } from "@/components/Skeletons";

type LangCode = "bn" | "en" | "ar";
const langClass: Record<string, string> = { bn: "font-bn", en: "font-en", ar: "font-ar text-right" };
const heroFallback = "/hero-kisti.jpg";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container max-w-6xl py-16"><p className="text-muted-foreground">…</p></div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const search = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("post_translations")
        .select("post_id, lang, title, excerpt, posts!inner(id, slug, cover_url, category_bn, status, published_at, reading_minutes)")
        .eq("posts.status", "published")
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,body.ilike.%${query}%`);
      const unique = new Map();
      for (const r of data ?? []) {
        if (!unique.has(r.post_id)) unique.set(r.post_id, r);
      }
      setResults(Array.from(unique.values()));
      setLoading(false);
    };
    search();
  }, [query]);

  return (
    <main className="container max-w-6xl py-16 flex-1">
      <h1 className="font-bn text-4xl mb-2">অনুসন্ধান</h1>
      {query && (
        <p className="text-muted-foreground font-en-sans text-sm mb-8">
          Results for &quot;{query}&quot; — {results.length} found
        </p>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
          {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <p className="text-center text-muted-foreground py-20 font-bn">
          {query ? "কোনো ফলাফল পাওয়া যায়নি।" : "Search for posts by title, excerpt, or content."}
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
          {results.map((r) => {
            const p = r.posts as any;
            const lang = (r.lang as LangCode) ?? "bn";
            return (
              <Link href={`/post/${p.slug}`} key={r.post_id} className="group block">
                <article>
                  <div className="overflow-hidden bg-paper-deep rounded-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover_url || heroFallback} alt="" loading="lazy" className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                  <div className="mt-4">
                    <div className="text-xs text-accent uppercase tracking-widest font-en-sans mb-2">{p.category_bn}</div>
                    <h3 className={`${langClass[lang]} text-2xl leading-tight group-hover:text-accent transition-colors`}>{r.title}</h3>
                    {r.excerpt && <p className={`${langClass[lang]} text-muted-foreground mt-2 line-clamp-2`}>{r.excerpt}</p>}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
