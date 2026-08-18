"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Lock, ChevronDown, ChevronRight, FolderTree } from "lucide-react";

interface Category {
  id: string;
  name_bn: string;
  name_en: string | null;
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
  const [newNameBn, setNewNameBn] = useState("");
  const [newNameEn, setNewNameEn] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("position", { ascending: true });
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Build tree
    const all = data as Category[];
    const mainCats = all.filter(c => !c.parent_id);
    for (const main of mainCats) {
      main.children = all.filter(c => c.parent_id === main.id).sort((a, b) => a.position - b.position);
    }
    setCategories(mainCats);
    // Auto-expand all
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

  const addSubcategory = async (parentId: string) => {
    if (!newNameBn.trim()) { toast.error("Bengali name is required"); return; }
    const parent = categories.find(c => c.id === parentId);
    const nextPos = (parent?.children?.length ?? 0) + 1;
    const { error } = await supabase.from("categories").insert({
      name_bn: newNameBn.trim(),
      name_en: newNameEn.trim() || null,
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

  const deleteSubcategory = async (cat: Category) => {
    if (cat.is_main) { toast.error("Cannot delete main categories"); return; }
    if (!confirm(`Delete "${cat.name_bn}"? Posts using this category will be unlinked.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Subcategory deleted");
    load();
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-bn text-4xl mb-1">ক্যাটাগরি</h1>
        <p className="text-sm text-muted-foreground font-en">Manage categories & subcategories</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">…</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <FolderTree className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-bn text-muted-foreground">No categories found. Run the SQL migration first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((main) => (
            <div key={main.id} className="border border-border">
              {/* Main category header */}
              <div className="flex items-center justify-between px-5 py-4 bg-secondary/30">
                <button
                  onClick={() => toggleExpand(main.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  {expanded.has(main.id) ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-bn text-lg truncate">{main.name_bn}</div>
                    {main.name_en && <div className="text-xs text-muted-foreground font-en-sans">{main.name_en}</div>}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none text-xs"
                    onClick={() => { setAddingTo(addingTo === main.id ? null : main.id); setNewNameBn(""); setNewNameEn(""); }}
                  >
                    <Plus className="w-3 h-3 mr-1" />Sub
                  </Button>
                </div>
              </div>

              {/* Add subcategory form */}
              {addingTo === main.id && (
                <div className="px-5 py-4 border-t border-border bg-background flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-en-sans">Bengali name *</Label>
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
                    <Button size="sm" className="rounded-none" onClick={() => addSubcategory(main.id)}>Add</Button>
                    <Button size="sm" variant="ghost" className="rounded-none" onClick={() => setAddingTo(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Subcategories */}
              {expanded.has(main.id) && main.children && main.children.length > 0 && (
                <div className="border-t border-border">
                  {main.children.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-5 pl-12 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/20">
                      <div className="min-w-0">
                        <div className="font-bn truncate">{sub.name_bn}</div>
                        {sub.name_en && <div className="text-xs text-muted-foreground font-en-sans">{sub.name_en}</div>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteSubcategory(sub)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {expanded.has(main.id) && (!main.children || main.children.length === 0) && (
                <div className="border-t border-border px-5 pl-12 py-4 text-xs text-muted-foreground font-en-sans">
                  No subcategories yet
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
