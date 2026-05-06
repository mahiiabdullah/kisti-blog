"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: true });
      const { count: publishedPosts } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published");
      const { count: draftPosts } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft");
      const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      setStats({
        totalPosts: totalPosts || 0,
        publishedPosts: publishedPosts || 0,
        draftPosts: draftPosts || 0,
        totalUsers: totalUsers || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-en-sans font-semibold tracking-tight">Dashboard</h1>
      </div>

      {loading ? (
        <div className="text-muted-foreground font-en-sans text-sm animate-pulse">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Posts" value={stats.totalPosts} />
          <StatCard title="Published Posts" value={stats.publishedPosts} />
          <StatCard title="Drafts" value={stats.draftPosts} />
          <StatCard title="Total Users" value={stats.totalUsers} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-background border border-border p-6 rounded-lg shadow-sm hover:border-accent/40 transition-colors">
      <h3 className="text-muted-foreground text-xs font-en-sans uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-4xl font-semibold font-en-sans text-foreground">{value}</p>
    </div>
  );
}
