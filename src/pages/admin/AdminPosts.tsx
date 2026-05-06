import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("id, slug, status, published_at, created_at, category_bn, post_translations(lang, title)")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-bn text-4xl mb-1">পোস্ট</h1>
          <p className="text-sm text-muted-foreground font-en">All posts — drafts & published</p>
        </div>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-none">
          <Link to="/admin/posts/new"><Plus className="w-4 h-4 mr-2" /> New post</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">…</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <p className="font-bn mb-4">এখনো কোনো পোস্ট নেই।</p>
          <Button asChild><Link to="/admin/posts/new">প্রথম পোস্ট লিখুন</Link></Button>
        </div>
      ) : (
        <div className="border border-border">
          {posts.map((p) => {
            const t = p.post_translations[0];
            return (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/30">
                <div className="min-w-0">
                  <div className="font-bn text-lg truncate">{t?.title ?? "(untitled)"}</div>
                  <div className="text-xs text-muted-foreground font-en-sans mt-1 flex gap-3">
                    <span className={`uppercase tracking-wider ${p.status === "published" ? "text-accent" : ""}`}>{p.status}</span>
                    <span>·</span><span>/{p.slug}</span>
                    {p.category_bn && (<><span>·</span><span className="font-bn">{p.category_bn}</span></>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" asChild><Link to={`/admin/posts/${p.id}`}><Pencil className="w-4 h-4" /></Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
