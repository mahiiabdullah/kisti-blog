"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";

interface Row {
  id: string; body: string; created_at: string; approved: boolean; user_id: string; post_id: string;
  posts?: { slug: string } | null;
}

export default function AdminComments() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hidden">("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("comments").select("*, posts(slug)").order("created_at", { ascending: false });
    if (filter === "hidden") q = q.eq("approved", false);
    const { data } = await q;
    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const toggleVisibility = async (id: string, currentlyApproved: boolean) => {
    const { error } = await supabase.from("comments").update({ approved: !currentlyApproved }).eq("id", id);
    if (error) toast.error(error.message); else { 
      toast.success(currentlyApproved ? "Comment hidden" : "Comment visible"); 
      load(); 
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete comment?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h1 className="font-bn text-4xl mb-1">মন্তব্য</h1>
          <p className="text-sm text-muted-foreground font-en">Moderate reader comments</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} className="rounded-none" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "hidden" ? "default" : "outline"} className="rounded-none" onClick={() => setFilter("hidden")}>Hidden</Button>
        </div>
      </div>

      {loading ? <p className="text-muted-foreground">…</p> : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-20 font-bn">কোনো মন্তব্য নেই।</p>
      ) : (
        <div className="border border-border">
          {items.map((c) => (
            <div key={c.id} className={`px-5 py-4 border-b border-border last:border-0 ${!c.approved ? 'bg-secondary/30' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className={`font-bn leading-relaxed mb-2 ${!c.approved ? 'text-muted-foreground' : ''}`}>{c.body}</p>
                  <div className="text-xs text-muted-foreground font-en-sans flex gap-3 items-center">
                    <span>/{c.posts?.slug ?? "?"}</span>
                    <span>·</span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                    {!c.approved && <span className="text-destructive uppercase tracking-wider text-[10px] bg-destructive/10 px-2 py-0.5 rounded">hidden</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => toggleVisibility(c.id, c.approved)} title={c.approved ? "Hide Comment" : "Show Comment"}>
                    {c.approved ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-accent" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)} title="Delete Comment">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
