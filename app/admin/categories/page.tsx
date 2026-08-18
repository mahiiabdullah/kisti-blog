"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronRight, FolderTree, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name_bn: string;
  name_en: string | null;
  slug: string | null;
  parent_id: string | null;
  is_main: boolean;
  position: number;
  children?: Category[];
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);

  // New main category form
  const [showMainForm, setShowMainForm] = useState(false);
  const [mainNameBn, setMainNameBn] = useState("");
  const [mainNameEn, setMainNameEn] = useState("");

  // New subcategory form
  const [newNameBn, setNewNameBn] = useState("");
  const [newNameEn, setNewNameEn] = useState("");

  const slugify = (text: string) => {
    return text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0980-\u09FF-]+/g, '');
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("position", { ascending: true });
    if (error) { toast.error(error.message); setLoading(false); return; }

    const all = data as Category[];
    const mainCats = all.filter(c => !c.parent_id);
    for (const main of mainCats) {
      main.children = all.filter(c => c.parent_id === main.id).sort((a, b) => a.position - b.position);
    }
    setCategories(mainCats);
    setExpanded(new Set(mainCats.map(c => c.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addMainCategory = async (bnName: string, enName?: string) => {
    const nameBn = bnName.trim();
    if (!nameBn) { toast.error("বাংলা নাম প্রয়োজন"); return; }
    const nameEn = enName?.trim() || null;
    const slug = slugify(nameEn || nameBn) || "editorial-column";
    const nextPos = categories.length + 1;

    const { error } = await supabase.from("categories").insert({
      name_bn: nameBn,
      name_en: nameEn,
      slug: slug,
      is_main: true,
      position: nextPos,
      parent_id: null,
    });

    if (error) { toast.error(error.message); return; }
    toast.success(`"${nameBn}" ক্যাটাগরি যুক্ত করা হয়েছে`);
    setMainNameBn("");
    setMainNameEn("");
    setShowMainForm(false);
    load();
  };

  const addSubcategory = async (parentId: string) => {
    if (!newNameBn.trim()) { toast.error("Bengali name is required"); return; }
    const parent = categories.find(c => c.id === parentId);
    const nextPos = (parent?.children?.length ?? 0) + 1;
    const slug = slugify(newNameEn || newNameBn);

    const { error } = await supabase.from("categories").insert({
      name_bn: newNameBn.trim(),
      name_en: newNameEn.trim() || null,
      slug: slug,
      parent_id: parentId,
      is_main: false,
      position: nextPos,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Subcategory added");
    setNewNameBn("");
    setNewNameEn("");
    setAddingTo(null);
    load();
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(`ক্যাটাগরি "${cat.name_bn}" মুছে ফেলতে চান?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) { toast.error(error.message); return; }
    toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে");
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-bn text-4xl mb-1">ক্যাটাগরি সমূহ</h1>
          <p className="text-sm text-muted-foreground font-en">Manage main categories & subcategories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => addMainCategory("সম্পাদকীয় কলাম", "Editorial Column")}
            variant="outline"
            className="font-bn gap-2 border-gold text-foreground hover:bg-gold/10"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            + "সম্পাদকীয় কলাম" যোগ করুন
          </Button>
          <Button
            onClick={() => setShowMainForm(!showMainForm)}
            className="font-bn gap-2"
          >
            <Plus className="w-4 h-4" />
            নতুন মূল ক্যাটাগরি
          </Button>
        </div>
      </div>

      {showMainForm && (
        <div className="mb-8 p-5 border border-primary/30 bg-card rounded-sm shadow-soft space-y-4">
          <h3 className="font-bn text-lg font-bold">নতুন মূল ক্যাটাগরি তৈরি করুন</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bn">বাংলা নাম *</Label>
              <Input
                value={mainNameBn}
                onChange={e => setMainNameBn(e.target.value)}
                placeholder="যেমন: Editorial Column"
                className="font-bn"
              />
            </div>
            <div>
              <Label className="text-xs font-en-sans">English Name</Label>
              <Input
                value={mainNameEn}
                onChange={e => setMainNameEn(e.target.value)}
                placeholder="e.g. Editorial Column"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowMainForm(false)}>বাতিল</Button>
            <Button size="sm" onClick={() => addMainCategory(mainNameBn, mainNameEn)}>সংরক্ষণ করুন</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground font-bn py-8 text-center">ক্যাটাগরি লোড হচ্ছে…</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <FolderTree className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-bn text-muted-foreground mb-4">কোনো ক্যাটাগরি পাওয়া যায়নি।</p>
          <Button onClick={() => addMainCategory("Editorial Column", "Editorial Column")} className="font-bn">
            "Editorial Column" ক্যাটাগরি তৈরি করুন
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((main) => (
            <div key={main.id} className="border border-border bg-card rounded-sm shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-secondary/30">
                <button
                  onClick={() => toggleExpand(main.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  {expanded.has(main.id) ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-bn text-lg font-bold truncate">{main.name_bn}</div>
                    {main.name_en && <div className="text-xs text-muted-foreground font-en-sans">{main.name_en}</div>}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bn gap-1"
                    onClick={() => { setAddingTo(addingTo === main.id ? null : main.id); setNewNameBn(""); setNewNameEn(""); }}
                  >
                    <Plus className="w-3 h-3" /> সাবক্যাটাগরি
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(main)} title="Delete Category">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {addingTo === main.id && (
                <div className="px-5 py-4 border-t border-border bg-background flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-bn">সাবক্যাটাগরি নাম (বাংলা) *</Label>
                    <Input
                      value={newNameBn}
                      onChange={e => setNewNameBn(e.target.value)}
                      placeholder="উপশ্রেণি"
                      className="font-bn"
                      onKeyDown={e => e.key === "Enter" && addSubcategory(main.id)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-en-sans">English name</Label>
                    <Input
                      value={newNameEn}
                      onChange={e => setNewNameEn(e.target.value)}
                      placeholder="Subcategory"
                      onKeyDown={e => e.key === "Enter" && addSubcategory(main.id)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button size="sm" onClick={() => addSubcategory(main.id)}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingTo(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {expanded.has(main.id) && main.children && main.children.length > 0 && (
                <div className="border-t border-border">
                  {main.children.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-5 pl-12 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/20">
                      <div className="min-w-0">
                        <div className="font-bn truncate">{sub.name_bn}</div>
                        {sub.name_en && <div className="text-xs text-muted-foreground font-en-sans">{sub.name_en}</div>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(sub)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
