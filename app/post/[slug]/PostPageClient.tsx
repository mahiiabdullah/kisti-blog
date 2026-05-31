"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, BookOpen, Eye, Hash } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Comments } from "@/components/Comments";
import { PostPageSkeleton } from "@/components/Skeletons";
import { ShareButtons } from "@/components/ShareButtons";
import { ViewTracker } from "@/components/ViewTracker";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

type LangCode = "bn" | "en" | "ar";
const langClass: Record<LangCode, string> = { bn: "font-bn", en: "font-en", ar: "font-ar" };
const langLabel: Record<LangCode, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

interface Translation {
  lang: LangCode; title: string; excerpt: string | null; body: string | null;
  footnotes: any; citations?: { label: string; url?: string }[];
}
interface CategoryInfo { id: string; name_bn: string; name_en: string | null; slug?: string; }
interface RelatedPost {
  id: string; slug: string; cover_url: string | null; category_bn: string | null; published_at: string | null;
  post_translations: { lang: string; title: string }[];
}
interface PostData {
  id: string; slug: string; cover_url: string | null; category_bn: string | null; category_en: string | null;
  published_at: string | null; reading_minutes: number | null; author_id: string;
  is_translation?: boolean;
  writer?: { slug: string; name: string; bengali_name: string; bio?: string } | null;
  translator?: { slug: string; name: string; bengali_name: string } | null;
  post_stats?: { view_count: number }[] | null;
  post_translations: Translation[];
  post_tags: { tag: string }[];
  post_categories?: { categories: CategoryInfo | null }[];
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
  categories?: CategoryInfo[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

const toBengaliDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
    const bn = (n: number) => n.toString().replace(/\d/g, (x) => "০১২৩৪৫৬৭৮৯"[+x]);
    return `${bn(d.getDate())} ${months[d.getMonth()]}, ${bn(d.getFullYear())}`;
  } catch { return ""; }
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "");
  return name.substring(0, 2);
};

const extractHeadings = (html: string): { id: string; text: string }[] => {
  if (typeof window === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const items: { id: string; text: string }[] = [];
  div.querySelectorAll("h2, h3").forEach((el, i) => {
    const id = el.id || `section-${i + 1}`;
    if (!el.id) el.id = id;
    items.push({ id, text: el.textContent?.trim() ?? "" });
  });
  return items;
};

// ── Sub-components ────────────────────────────────────────────────────────

const AuthorAvatar = ({ name, size = 40 }: { name: string; size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    style={{
      width: size, height: size, fontSize: size * 0.28,
      background: "linear-gradient(135deg, hsl(40,75%,46%) 0%, hsl(38,55%,32%) 100%)",
    }}
  >
    {getInitials(name)}
  </div>
);

const TocWidget = ({ headings }: { headings: { id: string; text: string }[] }) => {
  if (headings.length === 0) return null;
  return (
    <div className="mb-6 border border-border overflow-hidden">
      <div className="bg-primary px-4 py-2.5 border-b-2 border-gold">
        <h3 className="font-bn text-sm font-bold text-gold">বিষয়সূচি</h3>
      </div>
      <div>
        {headings.map((h) => (
          <a key={h.id} href={`#${h.id}`}
            className="flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-border group-hover:bg-gold transition-colors shrink-0" />
            <span className="text-xs font-bn text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
              {h.text}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

const MostReadWidget = ({ posts }: { posts: RelatedPost[] }) => {
  if (posts.length === 0) return null;
  const bnNum = (n: number) => n.toString().replace(/\d/g, (x) => "০১২৩৪৫৬৭৮৯"[+x]).padStart(2, "০");
  return (
    <div className="mb-6 border border-border overflow-hidden">
      <div className="bg-primary px-4 py-2.5 border-b-2 border-gold">
        <h3 className="font-bn text-sm font-bold text-gold">সর্বাধিক পঠিত</h3>
      </div>
      {posts.map((p, i) => {
        const title = p.post_translations[0]?.title ?? "";
        return (
          <Link key={p.id} href={`/post/${p.slug}`}
            className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors group">
            <span className="font-en-sans text-2xl font-bold text-border group-hover:text-gold transition-colors shrink-0 leading-none pt-0.5">
              {bnNum(i + 1)}
            </span>
            <span className="text-xs font-bn text-foreground leading-snug line-clamp-3">{title}</span>
          </Link>
        );
      })}
    </div>
  );
};

const TagsWidget = ({ tags }: { tags: string[] }) => {
  if (tags.length === 0) return null;
  return (
    <div className="border border-border overflow-hidden">
      <div className="bg-primary px-4 py-2.5 border-b-2 border-gold">
        <h3 className="font-bn text-sm font-bold text-gold">বিষয়ভিত্তিক ট্যাগ</h3>
      </div>
      <div className="p-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}
            className="inline-flex items-center gap-0.5 text-[11px] font-bn px-2.5 py-1 border border-border bg-background text-muted-foreground hover:bg-primary hover:text-gold hover:border-primary transition-colors">
            <Hash className="w-2.5 h-2.5 opacity-50" />{tag}
          </Link>
        ))}
      </div>
    </div>
  );
};

// ── Main Client Component ─────────────────────────────────────────────────

export default function PostPageClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<PostData | null>(null);
  const [lang, setLang] = useState<LangCode>("bn");
  const [loading, setLoading] = useState(true);
  const [postCategories, setPostCategories] = useState<CategoryInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<RelatedPost[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id, is_translation,
                 writer:writers!posts_writer_id_fkey(slug, name, bengali_name, bio),
                 translator:writers!posts_translator_id_fkey(slug, name, bengali_name),
                 post_stats(view_count),
                 post_translations(lang, title, excerpt, body, footnotes, citations),
                 post_tags(tag),
                 post_categories(categories(id, name_bn, name_en, slug))`)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) { setError(error.message); setLoading(false); return; }

      if (data) {
        const p = data as any as PostData;

        if (p.author_id) {
          const { data: profile } = await supabase
            .from("profiles").select("display_name, display_name_bn")
            .eq("id", p.author_id).maybeSingle();
          if (profile) p.profiles = profile;
        }

        if (p.post_categories && p.post_categories.length > 0) {
          const cats = p.post_categories.map((pc) => pc.categories).filter((c): c is CategoryInfo => c != null);
          if (cats.length > 0) { setPostCategories(cats); p.categories = cats; }
        }

        setPost(p);
        const langs = p.post_translations.map((t) => t.lang);
        if (langs[0]) setLang(langs[0]);

        // Fetch related posts (same category)
        if (p.category_bn) {
          const { data: related } = await supabase
            .from("posts")
            .select("id, slug, cover_url, category_bn, published_at, post_translations(lang, title)")
            .eq("status", "published")
            .eq("category_bn", p.category_bn)
            .neq("slug", slug)
            .order("published_at", { ascending: false })
            .limit(3);
          if (related) setRelatedPosts(related as any[]);
        }

        // Popular posts
        const { data: popular } = await supabase
          .from("posts")
          .select("id, slug, cover_url, category_bn, published_at, post_translations(lang, title)")
          .eq("status", "published")
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(5);
        if (popular) setPopularPosts(popular as any[]);

        // Tags
        const { data: tagData } = await supabase.from("post_tags").select("tag").limit(20);
        if (tagData) setAllTags(Array.from(new Set((tagData as any[]).map((t: any) => t.tag as string))).slice(0, 16));
      }
      setLoading(false);
    })();
  }, [slug]);

  // Extract headings after post loads
  useEffect(() => {
    if (!post) return;
    const t = post.post_translations.find((x) => x.lang === lang) ?? post.post_translations[0];
    if (!t?.body) return;
    if (t.body.trim().startsWith("<")) {
      setHeadings(extractHeadings(t.body));
    }
  }, [post, lang]);

  if (loading) return <PostPageSkeleton />;
  if (error || !post) {
    return (
      <main className="container max-w-2xl py-32 flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="font-en-sans text-9xl font-bold text-accent/20 mb-4 tracking-tighter">404</h1>
        <h2 className="font-bn text-4xl mb-4">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h2>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 font-bn text-lg transition-all">
          প্রচ্ছদে ফিরে যান
        </Link>
      </main>
    );
  }

  const t = post.post_translations.find((x) => x.lang === lang) ?? post.post_translations[0];
  if (!t) return null;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const authorName = post.writer?.bengali_name ?? post.profiles?.display_name_bn ?? post.profiles?.display_name ?? "কিশতী";
  const available = post.post_translations.map((x) => x.lang);
  const viewCount = post.post_stats?.[0]?.view_count ?? 0;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const primaryCat = postCategories[0] ?? null;

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#fn")) {
      e.preventDefault();
      const id = target.getAttribute("href")?.substring(1);
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <ReadingProgressBar />
      <ViewTracker postId={post.id} />

      {/* ── ARTICLE HERO BANNER ──────────────────────── */}
      <section className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,168,76,0.04) 40px, rgba(201,168,76,0.04) 41px)"
        }} />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full pointer-events-none" style={{
          background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 65%)",
          transform: "translate(30%, -30%)"
        }} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-5 text-xs" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 text-white/50 hover:text-gold transition-colors font-en-sans">
              <Home className="w-3 h-3" /> প্রচ্ছদ
            </Link>
            {primaryCat && (
              <>
                <ChevronRight className="w-3 h-3 text-white/25" />
                <Link href={primaryCat.slug ? `/category/${primaryCat.slug}` : `/?cat=${primaryCat.id}`}
                  className="text-white/50 hover:text-gold transition-colors font-bn">
                  {primaryCat.name_bn}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-white/25" />
            <span className="text-white/35 font-bn line-clamp-1">{t.title}</span>
          </nav>

          {/* Category badge */}
          {(primaryCat ?? post.category_bn) && (
            <span className="inline-block bg-gold text-primary text-[11px] font-bold tracking-widest uppercase px-3 py-1 mb-4 font-en-sans">
              {primaryCat?.name_bn ?? post.category_bn}
            </span>
          )}

          {/* Title */}
          <h1 className={`${langClass[lang]} text-2xl sm:text-3xl md:text-[2.4rem] leading-snug font-bold text-white mb-6 max-w-3xl`} dir={dir}>
            {t.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2.5">
              <AuthorAvatar name={authorName} size={38} />
              <div>
                <div className="text-sm font-semibold text-gold font-bn leading-tight">
                  {post.writer ? (
                    <Link href={`/writers/${post.writer.slug}`} className="hover:text-yellow-300 transition-colors">
                      {post.writer.bengali_name}
                    </Link>
                  ) : authorName}
                </div>
                {post.is_translation && post.translator && (
                  <div className="text-xs text-white/40 font-bn">
                    অনুবাদ: <Link href={`/writers/${post.translator.slug}`} className="hover:text-gold">{post.translator.bengali_name}</Link>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-white/15" />
            <div className="flex flex-col gap-0.5">
              {post.published_at && (
                <span className="text-sm text-white/55 font-bn">{toBengaliDate(post.published_at)}</span>
              )}
              <span className="text-xs text-white/35 font-bn">পড়তে সময় লাগবে প্রায় {post.reading_minutes ?? 5} মিনিট</span>
            </div>

            {viewCount > 0 && (
              <>
                <div className="hidden sm:block w-px h-8 bg-white/15" />
                <span className="flex items-center gap-1.5 text-xs text-white/40 font-en-sans">
                  <Eye className="w-3.5 h-3.5" /> {viewCount.toLocaleString()}
                </span>
              </>
            )}

            {available.length > 1 && (
              <div className="flex gap-1.5 ml-auto">
                {available.map((l) => (
                  <button key={l} onClick={() => setLang(l as LangCode)}
                    className={`text-[11px] px-3 py-1 border transition-colors ${langClass[l as LangCode]} ${lang === l ? "bg-gold border-gold text-primary font-bold" : "border-white/25 text-white/60 hover:border-gold hover:text-gold"}`}>
                    {langLabel[l as LangCode]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PAGE BODY ───────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex gap-8 items-start">

        {/* ── MAIN ──────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* Cover image */}
          {post.cover_url && (
            <figure className="mb-0">
              <Image
                src={post.cover_url}
                alt={t.title}
                width={1200}
                height={600}
                className="w-full object-cover"
                style={{ maxHeight: "480px" }}
                priority
              />
            </figure>
          )}

          {/* Article card */}
          <article className="bg-card border border-border p-7 sm:p-10 mb-6" onClick={handleLinkClick}>
            {/* Lead / excerpt */}
            {t.excerpt && (
              <div className="font-bn text-lg leading-loose border-l-[3px] border-gold pl-5 mb-8 text-foreground/80 italic">
                {t.excerpt}
              </div>
            )}

            {/* Body */}
            {t.body && (
              <div className={`prose-kisti ${langClass[lang]} max-w-none`} dir={dir}>
                {t.body.trim().startsWith("<") ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: t.body.replace(/\[\^(\d+)\]/g, '<sup id="fnref-$1" class="ml-0.5 scroll-m-24"><a href="#fn-$1" class="text-accent hover:underline">[$1]</a></sup>')
                    }}
                    className="rich-body"
                  />
                ) : (
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => {
                        if (props.href?.startsWith("#fn-")) {
                          const fnId = props.href.replace("#fn-", "");
                          return <sup id={`fnref-${fnId}`} className="ml-0.5 scroll-m-24"><a {...props} className="text-accent hover:underline">{props.children}</a></sup>;
                        }
                        return <a {...props} className="text-accent hover:underline decoration-border underline-offset-4" target="_blank" rel="noopener noreferrer" />;
                      }
                    }}
                  >
                    {t.body.replace(/\[\^(\d+)\]/g, '[\\[^$1\\]](#fn-$1)')}
                  </ReactMarkdown>
                )}
              </div>
            )}

            {/* Footnotes */}
            {Array.isArray(t.footnotes) && t.footnotes.length > 0 && (
              <section className="mt-12 pt-8 border-t border-border/60" dir={dir}>
                <h2 className="font-en-sans uppercase text-xs tracking-[0.25em] text-muted-foreground mb-5" dir="ltr">Footnotes · টীকা</h2>
                <ol className={`${langClass[lang]} space-y-3 text-sm text-muted-foreground`}>
                  {t.footnotes.map((f: any) => (
                    <li key={f.id} id={`fn-${f.id}`} className="leading-relaxed scroll-m-24">
                      <span className="text-accent mr-2">[{f.id}]</span>
                      {f.text}
                      <a href={`#fnref-${f.id}`} className="ml-2 text-accent hover:underline inline-block" aria-label="Back">↩</a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Citations */}
            {Array.isArray(t.citations) && t.citations.length > 0 && (
              <section className="mt-10 pt-8 border-t border-border/60" dir={dir}>
                <h2 className="font-en-sans uppercase text-xs tracking-[0.25em] text-muted-foreground mb-5" dir="ltr">Citations</h2>
                <ul className={`${langClass[lang]} space-y-3 text-sm text-muted-foreground list-none`}>
                  {t.citations.map((c: any, i: number) => (
                    <li key={i} className="leading-relaxed">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                          className="hover:text-accent transition-colors underline decoration-border underline-offset-4">{c.label}</a>
                      ) : c.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          {/* Tags + Share */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6 border-t border-b border-border/60 py-4">
            <div className="flex flex-wrap gap-1.5 flex-1">
              <span className="text-xs font-bold text-muted-foreground font-bn-sans mr-1">ট্যাগ:</span>
              {post.post_tags.map(({ tag }) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}
                  className="text-xs font-bn px-3 py-1 border border-border bg-card text-muted-foreground hover:bg-primary hover:text-gold hover:border-primary transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
            <ShareButtons url={currentUrl} title={t.title} />
          </div>

          {/* Author bio */}
          {(post.writer || authorName !== "কিশতী") && (
            <div className="bg-card border border-border border-t-[3px] border-t-gold p-6 flex gap-5 items-start mb-6">
              <AuthorAvatar name={authorName} size={64} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold font-en-sans mb-1">লেখক পরিচিতি</p>
                <h3 className="font-bn text-xl font-bold text-foreground mb-2">
                  {post.writer ? (
                    <Link href={`/writers/${post.writer.slug}`} className="hover:text-gold transition-colors">
                      {post.writer.bengali_name}
                    </Link>
                  ) : authorName}
                </h3>
                {(post.writer as any)?.bio && (
                  <p className="text-sm font-bn text-muted-foreground leading-relaxed">{(post.writer as any).bio}</p>
                )}
                {post.writer && (
                  <Link href={`/writers/${post.writer.slug}`}
                    className="inline-block mt-3 text-xs text-gold font-bn hover:underline">
                    ← এই লেখকের আরও লেখা দেখুন
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Related articles */}
          {relatedPosts.length > 0 && (
            <div className="mb-8">
              <div className="bg-primary px-4 py-3 border-t-[3px] border-gold">
                <h2 className="font-bn text-base font-bold text-gold">সম্পর্কিত প্রবন্ধ</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border border-t-0 bg-card">
                {relatedPosts.map((rp, i) => {
                  const rTitle = rp.post_translations.find((x) => x.lang === "bn")?.title ?? rp.post_translations[0]?.title ?? "";
                  return (
                    <div key={rp.id} className={`p-5 ${i < relatedPosts.length - 1 ? "border-b sm:border-b-0 sm:border-r border-border" : ""}`}>
                      {rp.cover_url ? (
                        <div className="w-full h-24 overflow-hidden mb-3 bg-primary">
                          <Image src={rp.cover_url} alt={rTitle} width={300} height={96}
                            className="w-full h-full object-cover opacity-75 hover:opacity-90 transition-opacity" />
                        </div>
                      ) : (
                        <div className="w-full h-24 mb-3 bg-primary flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gold/30" />
                        </div>
                      )}
                      {rp.category_bn && (
                        <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1 font-en-sans">{rp.category_bn}</p>
                      )}
                      <Link href={`/post/${rp.slug}`}
                        className="font-bn text-sm font-bold text-foreground leading-snug hover:text-gold transition-colors line-clamp-3 block">
                        {rTitle}
                      </Link>
                      {rp.published_at && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-en-sans">{toBengaliDate(rp.published_at)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          <Comments postId={post.id} />
        </main>

        {/* ── SIDEBAR ──────────────────────────────── */}
        <aside className="w-[260px] xl:w-[280px] shrink-0 hidden lg:block">
          <div className="sticky top-[6.5rem]">
            <TocWidget headings={headings} />
            <MostReadWidget posts={popularPosts} />
            <TagsWidget tags={allTags} />
          </div>
        </aside>
      </div>
    </>
  );
}
