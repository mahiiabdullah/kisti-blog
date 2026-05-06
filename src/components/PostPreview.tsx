import { useState } from "react";

type Lang = "bn" | "en" | "ar";
const langClass: Record<Lang, string> = { bn: "font-bn", en: "font-en", ar: "font-ar" };
const langLabel: Record<Lang, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

export interface PreviewTranslation {
  lang: Lang;
  title: string;
  excerpt?: string;
  body?: string;
  footnotes: { id: number; text: string }[];
  citations: { label: string; url?: string }[];
}

export interface PreviewImage { url: string; caption?: string; position?: number; }

interface Props {
  translations: Record<Lang, PreviewTranslation>;
  coverUrl?: string;
  categoryBn?: string;
  categoryEn?: string;
  readingMinutes?: number;
  tags?: string[];
  images?: PreviewImage[];
}

const renderBody = (body: string) =>
  body.split(/\n\s*\n/).map((para, i) => {
    const parts = para.split(/(\[\^\d+\])/g);
    return (
      <p key={i}>
        {parts.map((part, j) => {
          const m = part.match(/\[\^(\d+)\]/);
          if (m) return <sup key={j}><a href={`#prev-fn-${m[1]}`} className="text-accent ml-0.5 hover:underline">[{m[1]}]</a></sup>;
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });

export function PostPreview({ translations, coverUrl, categoryBn, categoryEn, readingMinutes, tags = [], images = [] }: Props) {
  const available = (Object.keys(translations) as Lang[]).filter((l) => translations[l].title.trim());
  const [lang, setLang] = useState<Lang>(available[0] ?? "bn");
  const [exporting, setExporting] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const t = translations[lang];

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "kisti-post";

  const exportImage = async (format: "png" | "card") => {
    if (!node) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const target = format === "card" ? node.querySelector<HTMLElement>("[data-export-card]") ?? node : node;
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: format === "card" ? undefined : "#faf6ef",
      });
      const link = document.createElement("a");
      link.download = `${slugify(t.title)}-${lang}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  if (!t || !t.title.trim()) {
    return (
      <div className="text-sm text-muted-foreground italic p-8 text-center">
        Add a title in any language to see the preview.
      </div>
    );
  }

  const dir = lang === "ar" ? "rtl" : "ltr";
  const sortedImages = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div ref={setNode} className="bg-gradient-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <div className="flex gap-2">
          {available.length > 1 && available.map((l) => (
            <button key={l} onClick={() => setLang(l)} type="button"
              className={`text-[10px] px-3 py-1 border rounded-full transition-colors ${langClass[l]} ${lang === l ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {langLabel[l]}
            </button>
          ))}
        </div>
        <div className="flex gap-1" data-html2canvas-ignore>
          <button type="button" disabled={exporting} onClick={() => exportImage("card")}
            className="text-[10px] uppercase tracking-[0.15em] font-en-sans px-2 py-1 border border-border hover:bg-secondary disabled:opacity-50">
            {exporting ? "…" : "Card"}
          </button>
          <button type="button" disabled={exporting} onClick={() => exportImage("png")}
            className="text-[10px] uppercase tracking-[0.15em] font-en-sans px-2 py-1 border border-border hover:bg-secondary disabled:opacity-50">
            {exporting ? "…" : "Full PNG"}
          </button>
        </div>
      </div>


      <article className="px-6 pb-8">
        <header className="mb-8 text-center" dir={dir}>
          <div className="font-en-sans uppercase text-[9px] tracking-[0.3em] text-accent mb-4" dir="ltr">
            {lang === "bn" ? categoryBn : categoryEn}
          </div>
          <h1 className={`${langClass[lang]} text-2xl md:text-3xl leading-[1.15] mb-4`}>{t.title}</h1>
          {readingMinutes ? (
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-en-sans" dir="ltr">
              {readingMinutes} min read
            </div>
          ) : null}
        </header>

        {coverUrl && (
          <figure className="mb-8 -mx-6">
            <img src={coverUrl} alt="" className="w-full mix-blend-multiply dark:mix-blend-screen opacity-90" />
          </figure>
        )}

        {t.excerpt && (
          <p className={`${langClass[lang]} italic text-muted-foreground text-center mb-6`} dir={dir}>{t.excerpt}</p>
        )}

        {t.body && (
          <div className={`prose-kisti ${langClass[lang]} max-w-none text-sm`} dir={dir}>
            {renderBody(t.body)}
          </div>
        )}

        {sortedImages.length > 0 && (
          <div className="mt-8 space-y-6">
            {sortedImages.map((img, i) => (
              <figure key={i}>
                <img src={img.url} alt={img.caption ?? ""} className="w-full" />
                {img.caption && <figcaption className="text-center text-xs italic text-muted-foreground mt-2 font-en">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {t.footnotes.length > 0 && (
          <section className="mt-10 pt-6 border-t border-border/60" dir={dir}>
            <h2 className="font-en-sans uppercase text-[10px] tracking-[0.25em] text-muted-foreground mb-4" dir="ltr">Footnotes · টীকা</h2>
            <ol className={`${langClass[lang]} space-y-2 text-xs text-muted-foreground`}>
              {t.footnotes.map((f) => (
                <li key={f.id} id={`prev-fn-${f.id}`} className="leading-relaxed">
                  <span className="text-accent mr-2">[{f.id}]</span>{f.text}
                </li>
              ))}
            </ol>
          </section>
        )}

        {t.citations.length > 0 && (
          <section className="mt-8 pt-6 border-t border-border/60" dir={dir}>
            <h2 className="font-en-sans uppercase text-[10px] tracking-[0.25em] text-muted-foreground mb-4" dir="ltr">Citations</h2>
            <ul className={`${langClass[lang]} space-y-2 text-xs text-muted-foreground`}>
              {t.citations.map((c, i) => (
                <li key={i} className="leading-relaxed">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-foreground underline-offset-2 hover:underline">
                      {c.label || c.url}
                    </a>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 border border-border rounded-full text-muted-foreground">#{tag}</span>
            ))}
          </div>
        )}
      </article>

      {/* Off-screen square share card (1080x1080-ish at render). Used for "Card" export. */}
      <div className="absolute -left-[9999px] top-0" aria-hidden>
        <div
          data-export-card
          dir={dir}
          className={`bg-gradient-paper ${langClass[lang]}`}
          style={{ width: 1080, height: 1080, padding: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div className="font-en-sans uppercase" style={{ letterSpacing: "0.3em", fontSize: 14, color: "hsl(var(--accent))" }} dir="ltr">
            কিস্তি · kiSti{(lang === "bn" ? categoryBn : categoryEn) ? ` · ${lang === "bn" ? categoryBn : categoryEn}` : ""}
          </div>
          <div>
            <h2 style={{ fontSize: 64, lineHeight: 1.15, marginBottom: 32 }}>{t.title}</h2>
            {t.excerpt && (
              <p style={{ fontSize: 26, lineHeight: 1.5, fontStyle: "italic", color: "hsl(var(--muted-foreground))" }}>
                {t.excerpt.length > 220 ? t.excerpt.slice(0, 220) + "…" : t.excerpt}
              </p>
            )}
          </div>
          <div className="font-en-sans" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", display: "flex", justifyContent: "space-between" }} dir="ltr">
            <span>{langLabel[lang]}</span>
            <span>{readingMinutes ? `${readingMinutes} min read` : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
