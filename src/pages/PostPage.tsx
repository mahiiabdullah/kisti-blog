import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { Comments } from "@/components/Comments";
import { PhotoCardGenerator } from "@/components/PhotoCardGenerator";
import { PostPageSkeleton } from "@/components/Skeletons";
import { ShareButtons } from "@/components/ShareButtons";
import ReactMarkdown from "react-markdown";
import NotFound from "./NotFound";
import heroFallback from "@/assets/hero-kisti.jpg";

type LangCode = "bn" | "en" | "ar";
const langClass: Record<LangCode, string> = { bn: "font-bn", en: "font-en", ar: "font-ar" };
const langLabel: Record<LangCode, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

interface Translation { lang: LangCode; title: string; excerpt: string | null; body: string | null; footnotes: any; citations?: { label: string; url?: string }[]; }
interface PostData {
  id: string; slug: string; cover_url: string | null; category_bn: string | null; category_en: string | null;
  published_at: string | null; reading_minutes: number | null; author_id: string;
  post_translations: Translation[];
  post_tags: { tag: string }[];
  post_images: { url: string; caption: string | null; position: number }[];
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
}



const PostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<PostData | null>(null);
  const [lang, setLang] = useState<LangCode>("bn");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select(`id, slug, cover_url, category_bn, category_en, published_at, reading_minutes, author_id,
                 post_translations(lang, title, excerpt, body, footnotes, citations),
                 post_tags(tag),
                 post_images(url, caption, position),
                 profiles:author_id(display_name, display_name_bn)`)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (data) {
        const p = data as any as PostData;
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
    const desc = t.excerpt || "Journal of Selected Bengali Literature";
    const image = post.cover_url || (window.location.origin + heroFallback);

    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', desc);
    setMeta('og:title', title, true);
    setMeta('og:description', desc, true);
    setMeta('og:image', image, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', image);
  }, [post, lang]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />
      <PostPageSkeleton />
      <SiteFooter />
    </div>
  );
  if (!post) return <NotFound />;

  const t = post.post_translations.find((x) => x.lang === lang) ?? post.post_translations[0];
  if (!t) return <NotFound />;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const author = post.profiles?.display_name_bn ?? post.profiles?.display_name ?? "—";
  const available = post.post_translations.map((x) => x.lang);
  const sortedImages = [...post.post_images].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />
      <article className="container max-w-3xl py-16 flex-1">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-12 font-en-sans">
          <ArrowLeft className="w-3 h-3" /> ফিরে যাই
        </Link>

        <header className="mb-12 text-center" dir={dir}>
          <div className="font-en-sans uppercase text-[10px] tracking-[0.3em] text-accent mb-6" dir="ltr">
            {lang === "bn" ? post.category_bn : post.category_en}
          </div>
          <h1 className={`${langClass[lang]} text-4xl md:text-6xl leading-[1.1] mb-8`}>{t.title}</h1>
          <div className="ornament inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground font-en-sans" dir="ltr">
            <span className="font-bn normal-case tracking-normal">{author}</span>
          </div>
          {post.published_at && (
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground font-en-sans" dir="ltr">
              {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {post.reading_minutes} min read
            </div>
          )}
        </header>

        {available.length > 1 && (
          <div className="flex justify-center gap-2 mb-12">
            {available.map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs px-4 py-1.5 border rounded-full transition-colors ${langClass[l]} ${lang === l ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {langLabel[l]}
              </button>
            ))}
          </div>
        )}

        <figure className="mb-12 -mx-4 md:-mx-12">
          <img src={post.cover_url || heroFallback} alt="" className="w-full mix-blend-multiply dark:mix-blend-screen opacity-90" />
        </figure>

        {t.body && (
          <div className={`prose-kisti ${langClass[lang]} max-w-none`} dir={dir}>
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => {
                  if (props.href?.startsWith('#fn-')) {
                    return <sup className="ml-0.5"><a {...props} className="text-accent hover:underline">{props.children}</a></sup>;
                  }
                  return <a {...props} className="text-accent hover:underline decoration-border underline-offset-4" target="_blank" rel="noopener noreferrer" />;
                }
              }}
            >
              {t.body.replace(/\[\^(\d+)\]/g, '[\\[^$1\\]](#fn-$1)')}
            </ReactMarkdown>
          </div>
        )}

        {sortedImages.length > 0 && (
          <div className="mt-12 space-y-8">
            {sortedImages.map((img, i) => (
              <figure key={i}>
                <img src={img.url} alt={img.caption ?? ""} className="w-full" />
                {img.caption && <figcaption className="text-center text-sm italic text-muted-foreground mt-3 font-en">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {Array.isArray(t.footnotes) && t.footnotes.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border/60" dir={dir}>
            <h2 className="font-en-sans uppercase text-xs tracking-[0.25em] text-muted-foreground mb-6" dir="ltr">Footnotes · টীকা</h2>
            <ol className={`${langClass[lang]} space-y-3 text-sm text-muted-foreground`}>
              {t.footnotes.map((f: any) => (
                <li key={f.id} id={`fn-${f.id}`} className="leading-relaxed">
                  <span className="text-accent mr-2">[{f.id}]</span>{f.text}
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
          <ShareButtons url={window.location.href} title={t.title} />
        </div>

        <PhotoCardGenerator title={t.title} author={author} cover={post.cover_url || heroFallback} lang={lang} />

        <Comments postId={post.id} />
      </article>
      <SiteFooter />
    </div>
  );
};

export default PostPage;
