"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Copy, Trash2 } from "lucide-react";

interface Item { name: string; url: string; path: string; }

export default function AdminMedia() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const all: Item[] = [];
    for (const folder of ["covers", "images", "uploads"]) {
      const { data } = await supabase.storage.from("media").list(`${folder}/${user.id}`, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      for (const f of data ?? []) {
        const path = `${folder}/${user.id}/${f.name}`;
        const { data: u } = supabase.storage.from("media").getPublicUrl(path);
        all.push({ name: f.name, url: u.publicUrl, path });
      }
    }
    setItems(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = e.target.files; if (!files) return;
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `uploads/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) toast.error(error.message);
    }
    toast.success("Uploaded");
    load();
  };

  const remove = async (path: string) => {
    if (!confirm("Delete this file?")) return;
    const { error } = await supabase.storage.from("media").remove([path]);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h1 className="font-bn text-4xl mb-1">মিডিয়া</h1>
          <p className="text-sm text-muted-foreground font-en">Uploaded images and assets</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm cursor-pointer hover:bg-foreground/90">
          <Upload className="w-4 h-4" /> Upload
          <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} />
        </label>
      </div>

      {loading ? <p className="text-muted-foreground">…</p> : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-20 font-bn">কোনো ফাইল নেই।</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.path} className="border border-border group">
              <img src={it.url} alt="" className="w-full aspect-square object-cover" />
              <div className="p-2 flex gap-1 justify-between items-center">
                <span className="text-xs truncate font-en-sans">{it.name}</span>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(it.url); toast.success("URL copied"); }}><Copy className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(it.path)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
