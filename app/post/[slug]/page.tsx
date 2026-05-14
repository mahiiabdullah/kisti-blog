"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Home, ChevronRight, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Comments } from "@/components/Comments";
import { PhotoCardGenerator } from "@/components/PhotoCardGenerator";
import { PostPageSkeleton } from "@/components/Skeletons";
import { ShareButtons } from "@/components/ShareButtons";
import { ViewTracker } from "@/components/ViewTracker";
import ReactMarkdown from "react-markdown";

type LangCode = "bn" | "en" | "ar";
const langClass: Record<LangCode, string> = { bn: "font-bn", en: "font-en", ar: "font-ar" };
const langLabel: Record<LangCode, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

const heroFallback = "/hero-kisti.jpg";

interface Translation { lang: LangCode; title: string; excerpt: string | null; body: string | null; footnotes: any; citations?: { label: string; url?: string }[]; }
interface CategoryInfo {
  id: string;
  name_bn: string;
  name_en: string | null;
  slug?: string;
}

interface PostData {
  id: string; slug: string; cover_url: string | null; category_bn: string | null; category_en: string | null;
  published_at: string | null; reading_minutes: number | null; author_id: string;
  is_translation?: boolean;
  writer?: { slug: string; name: string; bengali_name: string } | null;
  translator?: { slug: string; name: string; bengali_name: string } | null;
  post_stats?: { view_count: number }[] | null;
  post_translations: Translation[];
  post_tags: { tag: string }[];
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
  categories?: CategoryInfo[];
}

const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "এইমাত্র";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} দিন আগে`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} মাস আগে`;
  const years = Math.floor(months / 12);
  return `${years} বছর আগে`;
};

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [lang, setLang] = useState<LangCode>("bn");
  const [loading, setLoading] = useState(true);
  const [postCategories, setPostCategories] = useState<CategoryInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id, is_translation,
                 writer:writers!posts_writer_id_fkey(slug, name, bengali_name),
                 translator:writers!posts_translator_id_fkey(slug, name, bengali_name),
                 post_stats(view_count),
                 post_translations(lang, title, excerpt, body, footnotes, citations),
                 post_tags(tag)`)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        console.error("Error loading post:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const p = data as any as PostData;
        
        // Manually fetch author profile due to missing DB foreign key mapping
        if (p.author_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, display_name_bn")
            .eq("id", p.author_id)
            .maybeSingle();
          if (profile) {
            p.profiles = profile;
          }
        }

        // Fetch categories from the junction table (two simple queries, no join)
        const { data: pcData } = await supabase
          .from("post_categories")
          .select("category_id")
          .eq("post_id", p.id);

        if (pcData && pcData.length > 0) {
          const catIds = pcData.map((pc: any) => pc.category_id);
          const { data: catDetails } = await supabase
            .from("categories")
            .select("id, name_bn, name_en, slug")
            .in("id", catIds);
          
          if (catDetails && catDetails.length > 0) {
            setPostCategories(catDetails as CategoryInfo[]);
            p.categories = catDetails as CategoryInfo[];
          }
        }

        setPost(p);
        const langs = p.post_translations.map((t) => t.lang);
        if (langs[0]) setLang(langs[0]);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const t = post.post_translations.find((x) => x.lang === lang) ?? post.post_translations[0];
    if (!t) return;
    const siteName = "কিস্তি (KiSti)";
    const title = `${t.title} - ${siteName}`;
    document.title = title;
  }, [post, lang]);

  if (loading) return <PostPageSkeleton />;
  if (error || !post) {
    return (
      <main className="container max-w-2xl py-32 flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="font-en-sans text-9xl font-bold text-accent/20 mb-4 tracking-tighter">404</h1>
        <h2 className="font-bn text-4xl mb-4">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h2>
        <Link href="/" className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-accent hover:text-white px-6 py-3 rounded-full font-bn text-lg transition-all">
          প্রচ্ছদে ফিরে যান
        </Link>
      </main>
    );
  }

  const t = post.post_translations.find((x) => x.lang === lang) ?? post.post_translations[0];
  if (!t) return null;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const author = post.profiles?.display_name_bn ?? post.profiles?.display_name ?? "—";
  const available = post.post_translations.map((x) => x.lang);
  const categoryDisplay = lang === "bn" ? post.category_bn : post.category_en;
  const hasNewCategories = postCategories.length > 0;
  const dateFormatted = post.published_at
    ? new Date(post.published_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const viewCount = post.post_stats?.[0]?.view_count ?? 0;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#fn')) {
      e.preventDefault();
      const id = target.getAttribute('href')?.substring(1);
      if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <div className="bg-background border-b border-border/60">
        <div className="container max-w-4xl py-6 md:py-8">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-bn-sans mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="w-3 h-3" />
              <span>প্রচ্ছদ</span>
            </Link>
            {hasNewCategories ? (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <Link href={postCategories[0].slug ? `/category/${postCategories[0].slug}` : `/?cat=${postCategories[0].id}`} className="hover:text-foreground transition-colors">
                  {lang === "bn" ? postCategories[0].name_bn : (postCategories[0].name_en || postCategories[0].name_bn)}
                </Link>
              </>
            ) : categoryDisplay ? (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <Link href={`/?cat=${encodeURIComponent(post.category_bn || "")}`} className="hover:text-foreground transition-colors">
                  {categoryDisplay}
                </Link>
              </>
            ) : null}
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-foreground/70 line-clamp-1">{t.title}</span>
          </nav>

          <div className="flex flex-wrap gap-2 mb-4">
            {hasNewCategories ? (
              postCategories.map((cat) => (
                <Link key={cat.id} href={cat.slug ? `/category/${cat.slug}` : `/?cat=${cat.id}`} className="inline-block text-xs font-bn-sans px-3 py-1 bg-accent text-white rounded-sm hover:bg-accent/90 transition-colors">
                  {lang === "bn" ? cat.name_bn : (cat.name_en || cat.name_bn)}
                </Link>
              ))
            ) : post.category_bn ? (
              <Link href={`/?cat=${encodeURIComponent(post.category_bn)}`} className="inline-block text-xs font-bn-sans px-3 py-1 bg-accent text-white rounded-sm hover:bg-accent/90 transition-colors">
                {post.category_bn}
              </Link>
            ) : null}
            {post.post_tags.slice(0, 2).map(({ tag }) => (
              <span key={tag} className="inline-block text-xs font-bn-sans px-3 py-1 bg-secondary text-foreground/80 rounded-sm">
                {tag}
              </span>
            ))}
          </div>

          <h1 className={`${langClass[lang]} text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] leading-[1.25] md:leading-[1.2] font-bold mb-5`} dir={dir}>
            {t.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 text-sm text-muted-foreground mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {post.is_translation ? (
                <>
                  <span className="font-bn text-foreground font-medium flex gap-2 items-center">
                    <span className="text-muted-foreground text-xs font-bn">মূল লেখক:</span> 
                    {post.writer ? <Link href={`/writers/${post.writer.slug}`} className="hover:text-accent transition-colors">{post.writer.bengali_name}</Link> : "—"}
                  </span>
                  <span className="hidden sm:inline mx-3 text-border">·</span>
                  <span className="font-bn text-foreground font-medium flex gap-2 items-center">
                    <span className="text-muted-foreground text-xs font-bn">অনুবাদ:</span> 
                    {post.translator ? <Link href={`/writers/${post.translator.slug}`} className="hover:text-accent transition-colors">{post.translator.bengali_name}</Link> : "—"}
                  </span>
                </>
              ) : (
                <span className="font-bn text-foreground font-medium flex gap-2 items-center">
                  <span className="text-muted-foreground text-xs font-bn">লেখক:</span> 
                  {post.writer ? <Link href={`/writers/${post.writer.slug}`} className="hover:text-accent transition-colors">{post.writer.bengali_name}</Link> : author}
                </span>
              )}
            </div>
            {post.published_at && (
              <>
                <span className="hidden sm:inline mx-3 text-border">·</span>
                <span className="font-bn-sans text-xs sm:text-sm">{timeAgo(post.published_at)}</span>
                <span className="hidden sm:inline mx-3 text-border">·</span>
                <span className="hidden sm:inline font-bn-sans text-xs sm:text-sm">{dateFormatted}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground font-bn-sans flex-wrap">
            {dateFormatted && <span className="sm:hidden">{dateFormatted}</span>}
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {post.reading_minutes ?? 5} মিনিটে পড়ুন
            </span>
            {viewCount > 0 && (
              <>
                <span className="hidden sm:inline text-border">·</span>
                <span className="flex items-center gap-1">
                  👁 {viewCount}
                </span>
              </>
            )}
          </div>

          {available.length > 1 && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
              {available.map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`text-xs px-4 py-1.5 border rounded-full transition-colors ${langClass[l]} ${lang === l ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {langLabel[l]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <figure className="container max-w-4xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.cover_url || heroFallback} alt={t.title} className="w-full aspect-video object-cover rounded-sm" />
      </figure>

      <article className="container max-w-3xl py-12 md:py-16 flex-1" onClick={handleLinkClick}>
        {t.body && (
          <div className={`prose-kisti ${langClass[lang]} max-w-none`} dir={dir}>
            {t.body.trim().startsWith("<") ? (
              /* Rich text HTML from TipTap editor */
              <div dangerouslySetInnerHTML={{ __html: t.body.replace(/\[\^(\d+)\]/g, '<sup id="fnref-$1" class="ml-0.5 scroll-m-24"><a href="#fn-$1" class="text-accent hover:underline">[$1]</a></sup>') }} className="rich-body" />
            ) : (
              /* Legacy Markdown rendering */
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => {
                    if (props.href?.startsWith('#fn-')) {
                      const fnId = props.href.replace('#fn-', '');
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
        {Array.isArray(t.footnotes) && t.footnotes.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border/60" dir={dir}>
            <h2 className="font-en-sans uppercase text-xs tracking-[0.25em] text-muted-foreground mb-6" dir="ltr">Footnotes · টীকা</h2>
            <ol className={`${langClass[lang]} space-y-3 text-sm text-muted-foreground`}>
              {t.footnotes.map((f: any) => (
                <li key={f.id} id={`fn-${f.id}`} className="leading-relaxed scroll-m-24">
                  <span className="text-accent mr-2">[{f.id}]</span>
                  {f.text}
                  <a href={`#fnref-${f.id}`} className="ml-2 text-accent hover:underline inline-block" aria-label="Back to content">↩</a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {Array.isArray(t.citations) && t.citations.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border/60" dir={dir}>
            <h2 className="font-en-sans uppercase text-xs tracking-[0.25em] text-muted-foreground mb-6" dir="ltr">Citations</h2>
            <ul className={`${langClass[lang]} space-y-3 text-sm text-muted-foreground list-none`}>
              {t.citations.map((c: any, i: number) => (
                <li key={i} className="leading-relaxed">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline decoration-border underline-offset-4">
                      {c.label}
                    </a>
                  ) : (
                    c.label
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {post.post_tags.map(({ tag }) => (
              <span key={tag} className="text-xs px-3 py-1 border border-border rounded-full text-muted-foreground">#{tag}</span>
            ))}
          </div>
          <ShareButtons url={currentUrl} title={t.title} />
        </div>

        <PhotoCardGenerator
          title={t.title}
          author={author}
          cover={post.cover_url || heroFallback}
          lang={lang}
          date={post.published_at}
          categoryBn={post.category_bn}
        />

        <Comments postId={post.id} />
      </article>
      <ViewTracker postId={post.id} />
    </>
  );
}
