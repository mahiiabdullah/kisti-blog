"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye, BookOpen, FileText, Users, TrendingUp,
  FilePen, Clock, CheckCircle2, BarChart2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface DashStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalUsers: number;
  totalReads: number;
  totalCategories: number;
}

interface TopPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  views: number;
  status: string;
}

interface RecentPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  created_at: string;
  category_bn: string | null;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: boolean;
}) => (
  <div className="bg-card border border-border p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
    <div
      className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 ${
        accent ? "bg-primary text-gold" : "bg-secondary text-foreground"
      }`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs font-en-sans uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-3xl font-en-sans font-bold text-foreground mt-0.5">{value}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalUsers: 0,
    totalReads: 0,
    totalCategories: 0,
  });
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          { count: totalPosts },
          { count: publishedPosts },
          { count: draftPosts },
          { count: totalUsers },
          { count: totalCategories },
          analyticsRes,
          recentRes,
        ] = await Promise.all([
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
          supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("categories").select("*", { count: "exact", head: true }),
          // Top posts by views
          supabase
            .from("posts")
            .select("id, slug, status, category_bn, post_translations(title, lang), post_stats(view_count)")
            .eq("status", "published")
            .limit(50),
          // Recent posts
          supabase
            .from("posts")
            .select("id, slug, status, created_at, category_bn, post_translations(title, lang)")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        // Total reads
        let totalReads = 0;
        const postsWithViews: TopPost[] = [];
        if (analyticsRes.data) {
          for (const p of analyticsRes.data as any[]) {
            const views = (p.post_stats as any[])?.[0]?.view_count ?? 0;
            totalReads += views;
            const title =
              (p.post_translations as any[])?.find((t: any) => t.lang === "bn")?.title ||
              (p.post_translations as any[])?.[0]?.title ||
              "(untitled)";
            postsWithViews.push({ id: p.id, slug: p.slug, title, category: p.category_bn || "", views, status: p.status });
          }
          postsWithViews.sort((a, b) => b.views - a.views);
        }

        const recentMapped: RecentPost[] = ((recentRes.data as any[]) || []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          status: p.status,
          created_at: p.created_at,
          category_bn: p.category_bn,
          title:
            (p.post_translations as any[])?.find((t: any) => t.lang === "bn")?.title ||
            (p.post_translations as any[])?.[0]?.title ||
            "(untitled)",
        }));

        setStats({
          totalPosts: totalPosts ?? 0,
          publishedPosts: publishedPosts ?? 0,
          draftPosts: draftPosts ?? 0,
          totalUsers: totalUsers ?? 0,
          totalReads,
          totalCategories: totalCategories ?? 0,
        });
        setTopPosts(postsWithViews.slice(0, 10));
        setRecentPosts(recentMapped);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-bn text-4xl mb-1">ড্যাশবোর্ড</h1>
        <p className="text-sm text-muted-foreground font-en">Overview · Analytics · Recent activity</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-secondary rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <StatCard icon={FileText} label="মোট লেখা" value={stats.totalPosts} />
          <StatCard icon={CheckCircle2} label="প্রকাশিত" value={stats.publishedPosts} accent />
          <StatCard icon={FilePen} label="ড্রাফট" value={stats.draftPosts} />
          <StatCard icon={Eye} label="মোট পাঠ" value={stats.totalReads.toLocaleString("en-US")} />
          <StatCard icon={Users} label="ব্যবহারকারী" value={stats.totalUsers} />
          <StatCard icon={BarChart2} label="বিভাগ" value={stats.totalCategories} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top posts analytics */}
        <div className="bg-card border border-border">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-bn text-base">সর্বোচ্চ পঠিত</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground font-en-sans text-sm animate-pulse">Loading…</div>
          ) : topPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm font-en">No view data yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topPosts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
                  <span className="text-lg font-en-sans font-bold text-muted-foreground/40 w-6 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/post/${p.slug}`}
                      target="_blank"
                      className="font-bn text-sm line-clamp-1 hover:text-gold transition-colors"
                    >
                      {p.title}
                    </Link>
                    {p.category && (
                      <span className="text-[10px] font-en-sans text-muted-foreground">{p.category}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-en-sans font-semibold text-sm">{p.views.toLocaleString("en-US")}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">পাঠ</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="bg-card border border-border">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bn text-base">সাম্প্রতিক লেখা</h2>
            </div>
            <Link href="/admin" className="text-xs font-en-sans text-muted-foreground hover:text-foreground transition-colors">
              সব দেখুন →
            </Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground font-en-sans text-sm animate-pulse">Loading…</div>
          ) : recentPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm font-en">No posts yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentPosts.map((p) => (
                <div key={p.id} className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      p.status === "published" ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="font-bn text-sm line-clamp-1 hover:text-gold transition-colors"
                    >
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.category_bn && (
                        <span className="text-[10px] font-bn text-muted-foreground">{p.category_bn}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <span className="text-[10px] font-en-sans text-muted-foreground">{fmtDate(p.created_at)}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-en-sans uppercase tracking-wider shrink-0 ${
                      p.status === "published" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
