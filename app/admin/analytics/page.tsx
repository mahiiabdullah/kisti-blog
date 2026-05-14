"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Eye, TrendingUp, Users, BookOpen } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalReads: 0,
    totalWritings: 0,
    topPosts: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      // Fetch post stats and join with posts and translations for titles
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          id, slug,
          post_translations(title, lang),
          post_stats(view_count, unique_visitors)
        `)
        .eq("status", "published");

      if (postsData && !error) {
        let totalViews = 0;
        const postsWithViews = postsData.map((post: any) => {
          const views = post.post_stats?.[0]?.view_count || 0;
          totalViews += views;
          const title = post.post_translations.find((t: any) => t.lang === "bn")?.title || post.post_translations[0]?.title || "Untitled";
          return {
            id: post.id,
            slug: post.slug,
            title,
            views
          };
        });

        // Sort descending by views
        postsWithViews.sort((a, b) => b.views - a.views);

        setStats({
          totalReads: totalViews,
          totalWritings: postsData.length,
          topPosts: postsWithViews.slice(0, 10), // Top 10
        });
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bn">পাঠক বিশ্লেষণ</h1>
        <p className="text-muted-foreground text-sm mt-1">Readership Analytics and Trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-en-sans">Total Reads</p>
            <p className="text-3xl font-bn-sans font-bold">
              {loading ? "..." : stats.totalReads.toLocaleString("en-US")}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-en-sans">Published Posts</p>
            <p className="text-3xl font-bn-sans font-bold">
              {loading ? "..." : stats.totalWritings}
            </p>
          </div>
        </div>
        
        {/* Placeholder for future features */}
        <div className="bg-card border border-border p-6 shadow-sm flex items-center gap-4 opacity-50">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-en-sans">Unique Visitors</p>
            <p className="text-xs font-en-sans text-muted-foreground mt-1">Coming Soon</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-bn">সর্বোচ্চ পঠিত লেখা (Top Performing)</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>
        ) : stats.topPosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No data available yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {stats.topPosts.map((post, index) => (
              <div key={post.id} className="p-4 px-6 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center font-en-sans text-muted-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bn text-xl line-clamp-1">
                      <Link href={`/post/${post.slug}`} target="_blank" className="hover:text-accent transition-colors">
                        {post.title}
                      </Link>
                    </h3>
                    <div className="text-xs font-en-sans text-muted-foreground mt-1">/{post.slug}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-en-sans font-semibold text-lg">{post.views.toLocaleString("en-US")}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest ml-1">Reads</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
