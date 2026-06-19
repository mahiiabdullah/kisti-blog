"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Search, Clock, BookOpen } from "lucide-react";

type LangCode = "bn" | "en" | "ar";
const langClass: Record<string, string> = { bn: "font-bn", en: "font-en", ar: "font-ar text-right" };

function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

const toBengaliDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
    const bn = (n: number) => n.toString().replace(/\d/g, (x) => "০১২৩৪৫৬৭৮৯"[+x]);
    return `${bn(d.getDate())} ${months[d.getMonth()]} ${bn(d.getFullYear())}`;
  } catch { return ""; }
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container max-w-6xl py-16"><p className="text-muted-foreground font-bn">…</p></div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce: update URL + fire search 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed !== query) {
        setQuery(trimmed);
        const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
        router.replace(url, { scroll: false });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue, query, router]);

  const doSearch = useCallback(async (q: string) => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("post_translations")
      .select(`post_id, lang, title, excerpt,
               posts!inner(id, slug, cover_url, category_bn, status, published_at, reading_minutes)`)
      .eq("posts.status", "published")
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,body.ilike.%${q}%`);

    const unique = new Map<string, any>();
    for (const r of data ?? []) {
      if (!unique.has(r.post_id)) unique.set(r.post_id, r);
    }
    setResults(Array.from(unique.values()));
    setLoading(false);
  }, []);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  return (
    <main className="flex-1">
      {/* Search hero */}
      <div className="bg-primary border-b-2 border-gold">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h1 className="font-bn text-3xl md:text-4xl font-bold text-white mb-6">অনুসন্ধান</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            <input
              id="search-input"
              type="search"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="শিরোনাম, উদ্ধৃতি বা বিষয়বস্তু খুঁজুন…"
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 font-bn text-lg pl-12 pr-4 py-3 outline-none focus:border-gold focus:bg-white/15 transition-colors"
            />
          </div>
          {query && !loading && (
            <p className="mt-3 text-sm text-white/50 font-en-sans">
              &ldquo;{query}&rdquo; — {results.length} টি ফলাফল
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {!query && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-border mx-auto mb-4" />
            <p className="font-bn text-xl text-muted-foreground">কিছু লিখুন অনুসন্ধান করতে</p>
          </div>
        )}

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-secondary rounded-sm aspect-video mb-3" />
                <div className="h-3 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-5 bg-secondary rounded mb-1" />
                <div className="h-4 bg-secondary rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-20">
            <p className="font-bn text-xl text-muted-foreground mb-2">কোনো ফলাফল পাওয়া যায়নি</p>
            <p className="font-bn text-sm text-muted-foreground/60">&ldquo;{query}&rdquo; — এই বিষয়ে কোনো প্রবন্ধ নেই</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((r) => {
              const p = r.posts as any;
              const lang = (r.lang as LangCode) ?? "bn";
              const titleHtml = highlight(r.title ?? "", query);
              const excerptHtml = r.excerpt ? highlight(r.excerpt.slice(0, 120), query) : null;
              return (
                <Link href={`/post/${p.slug}`} key={r.post_id} className="group block">
                  <article className="bg-card border border-border hover:border-gold/50 transition-colors overflow-hidden">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-primary overflow-hidden relative">
                      {p.cover_url ? (
                        <Image
                          src={p.cover_url}
                          alt={r.title ?? ""}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img src="/kishti%20logo.png" alt="Kisti Logo" className="w-12 h-12 object-contain opacity-20" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {p.category_bn && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-gold font-en-sans mb-2">
                          {p.category_bn}
                        </span>
                      )}
                      <h3
                        className={`${langClass[lang]} text-base font-bold leading-snug text-foreground group-hover:text-gold transition-colors mb-2 line-clamp-2`}
                        dangerouslySetInnerHTML={{ __html: titleHtml }}
                      />
                      {excerptHtml && (
                        <p
                          className={`${langClass[lang]} text-sm text-muted-foreground line-clamp-2 leading-relaxed`}
                          dangerouslySetInnerHTML={{ __html: excerptHtml }}
                        />
                      )}
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground font-en-sans">
                        {p.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {toBengaliDate(p.published_at)}
                          </span>
                        )}
                        {p.reading_minutes && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {p.reading_minutes} মিনিট
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Search highlight style */}
      <style>{`
        mark {
          background: hsl(40 75% 46% / 0.25);
          color: inherit;
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </main>
  );
}
