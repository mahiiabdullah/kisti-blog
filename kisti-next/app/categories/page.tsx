"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("posts")
        .select("category_bn")
        .eq("status", "published");

      const map = new Map<string, number>();
      for (const row of data ?? []) {
        if (row.category_bn) {
          map.set(row.category_bn, (map.get(row.category_bn) ?? 0) + 1);
        }
      }
      setCategories(
        Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main className="container max-w-4xl py-16 flex-1">
      <h1 className="font-bn text-5xl mb-8">বিভাগসমূহ</h1>
      {loading ? (
        <p className="text-muted-foreground">…</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground font-bn">কোনো বিভাগ নেই।</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Link
              href={`/?cat=${encodeURIComponent(c.name)}`}
              key={c.name}
              className="group border border-border p-6 hover:border-accent/40 transition-colors"
            >
              <h2 className="font-bn text-xl group-hover:text-accent transition-colors">{c.name}</h2>
              <p className="text-xs text-muted-foreground font-en-sans mt-1">{c.count} posts</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
