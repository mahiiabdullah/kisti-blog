"use client";

import { useState } from "react";

type Lang = "bn" | "en" | "ar";
const langClass: Record<Lang, string> = { bn: "font-bn", en: "font-en", ar: "font-ar" };
const langLabel: Record<Lang, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

export interface PreviewTranslation {
  lang: Lang; title: string; excerpt?: string; body?: string;
  footnotes: { id: number; text: string }[];
  citations: { label: string; url?: string }[];
}

interface Props {
  translations: Record<Lang, PreviewTranslation>; coverUrl?: string;
  categoryBn?: string; categoryEn?: string; readingMinutes?: number;
  tags?: string[];
}

const renderBody = (body: string) => {
  if (body.trim().startsWith("<")) {
    return <div dangerouslySetInnerHTML={{ __html: body.replace(/\[\^(\d+)\]/g, '<sup id="prev-fnref-$1" class="ml-0.5 scroll-m-20"><a href="#prev-fn-$1" class="text-accent hover:underline">[$1]</a></sup>') }} className="rich-body" />;
  }
  return body.split(/\n\s*\n/).map((para, i) => {
    const parts = para.split(/(\[\^\d+\])/g);
    return (<p key={i} className="mb-4">{parts.map((part, j) => {
      const m = part.match(/\[\^(\d+)\]/);
      if (m) return <sup key={j} id={`prev-fnref-${m[1]}`} className="scroll-m-20"><a href={`#prev-fn-${m[1]}`} className="text-accent ml-0.5 hover:underline">[{m[1]}]</a></sup>;
      return <span key={j}>{part}</span>;
    })}</p>);
  });
};

export function PostPreview({ translations, coverUrl, categoryBn, categoryEn, readingMinutes, tags = [] }: Props) {
  const available = (Object.keys(translations) as Lang[]).filter((l) => translations[l].title.trim());
  const [lang, setLang] = useState<Lang>(available[0] ?? "bn");
  const [exporting, setExporting] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const t = translations[lang];

  const exportImage = async (format: "png" | "card") => {
    if (!node) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const target = format === "card" ? node.querySelector<HTMLElement>("[data-export-card]") ?? node : node;
      const dataUrl = await toPng(target, { pixelRatio: 2, cacheBust: true, backgroundColor: format === "card" ? undefined : "#faf6ef" });
      const link = document.createElement("a");
      link.download = `kisti-${lang}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  if (!t || !t.title.trim()) return <div className="text-sm text-muted-foreground italic p-8 text-center">Add a title to see preview.</div>;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#prev-fn')) {
      e.preventDefault();
      const id = target.getAttribute('href')?.substring(1);
      if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div ref={setNode} className="bg-gradient-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <div className="flex gap-2">
          {available.length > 1 && available.map((l) => (
            <button key={l} onClick={() => setLang(l)} type="button" className={`text-[10px] px-3 py-1 border rounded-full transition-colors ${langClass[l]} ${lang === l ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{langLabel[l]}</button>
          ))}
        </div>
        <div className="flex gap-1" data-html2canvas-ignore>
          <button type="button" disabled={exporting} onClick={() => exportImage("card")} className="text-[10px] uppercase tracking-[0.15em] font-en-sans px-2 py-1 border border-border hover:bg-secondary disabled:opacity-50">{exporting ? "…" : "Card"}</button>
          <button type="button" disabled={exporting} onClick={() => exportImage("png")} className="text-[10px] uppercase tracking-[0.15em] font-en-sans px-2 py-1 border border-border hover:bg-secondary disabled:opacity-50">{exporting ? "…" : "Full PNG"}</button>
        </div>
      </div>
      <article className="px-6 pb-8" onClick={handleLinkClick}>
        <header className="mb-8 text-center" dir={dir}>
          <div className="font-en-sans uppercase text-[9px] tracking-[0.3em] text-accent mb-4" dir="ltr">{lang === "bn" ? categoryBn : categoryEn}</div>
          <h1 className={`${langClass[lang]} text-2xl md:text-3xl leading-[1.15] mb-4`}>{t.title}</h1>
          {readingMinutes ? <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-en-sans" dir="ltr">{readingMinutes} min read</div> : null}
        </header>
        {coverUrl && <figure className="mb-8 -mx-6"><img src={coverUrl} alt="" className="w-full mix-blend-multiply dark:mix-blend-screen opacity-90" /></figure>}
        {t.excerpt && <p className={`${langClass[lang]} italic text-muted-foreground text-center mb-6`} dir={dir}>{t.excerpt}</p>}
        {t.body && <div className={`prose-kisti ${langClass[lang]} max-w-none text-sm`} dir={dir}>{renderBody(t.body)}</div>}
        {t.footnotes.length > 0 && <section className="mt-10 pt-6 border-t border-border/60" dir={dir}><h2 className="font-en-sans uppercase text-[10px] tracking-[0.25em] text-muted-foreground mb-4" dir="ltr">Footnotes · টীকা</h2><ol className={`${langClass[lang]} space-y-2 text-xs text-muted-foreground`}>{t.footnotes.map((f) => <li key={f.id} id={`prev-fn-${f.id}`} className="leading-relaxed scroll-m-20"><span className="text-accent mr-2">[{f.id}]</span>{f.text}<a href={`#prev-fnref-${f.id}`} className="ml-1 text-accent hover:underline inline-block">↩</a></li>)}</ol></section>}
        {t.citations.length > 0 && <section className="mt-8 pt-6 border-t border-border/60" dir={dir}><h2 className="font-en-sans uppercase text-[10px] tracking-[0.25em] text-muted-foreground mb-4" dir="ltr">Citations</h2><ul className={`${langClass[lang]} space-y-2 text-xs text-muted-foreground`}>{t.citations.map((c, i) => <li key={i} className="leading-relaxed">{c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-foreground underline-offset-2 hover:underline">{c.label || c.url}</a> : <span>{c.label}</span>}</li>)}</ul></section>}
        {tags.length > 0 && <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-0.5 border border-border rounded-full text-muted-foreground">#{tag}</span>)}</div>}
      </article>
    </div>
  );
}
