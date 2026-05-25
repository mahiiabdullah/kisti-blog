"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Clock, LogIn, Reply } from "lucide-react";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  approved: boolean;
  user_id: string;
  parent_id?: string | null;
  profiles?: { display_name: string | null; display_name_bn: string | null } | null;
  replies?: CommentRow[];
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

// Generate a deterministic color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "hsl(14 60% 48%)", // terracotta
    "hsl(225 45% 38%)", // indigo
    "hsl(160 50% 35%)", // teal
    "hsl(38 60% 45%)", // gold
    "hsl(290 40% 45%)", // purple
    "hsl(200 55% 40%)", // blue
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CommentAvatar = ({ name }: { name: string }) => {
  const initial = name.charAt(0).toUpperCase() || "?";
  const bg = getAvatarColor(name);
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
      style={{ backgroundColor: bg }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
};

const CommentItem = ({
  comment,
  user,
  onReply,
  depth = 0,
}: {
  comment: CommentRow;
  user: ReturnType<typeof useAuth>["user"];
  onReply: (id: string, name: string) => void;
  depth?: number;
}) => {
  const displayName = comment.profiles?.display_name_bn ?? comment.profiles?.display_name ?? "পাঠক";

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-border/30 pl-4" : ""}`}>
      <div className="border-b border-border/40 last:border-b-0 py-4">
        <div className="flex items-start gap-3">
          <CommentAvatar name={displayName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bn text-sm font-semibold text-foreground">{displayName}</span>
              {!comment.approved && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-en-sans">
                  অনুমোদনের অপেক্ষায়
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-en-sans">
                <Clock className="w-3 h-3" />
                {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="font-bn leading-relaxed text-foreground/90 text-sm">{comment.body}</p>
            {user && depth === 0 && (
              <button
                onClick={() => onReply(comment.id, displayName)}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors font-en-sans"
              >
                <Reply className="w-3 h-3" />
                উত্তর দিন
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-0">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} user={user} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Comments = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("comments")
      .select("id, body, created_at, approved, user_id, parent_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments error:", error);
      setItems([]);
      return;
    }

    if (data && data.length > 0) {
      const userIds = Array.from(new Set((data as any[]).map((c: any) => c.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, display_name_bn")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enriched = data.map((c: any) => ({
        ...c,
        profiles: profileMap.get(c.user_id) || null,
        replies: [] as CommentRow[],
      }));

      // Build threaded structure
      const topLevel: CommentRow[] = [];
      const byId = new Map<string, CommentRow>(enriched.map((c: CommentRow) => [c.id, c]));
      for (const c of enriched) {
        if (c.parent_id && byId.has(c.parent_id)) {
          byId.get(c.parent_id)!.replies!.push(c);
        } else {
          topLevel.push(c);
        }
      }
      setItems(topLevel);
    } else {
      setItems([]);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check if user is banned
    const { data: profile } = await supabase.from("profiles").select("is_banned").eq("id", user.id).maybeSingle();
    if (profile?.is_banned) {
      toast.error("আপনার অ্যাকাউন্ট মন্তব্য করার অনুমতি নেই।");
      return;
    }

    if (body.trim().length < 2 || body.length > 1000) {
      toast.error("মন্তব্য ২ থেকে ১০০০ অক্ষরের মধ্যে হতে হবে।");
      return;
    }

    setBusy(true);
    const { error } = await (supabase as any).from("comments").insert({
      post_id: postId,
      user_id: user.id,
      body: body.trim(),
      approved: false,
      parent_id: replyTo?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("মন্তব্য জমা হয়েছে। অনুমোদনের পর প্রকাশিত হবে।");
    setBody("");
    setReplyTo(null);
    load();
  };

  const visibleComments = items.filter((c) => c.approved || c.user_id === user?.id);
  const commentCount = visibleComments.reduce((acc, c) => acc + 1 + (c.replies?.filter(r => r.approved || r.user_id === user?.id).length ?? 0), 0);

  return (
    <section className="mt-20 pt-12 border-t border-border/60">
      <div className="flex items-center gap-3 mb-8 pb-3 border-b-2 border-accent/30">
        <MessageSquare className="w-4 h-4 text-accent" />
        <h2 className="font-bn-sans uppercase text-sm font-semibold tracking-wider">
          {commentCount} মন্তব্য
        </h2>
      </div>

      {/* Comment Form */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        {user ? (
          <form onSubmit={submit} className="space-y-4">
            {replyTo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-bn-sans bg-secondary/40 rounded px-3 py-2">
                <Reply className="w-3 h-3" />
                <span><span className="text-accent font-medium">{replyTo.name}</span>-এর উত্তরে লিখছেন</span>
                <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
              </div>
            )}
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
                className="bg-foreground text-background hover:bg-accent hover:text-white rounded-sm font-bn-sans uppercase tracking-wider text-xs px-6"
              >
                {busy ? "জমা হচ্ছে…" : "মন্তব্য করুন"}
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

      {/* Comments List */}
      <div className="space-y-0">
        {visibleComments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            user={user}
            onReply={(id, name) => setReplyTo({ id, name })}
          />
        ))}

        {commentCount === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-bn">এখনো কোনো মন্তব্য নেই।</p>
            <p className="text-muted-foreground/60 text-xs font-en-sans mt-1">প্রথম মন্তব্যকারী হোন।</p>
          </div>
        )}
      </div>
    </section>
  );
};
