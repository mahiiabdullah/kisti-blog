import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  approved: boolean;
  user_id: string;
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
}

export const Comments = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, approved, user_id, profiles:user_id(display_name, display_name_bn)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as any);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Rate limit: 30 seconds
    const lastUserComment = items.find(c => c.user_id === user.id);
    if (lastUserComment) {
      const elapsed = Date.now() - new Date(lastUserComment.created_at).getTime();
      if (elapsed < 30000) {
        toast.error("Please wait a moment before commenting again.");
        return;
      }
    }

    if (body.trim().length < 2 || body.length > 1000) {
      toast.error("Comment must be 2-1000 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, body: body.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("মন্তব্য জমা হয়েছে — অনুমোদনের অপেক্ষায়।");
    setBody("");
    load();
  };

  return (
    <section className="mt-20 pt-12 border-t border-border/60">
      <h2 className="font-bn text-2xl mb-8">মন্তব্য · Comments</h2>

      {user ? (
        <form onSubmit={submit} className="mb-10 space-y-3">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="আপনার ভাবনা লিখুন..." maxLength={1000} className="font-bn min-h-[100px] bg-card" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-en-sans">{body.length}/1000</span>
            <Button type="submit" disabled={busy} className="bg-foreground text-background hover:bg-foreground/90 rounded-none font-en-sans uppercase tracking-wider text-xs">Post</Button>
          </div>
        </form>
      ) : (
        <p className="mb-10 text-sm text-muted-foreground">
          মন্তব্য করতে <Link to="/auth" className="text-accent underline">প্রবেশ করুন</Link>।
        </p>
      )}

      <ul className="space-y-6">
        {items.filter((c) => c.approved || c.user_id === user?.id).map((c) => (
          <li key={c.id} className="border-l-2 border-border pl-4">
            <div className="text-xs text-muted-foreground font-en-sans mb-2">
              <span className="font-bn text-foreground">{c.profiles?.display_name_bn ?? c.profiles?.display_name ?? "Reader"}</span>
              <span className="mx-2">·</span>
              <span>{new Date(c.created_at).toLocaleDateString()}</span>
              {!c.approved && <span className="ml-2 italic text-accent">pending</span>}
            </div>
            <p className="font-bn leading-relaxed">{c.body}</p>
          </li>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-sm font-bn">এখনো কোনো মন্তব্য নেই।</p>}
      </ul>
    </section>
  );
};
