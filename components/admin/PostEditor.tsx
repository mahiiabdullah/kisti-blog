"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Upload, Trash2, Plus, Eye, EyeOff, X, ChevronDown } from "lucide-react";
import { PostPreview } from "@/components/PostPreview";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { calculateReadingTime } from "@/lib/utils/readingTime";

// Lazy load the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), { ssr: false, loading: () => <div className="border border-border p-4 text-muted-foreground">Loading editor…</div> });

type Lang = "bn" | "en" | "ar";
const LANGS: Lang[] = ["bn", "en", "ar"];
const LANG_LABEL: Record<Lang, string> = { bn: "বাংলা", en: "English", ar: "العربية" };

interface TranslationDraft {
  lang: Lang; title: string; excerpt: string; body: string;
  footnotes: { id: number; text: string }[];
  citations: { label: string; url?: string }[];
}

interface CategoryItem {
  id: string;
  name_bn: string;
  name_en: string | null;
  parent_id: string | null;
  is_main: boolean;
  children?: CategoryItem[];
}

const emptyTranslation = (lang: Lang): TranslationDraft => ({
  lang, title: "", excerpt: "", body: "", footnotes: [], citations: [],
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80) || `post-${Date.now()}`;

export default function AdminPostEditor() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const isNew = !id;
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<Lang>("bn");
  const [showPreview, setShowPreview] = useState(false);

  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverUrl, setCoverUrl] = useState("");
  const [writerId, setWriterId] = useState<string>("");
  const [isTranslation, setIsTranslation] = useState<boolean>(false);
  const [translatorId, setTranslatorId] = useState<string>("");
  const [allWriters, setAllWriters] = useState<any[]>([]);
  const [readingMinutes, setReadingMinutes] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [translations, setTranslations] = useState<Record<Lang, TranslationDraft>>({
    bn: emptyTranslation("bn"), en: emptyTranslation("en"), ar: emptyTranslation("ar"),
  });

  // Category system
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState("");

  // Backward compat
  const [categoryBn, setCategoryBn] = useState("");
  const [categoryEn, setCategoryEn] = useState("");

  // Load categories and writers
  useEffect(() => {
    (async () => {
      const [catsRes, writersRes] = await Promise.all([
        supabase.from("categories").select("*").order("position"),
        supabase.from("writers").select("id, name, bengali_name").order("name")
      ]);
      if (catsRes.data) {
        const all = catsRes.data as CategoryItem[];
        const mains = all.filter(c => !c.parent_id);
        for (const m of mains) m.children = all.filter(c => c.parent_id === m.id);
        setAllCategories(mains);
      }
      if (writersRes.data) {
        setAllWriters(writersRes.data);
      }
    })();
  }, []);

  // Load existing post
  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, post_translations(*), post_tags(tag), post_images(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error || !data) { toast.error("Post not found"); router.push("/admin"); return; }
      setSlug(data.slug);
      setStatus(data.status);
      setCategoryBn(data.category_bn ?? "");
      setCategoryEn(data.category_en ?? "");
      setWriterId(data.writer_id ?? "");
      setIsTranslation(data.is_translation ?? false);
      setTranslatorId(data.translator_id ?? "");
      setCoverUrl(data.cover_url ?? "");
      setReadingMinutes(data.reading_minutes ?? 5);
      setTags((data.post_tags as any[]).map((t) => t.tag));
      const next = { bn: emptyTranslation("bn"), en: emptyTranslation("en"), ar: emptyTranslation("ar") };
      for (const t of data.post_translations as any[]) {
        if (LANGS.includes(t.lang)) {
          next[t.lang as Lang] = { lang: t.lang, title: t.title ?? "", excerpt: t.excerpt ?? "", body: t.body ?? "", footnotes: Array.isArray(t.footnotes) ? t.footnotes : [], citations: Array.isArray(t.citations) ? t.citations : [] };
        }
      }
      setTranslations(next);

      // Load post_categories
      let loadedCatIds: string[] = [];
      const { data: postCats } = await supabase.from("post_categories").select("category_id").eq("post_id", id!);
      if (postCats && postCats.length > 0) {
        loadedCatIds = postCats.map((pc: any) => pc.category_id);
      } else if (data.category_bn) {
        // Fallback for legacy posts that haven't been migrated to post_categories yet
        const { data: legacyCat } = await supabase.from("categories").select("id").eq("name_bn", data.category_bn).maybeSingle();
        if (legacyCat) {
          loadedCatIds = [legacyCat.id];
        }
      }
      setSelectedCatIds(loadedCatIds);

      setLoading(false);
    })();
  }, [id, isNew, router]);

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

  // Toggle category selection
  const toggleCategory = (catId: string) => {
    setSelectedCatIds(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  // Get a flat list of all categories for label display
  const getFlatCats = useCallback((): CategoryItem[] => {
    const flat: CategoryItem[] = [];
    for (const m of allCategories) {
      flat.push(m);
      if (m.children) flat.push(...m.children);
    }
    return flat;
  }, [allCategories]);

  // Auto calculate reading time
  useEffect(() => {
    if (loading) return;
    const time = calculateReadingTime(translations[activeLang].body);
    setReadingMinutes(time);
  }, [translations[activeLang].body, activeLang, loading]);

  const save = async (publish?: boolean) => {
    if (!user) return;
    const finalSlug = slug.trim() || slugify(translations.bn.title || translations.en.title);
    const hasAny = LANGS.some((l) => translations[l].title.trim());
    if (!hasAny) { toast.error("At least one translation needs a title"); return; }

    setSaving(true);
    try {
      const newStatus = publish === undefined ? status : (publish ? "published" : "draft");

      // Backward compat: sync category_bn/en from first selected category
      let finalCatBn = categoryBn;
      let finalCatEn = categoryEn;
      if (selectedCatIds.length > 0) {
        const flat = getFlatCats();
        const first = flat.find(c => c.id === selectedCatIds[0]);
        if (first) { finalCatBn = first.name_bn; finalCatEn = first.name_en ?? ""; }
      }

      const payload = {
        slug: finalSlug, author_id: user.id, status: newStatus,
        category_bn: finalCatBn || null, category_en: finalCatEn || null,
        cover_url: coverUrl || null, reading_minutes: readingMinutes,
        writer_id: writerId || null,
        is_translation: isTranslation,
        translator_id: isTranslation ? (translatorId || null) : null,
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

      // Translations
      const { error: tDelErr } = await supabase.from("post_translations").delete().eq("post_id", postId!);
      if (tDelErr) throw tDelErr;
      const tRows = LANGS.filter((l) => translations[l].title.trim()).map((l) => ({
        post_id: postId!, lang: l, title: translations[l].title.trim(),
        excerpt: translations[l].excerpt || null, body: translations[l].body || null,
        footnotes: translations[l].footnotes, citations: translations[l].citations,
      }));
      if (tRows.length) { const { error: tInsErr } = await supabase.from("post_translations").insert(tRows); if (tInsErr) throw tInsErr; }

      // Tags
      const { error: tgDelErr } = await supabase.from("post_tags").delete().eq("post_id", postId!);
      if (tgDelErr) throw tgDelErr;
      if (tags.length) { const { error: tgInsErr } = await supabase.from("post_tags").insert(tags.map((tag) => ({ post_id: postId!, tag }))); if (tgInsErr) throw tgInsErr; }

      // Categories (new system)
      try {
        await supabase.from("post_categories").delete().eq("post_id", postId!);
        if (selectedCatIds.length > 0) {
          await supabase.from("post_categories").insert(selectedCatIds.map(cid => ({ post_id: postId!, category_id: cid })));
        }
      } catch (e) {
        // Table may not exist yet, silently ignore
        console.warn("post_categories save skipped:", e);
      }

      toast.success(newStatus === "published" ? "প্রকাশিত!" : "Saved as draft");
      if (isNew) router.push(`/admin/posts/${postId}`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save post");
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-muted-foreground">…</p>;
  const t = translations[activeLang];
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  return (
    <div className="max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-8 font-en-sans">
        <ArrowLeft className="w-3 h-3" /> All posts
      </Link>
      <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between mb-10 gap-4">
        <h1 className="font-bn text-4xl">{isNew ? "নতুন পোস্ট" : "সম্পাদনা"}</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowPreview((v) => !v)} className="lg:hidden rounded-none text-xs sm:text-sm">
            {showPreview ? <><EyeOff className="w-4 h-4 mr-1" />Edit</> : <><Eye className="w-4 h-4 mr-1" />Preview</>}
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving} className="rounded-none text-xs sm:text-sm">Save draft</Button>
          <Button onClick={() => save(true)} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs sm:text-sm">
            {status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-[calc(100vh-14rem)]">
        <div className={`min-w-0 flex flex-col h-full overflow-y-auto pr-2 ${showPreview ? "hidden lg:flex" : "flex"}`}>
          {/* Metadata */}
          <section className="border border-border p-4 sm:p-6 mb-8 space-y-4 shrink-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-xs uppercase tracking-wider font-en-sans">Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" /></div>
              <div><Label className="text-xs uppercase tracking-wider font-en-sans text-muted-foreground">Reading minutes (Auto)</Label><Input type="number" min={1} value={readingMinutes} readOnly className="bg-secondary/20 text-muted-foreground" /></div>
            </div>

            {/* Writer & Translation */}
            <div className="grid sm:grid-cols-2 gap-4 border border-border p-4 bg-secondary/10">
              <div>
                <Label className="text-xs uppercase tracking-wider font-en-sans">লেখক (Writer)</Label>
                <select 
                  value={writerId} 
                  onChange={(e) => setWriterId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border bg-background text-sm font-bn"
                >
                  <option value="">[ Select Writer ]</option>
                  {allWriters.map(w => (
                    <option key={w.id} value={w.id}>{w.bengali_name} ({w.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 justify-end">
                <label className="flex items-center gap-2 text-sm font-bn cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isTranslation} 
                    onChange={(e) => setIsTranslation(e.target.checked)} 
                    className="rounded-none border-border"
                  />
                  This is a translated writing
                </label>
                
                {isTranslation && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs uppercase tracking-wider font-en-sans">অনুবাদক (Translator)</Label>
                    <select 
                      value={translatorId} 
                      onChange={(e) => setTranslatorId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border bg-background text-sm font-bn"
                    >
                      <option value="">[ Select Translator ]</option>
                      {allWriters.map(w => (
                        <option key={w.id} value={w.id}>{w.bengali_name} ({w.name})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Category dropdown */}
            <div>
              <Label className="text-xs uppercase tracking-wider font-en-sans">Categories</Label>
              <div className="relative mt-1">
                <button
                  type="button"
                  onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-border bg-background text-left text-sm"
                >
                  <span className="truncate font-bn">
                    {selectedCatIds.length === 0
                      ? <span className="text-muted-foreground font-en-sans">Select categories…</span>
                      : getFlatCats().filter(c => selectedCatIds.includes(c.id)).map(c => c.name_bn).join(", ")}
                  </span>
                  <ChevronDown className={`w-4 h-4 ml-2 shrink-0 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {catDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 border border-border bg-background shadow-lg max-h-60 overflow-y-auto flex flex-col">
                    <div className="p-2 sticky top-0 bg-background border-b border-border">
                      <Input 
                        placeholder="Search categories..." 
                        value={catSearchQuery}
                        onChange={(e) => setCatSearchQuery(e.target.value)}
                        className="h-8 text-xs font-bn"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {allCategories.map(main => {
                      const matchMain = main.name_bn.includes(catSearchQuery) || (main.name_en && main.name_en.toLowerCase().includes(catSearchQuery.toLowerCase()));
                      const filteredChildren = main.children?.filter(sub => sub.name_bn.includes(catSearchQuery) || (sub.name_en && sub.name_en.toLowerCase().includes(catSearchQuery.toLowerCase()))) || [];
                      
                      if (!matchMain && filteredChildren.length === 0 && catSearchQuery) return null;

                      return (
                        <div key={main.id}>
                          {(!catSearchQuery || matchMain) && (
                            <button
                              type="button"
                              onClick={() => toggleCategory(main.id)}
                              className={`w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-secondary/50 font-bn font-semibold ${selectedCatIds.includes(main.id) ? "bg-accent/10 text-accent" : ""}`}
                            >
                              <span className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center text-[10px] ${selectedCatIds.includes(main.id) ? "bg-accent border-accent text-white" : "border-border"}`}>
                                {selectedCatIds.includes(main.id) ? "✓" : ""}
                              </span>
                              {main.name_bn}
                            </button>
                          )}
                          {filteredChildren.map(sub => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => toggleCategory(sub.id)}
                              className={`w-full pl-10 pr-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-secondary/50 font-bn ${selectedCatIds.includes(sub.id) ? "bg-accent/10 text-accent" : "text-muted-foreground"}`}
                            >
                              <span className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center text-[10px] ${selectedCatIds.includes(sub.id) ? "bg-accent border-accent text-white" : "border-border"}`}>
                                {selectedCatIds.includes(sub.id) ? "✓" : ""}
                              </span>
                              {sub.name_bn}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {allCategories.length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground font-en-sans">No categories. Run SQL migration first.</div>
                    )}
                  </div>
                )}
              </div>
              {/* Selected category pills */}
              {selectedCatIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {getFlatCats().filter(c => selectedCatIds.includes(c.id)).map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded-sm font-bn">
                      {c.name_bn}
                      <button type="button" onClick={() => toggleCategory(c.id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cover image */}
            <div>
              <Label className="text-xs uppercase tracking-wider font-en-sans">Cover image</Label>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {coverUrl && <img src={coverUrl} alt="" className="w-24 h-16 object-cover" />}
                <label className="flex items-center gap-2 px-3 py-2 border border-border text-sm cursor-pointer hover:bg-secondary"><Upload className="w-4 h-4" /> Upload<input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} /></label>
                {coverUrl && <button onClick={() => setCoverUrl("")} className="text-xs text-destructive">remove</button>}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className="text-xs uppercase tracking-wider font-en-sans">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((tg) => (<span key={tg} className="inline-flex items-center gap-1 text-xs px-3 py-1 border border-border rounded-full">{tg}<button onClick={() => setTags(tags.filter((x) => x !== tg))} className="text-destructive">×</button></span>))}
                <div className="flex gap-1"><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="add tag" className="h-8 w-32" /><Button type="button" variant="outline" size="sm" onClick={addTag} className="rounded-none">Add</Button></div>
              </div>
            </div>
          </section>

          {/* Language tabs */}
          <div className="flex gap-2 mb-4 border-b border-border overflow-x-auto">
            {LANGS.map((l) => (<button key={l} onClick={() => setActiveLang(l)} className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${activeLang === l ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{LANG_LABEL[l]} {translations[l].title && <span className="text-accent ml-1">●</span>}</button>))}
          </div>

          {/* Translation content */}
          <section className="space-y-4 mb-8" dir={dir}>
            <div><Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Title</Label><Input value={t.title} onChange={(e) => updateT(activeLang, { title: e.target.value })} className={`text-2xl h-14 ${activeLang === "bn" ? "font-bn" : activeLang === "ar" ? "font-ar" : "font-en"}`} /></div>
            <div><Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Excerpt</Label><Textarea value={t.excerpt} onChange={(e) => updateT(activeLang, { excerpt: e.target.value })} rows={2} /></div>
            <div>
              <Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Body</Label>
              <RichTextEditor
                content={t.body}
                onChange={(html) => updateT(activeLang, { body: html })}
                placeholder="Write your article here…"
                dir={dir}
                className={activeLang === "bn" ? "font-bn" : activeLang === "ar" ? "font-ar" : "font-en"}
              />
            </div>
            {/* Footnotes */}
            <div className="border border-border p-4">
              <div className="flex items-center justify-between mb-3"><Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Footnotes</Label><Button type="button" size="sm" variant="outline" onClick={() => addFootnote(activeLang)} className="rounded-none"><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              <div className="space-y-2">{t.footnotes.map((fn, i) => (<div key={i} className="flex gap-2 items-start"><span className="text-accent text-sm pt-2">[{fn.id}]</span><Textarea value={fn.text} rows={2} onChange={(e) => updateT(activeLang, { footnotes: t.footnotes.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} /><Button type="button" variant="ghost" size="icon" onClick={() => updateT(activeLang, { footnotes: t.footnotes.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>))}</div>
            </div>
            {/* Citations */}
            <div className="border border-border p-4">
              <div className="flex items-center justify-between mb-3"><Label className="text-xs uppercase tracking-wider font-en-sans" dir="ltr">Citations</Label><Button type="button" size="sm" variant="outline" onClick={() => addCitation(activeLang)} className="rounded-none"><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              <div className="space-y-2">{t.citations.map((c, i) => (<div key={i} className="flex gap-2 items-center flex-wrap sm:flex-nowrap"><Input placeholder="Label" value={c.label} onChange={(e) => updateT(activeLang, { citations: t.citations.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} /><Input placeholder="URL" value={c.url ?? ""} onChange={(e) => updateT(activeLang, { citations: t.citations.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} /><Button type="button" variant="ghost" size="icon" onClick={() => updateT(activeLang, { citations: t.citations.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>))}</div>
            </div>
          </section>
        </div>

        <aside className={`min-w-0 h-full ${!showPreview ? "hidden lg:block" : "block"}`}>
          <div className="h-full flex flex-col">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 font-en-sans flex items-center gap-2 shrink-0"><Eye className="w-3 h-3" /> Live preview</div>
            <div className="border border-border bg-background overflow-y-auto flex-1">
              <PostPreview translations={translations} coverUrl={coverUrl} categoryBn={categoryBn || getFlatCats().find(c => c.id === selectedCatIds[0])?.name_bn || ""} categoryEn={categoryEn || getFlatCats().find(c => c.id === selectedCatIds[0])?.name_en || ""} readingMinutes={readingMinutes} tags={tags} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
