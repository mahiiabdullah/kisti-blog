"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Facebook } from "lucide-react";

interface CategoryLink {
  id: string;
  name_bn: string;
  slug: string;
}

export const SiteFooter = () => {
  const [categories, setCategories] = useState<CategoryLink[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name_bn, slug")
        .is("parent_id", null)
        .order("position", { ascending: true })
        .limit(6);
      if (data) setCategories(data as CategoryLink[]);
    })();
  }, []);

  return (
    <footer className="bg-primary dark:bg-[hsl(220,18%,18%)] text-white dark:text-[hsl(40,30%,88%)] mt-16">
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">

          {/* Column 1 — Brand */}
          <div>
            <Link href="/" className="inline-block mb-3 group">
              <img src="/kishti%20banner%20name_2.png" alt="Kisti" className="h-12 object-contain invert mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-white/50 text-xs font-en-sans tracking-[0.2em] mb-3">
              রাষ্ট্র · ইতিহাস · আইন · চিন্তা
            </p>
            <p className="text-white/60 text-sm font-bn leading-relaxed">
              বাংলা ভাষায় রাষ্ট্র, ইতিহাস ও চিন্তার দীর্ঘ-পাঠের একটি প্রকাশনা।
            </p>
          </div>

          {/* Column 2 — Category Links */}
          <div>
            <h4 className="text-gold font-bn-sans uppercase text-xs tracking-[0.2em] mb-4">ক্যাটাগরি</h4>
            <ul className="space-y-2 text-sm font-bn">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="text-white/70 hover:text-gold transition-colors">
                    {c.name_bn}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <>
                  <li><Link href="/category/editorial-column" className="text-white/70 hover:text-gold transition-colors">সম্পাদকীয় কলাম</Link></li>
                  <li><Link href="/category/history" className="text-white/70 hover:text-gold transition-colors">ইতিহাস</Link></li>
                  <li><Link href="/category/law" className="text-white/70 hover:text-gold transition-colors">আইন</Link></li>
                  <li><Link href="/category/state" className="text-white/70 hover:text-gold transition-colors">রাষ্ট্র</Link></li>
                  <li><Link href="/category/thoughts" className="text-white/70 hover:text-gold transition-colors">সমকালীন ভাবনা</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3 — Quick Links */}
          <div>
            <h4 className="text-gold font-bn-sans uppercase text-xs tracking-[0.2em] mb-4">দ্রুত লিংক</h4>
            <ul className="space-y-2 text-sm font-bn">
              <li><Link href="/about" className="text-white/70 hover:text-gold transition-colors">আমাদের কথা</Link></li>
              <li><Link href="/writers" className="text-white/70 hover:text-gold transition-colors">লেখকবৃন্দ</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-gold transition-colors">যোগাযোগ</Link></li>
              <li><Link href="/donate" className="text-white/70 hover:text-gold transition-colors">অনুদান</Link></li>
              <li><Link href="/auth" className="text-white/70 hover:text-gold transition-colors">লগ-ইন করুন</Link></li>
            </ul>
          </div>

          {/* Column 4 — Colophon / Contact */}
          <div>
            <div className="space-y-3 pt-1">
              <p className="text-white/60 text-xs font-bn leading-relaxed">
                যোগাযোগের জন্য সামাজিক যোগাযোগ মাধ্যম বা ইমেইল ব্যবহার করুন।
              </p>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href="https://www.facebook.com/kishtiblog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>
              </div>
              <div className="pt-3 border-t border-white/10 space-y-1">
                <p className="text-gold font-bn font-semibold text-xs mb-2">যোগাযোগ</p>
                <p className="text-white/80 text-xs font-bn font-medium">বুরহান আল মাহমুদ</p>
                <p className="text-white/50 text-xs font-bn">সম্পাদক, কিশতী</p>
                <a href="mailto:kishti.editor@gmail.com" className="text-white/60 text-xs font-en-sans hover:text-gold transition-colors block pt-0.5">
                  kishti.editor@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs font-en-sans">
            © {new Date().getFullYear()} কিশতী — সর্বস্বত্ব সংরক্ষিত
          </p>
          <p className="text-white/20 text-[10px] font-en-sans italic">
            Set in Noto Serif Bengali · Cormorant Garamond · Amiri
          </p>
        </div>
      </div>
    </footer>
  );
};
