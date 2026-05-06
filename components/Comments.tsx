"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Clock, LogIn } from "lucide-react";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  approved: boolean;
  user_id: string;
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
}

const timeAgo = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "এইমাত্র";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} দিন আগে`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} মাস আগে`;
  const years = Math.floor(months / 12);
  return `${years} বছর আগে`;
};

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
      .order("created_at", { ascending: true });
    setItems((data ?? []) as any);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
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
    const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, body: body.trim(), approved: true });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("মন্তব্য জমা হয়েছে।");
    setBody("");
    load();
  };

  const visibleComments = items.filter((c) => c.approved || c.user_id === user?.id);
  const commentCount = visibleComments.length;

  return (
    <section className="mt-20 pt-12 border-t border-border/60">
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        {user ? (
          <form onSubmit={submit} className="space-y-4">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="আপনার মন্তব্য লিখুন..."
              maxLength={1000}
              className="font-bn min-h-[100px] bg-background border-border resize-none focus:ring-1 focus:ring-accent/30"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-en-sans">{body.length}/1000</span>
              <Button
                type="submit"
                disabled={busy}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-sm font-en-sans uppercase tracking-wider text-xs px-6"
              >
                {busy ? "..." : "Post Comment"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center py-4 gap-3">
            <LogIn className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-bn">
              মন্তব্য করতে{" "}
              <Link href="/auth" className="text-accent hover:underline font-medium">
                প্রবেশ করুন
              </Link>
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-accent/30">
        <MessageSquare className="w-4 h-4 text-accent" />
        <h2 className="font-en-sans uppercase text-sm font-semibold tracking-wider">
          {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
        </h2>
      </div>

      <div className="space-y-0">
        {visibleComments.map((c) => {
          const displayName = c.profiles?.display_name_bn ?? c.profiles?.display_name ?? "Reader";

          return (
            <div key={c.id} className="border-b border-border/40 last:border-b-0">
              <div className="bg-secondary/30 border-b border-dashed border-border/60 px-5 py-3 flex items-center justify-between">
                <span className="font-bn text-sm font-medium text-foreground">
                  {displayName}
                </span>
                {!c.approved && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/10 text-destructive font-en-sans">
                    hidden by admin
                  </span>
                )}
              </div>

              <div className="px-5 pt-2 pb-1 flex items-center gap-1.5 text-xs text-muted-foreground font-en-sans">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(c.created_at)}</span>
              </div>

              <div className="px-5 pt-2 pb-5">
                <p className="font-bn leading-relaxed text-foreground/90">{c.body}</p>
              </div>
            </div>
          );
        })}

        {commentCount === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-bn">এখনো কোনো মন্তব্য নেই।</p>
            <p className="text-muted-foreground/60 text-xs font-en-sans mt-1">Be the first to comment</p>
          </div>
        )}
      </div>
    </section>
  );
};
