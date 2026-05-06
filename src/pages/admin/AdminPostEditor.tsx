import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { PostPreview } from "@/components/PostPreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Lang = "bn" | "en" | "ar";
const LANGS: Lang[] = ["bn", "en", "ar"];
const LANG_LABEL: Record<Lang, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

interface TranslationDraft {
  lang: Lang;
  title: string;
  excerpt: string;
  body: string;
  footnotes: { id: number; text: string }[];
  citations: { label: string; url?: string }[];
}

interface ImageDraft { id?: string; url: string; caption: string; position: number; }

const emptyTranslation = (lang: Lang): TranslationDraft => ({
  lang, title: "", excerpt: "", body: "", footnotes: [], citations: [],
});

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || `post-${Date.now()}`;

export default function AdminPostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<Lang>("bn");
  const [showPreview, setShowPreview] = useState(true);

  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryBn, setCategoryBn] = useState("");
  const [categoryEn, setCategoryEn] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [readingMinutes, setReadingMinutes] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [translations, setTranslations] = useState<Record<Lang, TranslationDraft>>({
    bn: emptyTranslation("bn"), en: emptyTranslation("en"), ar: emptyTranslation("ar"),
  });
  const [images, setImages] = useState<ImageDraft[]>([]);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_translations(*), post_tags(tag), post_images(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error || !data) { toast.error("Post not found"); navigate("/admin"); return; }
      setSlug(data.slug);
      setStatus(data.status);
      setCategoryBn(data.category_bn ?? "");
      setCategoryEn(data.category_en ?? "");
      setCoverUrl(data.cover_url ?? "");
      setReadingMinutes(data.reading_minutes ?? 5);
      setTags((data.post_tags as any[]).map((t) => t.tag));
      const next = { bn: emptyTranslation("bn"), en: emptyTranslation("en"), ar: emptyTranslation("ar") };
      for (const t of data.post_translations as any[]) {
        if (LANGS.includes(t.lang)) {
          next[t.lang as Lang] = {
            lang: t.lang, title: t.title ?? "", excerpt: t.excerpt ?? "", body: t.body ?? "",
            footnotes: Array.isArray(t.footnotes) ? t.footnotes : [],
            citations: Array.isArray(t.citations) ? t.citations : [],
          };
        }
      }
      setTranslations(next);
      setImages((data.post_images as any[]).map((i) => ({
        id: i.id, url: i.url, caption: i.caption ?? "", position: i.position ?? 0,
      })).sort((a, b) => a.position - b.position));
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  const updateT = (lang: Lang, patch: Partial<TranslationDraft>) =>
    setTranslations((p) => ({ ...p, [lang]: { ...p[lang], ...patch } }));

  const uploadFile = async (file: File, prefix = "covers") => {
    const ext = file.name.split(".").pop();
    const path = `${prefix}/${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  const onCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = await uploadFile(file, "covers"); if (url) { setCoverUrl(url); toast.success("Cover uploaded"); }
  };

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, "images");
      if (url) setImages((p) => [...p, { url, caption: "", position: p.length }]);
    }
  };

  const addFootnote = (lang: Lang) => {
    const cur = translations[lang].footnotes;
    const nextId = (cur.at(-1)?.id ?? 0) + 1;
    updateT(lang, { footnotes: [...cur, { id: nextId, text: "" }] });
  };

  const addCitation = (lang: Lang) =>
    updateT(lang, { citations: [...translations[lang].citations, { label: "", url: "" }] });

  const addTag = () => {
    const t = tagInput.trim(); if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const save = async (publish?: boolean) => {
    if (!user) return;
    const finalSlug = slug.trim() || slugify(translations.bn.title || translations.en.title);
    const hasAny = LANGS.some((l) => translations[l].title.trim());
    if (!hasAny) { toast.error("At least one translation needs a title"); return; }

    setSaving(true);
    try {
      const newStatus = publish === undefined ? status : (publish ? "published" : "draft");
      const payload = {
        slug: finalSlug,
        author_id: user.id,
        status: newStatus,
        category_bn: categoryBn || null,
        category_en: categoryEn || null,
        cover_url: coverUrl || null,
        reading_minutes: readingMinutes,
        published_at: newStatus === "published" ? (status === "published" ? undefined : new Date().toISOString()) : null,
      };

      let postId = id;
      if (isNew) {
        const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
        if (error) throw error;
        postId = data.id;
      } else {
        const { error } = await supabase.from("posts").update(payload).eq("id", id!);
        if (error) throw error;
      }

      // Translations: delete then insert
      const { error: tDelErr } = await supabase.from("post_translations").delete().eq("post_id", postId!);
      if (tDelErr) throw tDelErr;

      const tRows = LANGS.filter((l) => translations[l].title.trim()).map((l) => ({
        post_id: postId!, lang: l,
        title: translations[l].title.trim(),
        excerpt: translations[l].excerpt || null,
        body: translations[l].body || null,
        footnotes: translations[l].footnotes,
        citations: translations[l].citations,
      }));
      if (tRows.length) {
        const { error: tInsErr } = await supabase.from("post_translations").insert(tRows);
        if (tInsErr) throw tInsErr;
      }

      // Tags
      const { error: tgDelErr } = await supabase.from("post_tags").delete().eq("post_id", postId!);
      if (tgDelErr) throw tgDelErr;
      if (tags.length) {
        const { error: tgInsErr } = await supabase.from("post_tags").insert(tags.map((tag) => ({ post_id: postId!, tag })));
        if (tgInsErr) throw tgInsErr;
      }

      // Images
      const { error: imgDelErr } = await supabase.from("post_images").delete().eq("post_id", postId!);
      if (imgDelErr) throw imgDelErr;
      if (images.length) {
        const { error: imgInsErr } = await supabase.from("post_images").insert(images.map((img, i) => ({
          post_id: postId!, url: img.url, caption: img.caption || null, position: i,
        })));
        if (imgInsErr) throw imgInsErr;
      }

      toast.success(newStatus === "published" ? "প্রকাশিত!" : "Saved as draft");
      if (isNew) navigate(`/admin/posts/${postId}`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">…</p>;
  const t = translations[activeLang];
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  return (
    <div className={showPreview ? "max-w-[1600px]" : "max-w-4xl"}>
      <Link to="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-8 font-en-sans">
        <ArrowLeft className="w-3 h-3" /> All posts
      </Link>

      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-bn text-4xl">{isNew ? "নতুন পোস্ট" : "সম্পাদনা"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview((v) => !v)} className="rounded-none">
            {showPreview ? <><EyeOff className="w-4 h-4 mr-1" />Hide preview</> : <><Eye className="w-4 h-4 mr-1" />Show preview</>}
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving} className="rounded-none">Save draft</Button>
          <Button onClick={() => save(true)} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 rounded-none">
            {status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""}>
        <div className={showPreview ? "min-w-0" : ""}>

      {/* Meta */}
      <section className="border border-border p-6 mb-8 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Reading minutes</Label>
            <Input type="number" min={1} value={readingMinutes} onChange={(e) => setReadingMinutes(parseInt(e.target.value) || 5)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Category (BN)</Label>
            <Input value={categoryBn} onChange={(e) => setCategoryBn(e.target.value)} className="font-bn" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-en-sans">Category (EN)</Label>
            <Input value={categoryEn} onChange={(e) => setCategoryEn(e.target.value)} />
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans">Cover image</Label>
          <div className="flex items-center gap-3 mt-1">
            {coverUrl && <img src={coverUrl} alt="" className="w-24 h-16 object-cover" />}
            <label className="flex items-center gap-2 px-3 py-2 border border-border text-sm cursor-pointer hover:bg-secondary">
              <Upload className="w-4 h-4" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
            </label>
            {coverUrl && <button onClick={() => setCoverUrl("")} className="text-xs text-destructive">remove</button>}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans">Tags</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((tg) => (
              <span key={tg} className="inline-flex items-center gap-1 text-xs px-3 py-1 border border-border rounded-full">
                {tg}<button onClick={() => setTags(tags.filter((x) => x !== tg))} className="text-destructive">×</button>
              </span>
            ))}
            <div className="flex gap-1">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="add tag" className="h-8 w-32" />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="rounded-none">Add</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Translation tabs */}
      <div className="flex gap-2 mb-4 border-b border-border">
        {LANGS.map((l) => (
          <button key={l} onClick={() => setActiveLang(l)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${activeLang === l ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {LANG_LABEL[l]} {translations[l].title && <span className="text-accent ml-1">●</span>}
          </button>
        ))}
      </div>

      <section className="space-y-4 mb-8" dir={dir}>
        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Title</Label>
          <Input value={t.title} onChange={(e) => updateT(activeLang, { title: e.target.value })} className={`text-2xl h-14 ${activeLang === "bn" ? "font-bn" : activeLang === "ar" ? "font-ar" : "font-en"}`} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Excerpt</Label>
          <Textarea value={t.excerpt} onChange={(e) => updateT(activeLang, { excerpt: e.target.value })} rows={2} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">
            Body — paragraphs separated by blank lines. Footnote markers: [^1], [^2]
          </Label>
          <Textarea value={t.body} onChange={(e) => updateT(activeLang, { body: e.target.value })} rows={18} className={`font-mono text-sm leading-relaxed`} />
        </div>

        {/* Footnotes */}
        <div className="border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Footnotes</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => addFootnote(activeLang)} className="rounded-none"><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
          <div className="space-y-2">
            {t.footnotes.map((fn, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-accent text-sm pt-2">[{fn.id}]</span>
                <Textarea value={fn.text} rows={2}
                  onChange={(e) => updateT(activeLang, { footnotes: t.footnotes.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => updateT(activeLang, { footnotes: t.footnotes.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Citations */}
        <div className="border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Citations</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => addCitation(activeLang)} className="rounded-none"><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
          <div className="space-y-2">
            {t.citations.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Label" value={c.label}
                  onChange={(e) => updateT(activeLang, { citations: t.citations.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                <Input placeholder="URL" value={c.url ?? ""}
                  onChange={(e) => updateT(activeLang, { citations: t.citations.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} />
                <Button type="button" variant="ghost" size="icon" onClick={() => updateT(activeLang, { citations: t.citations.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inline images */}
      <section className="border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-xs uppercase tracking-wider font-en-sans">Inline images</Label>
          <label className="flex items-center gap-2 px-3 py-2 border border-border text-sm cursor-pointer hover:bg-secondary">
            <Upload className="w-4 h-4" /> Upload
            <input type="file" accept="image/*" multiple className="hidden" onChange={onImageUpload} />
          </label>
        </div>
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={i} className="flex gap-3 items-start border border-border p-3">
              <img src={img.url} alt="" className="w-24 h-16 object-cover" />
              <Input placeholder="Caption" value={img.caption}
                onChange={(e) => setImages(images.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} />
              <Button variant="ghost" size="icon" onClick={() => setImages(images.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {images.length === 0 && <p className="text-xs text-muted-foreground">No additional images.</p>}
        </div>
      </section>
        </div>

        {showPreview && (
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-en-sans flex items-center gap-2">
                <Eye className="w-3 h-3" /> Live preview
              </div>
              <div className="border border-border bg-background overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
                <PostPreview
                  translations={translations}
                  coverUrl={coverUrl}
                  categoryBn={categoryBn}
                  categoryEn={categoryEn}
                  readingMinutes={readingMinutes}
                  tags={tags}
                  images={images}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

