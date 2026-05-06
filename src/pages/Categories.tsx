import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

interface CategoryInfo {
  bn: string;
  en: string;
  count: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("posts")
        .select("category_bn, category_en")
        .eq("status", "published");

      if (data) {
        const catMap = new Map<string, { bn: string; en: string; count: number }>();
        data.forEach(post => {
          if (!post.category_bn || !post.category_en) return;
          const key = post.category_en;
          if (catMap.has(key)) {
            catMap.get(key)!.count += 1;
          } else {
            catMap.set(key, { bn: post.category_bn, en: post.category_en, count: 1 });
          }
        });
        setCategories(Array.from(catMap.values()).sort((a, b) => b.count - a.count));
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-paper">
      <SiteHeader />
      <main className="container max-w-4xl py-16 flex-1">
        <h1 className="font-bn text-4xl md:text-5xl mb-12 text-center border-b border-border/60 pb-8">বিভাগসমূহ</h1>
        
        {loading ? (
          <p className="text-center text-muted-foreground py-20 font-bn animate-pulse">খুঁজছি...</p>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-20 font-bn">কোনো বিভাগ পাওয়া যায়নি।</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link 
                key={cat.en} 
                to={`/?cat=${encodeURIComponent(cat.bn)}`}
                className="group flex flex-col items-center justify-center p-8 bg-background border border-border rounded-xl hover:border-accent hover:shadow-sm transition-all"
              >
                <h2 className="font-bn text-3xl mb-2 group-hover:text-accent transition-colors">{cat.bn}</h2>
                <span className="font-en-sans text-[10px] uppercase tracking-widest text-muted-foreground mb-6">{cat.en}</span>
                <span className="font-en-sans text-xs bg-secondary px-3 py-1 rounded-full text-foreground/80 group-hover:bg-accent group-hover:text-white transition-colors">
                  {cat.count} {cat.count === 1 ? 'post' : 'posts'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
