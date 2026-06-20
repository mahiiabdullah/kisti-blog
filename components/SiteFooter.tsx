"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Facebook, Twitter } from "lucide-react";

interface CategoryLink {
  id: string;
  name_bn: string;
  slug: string | null;
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
              <img src="/kishti%20banner%20name.png" alt="Kisti" className="h-8 object-contain invert brightness-0 opacity-90 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-white/50 text-xs font-en-sans tracking-[0.2em] mb-3">
              রাষ্ট্র · ইতিহাস · আইন · চিন্তা
            </p>
            <p className="text-white/60 text-sm font-bn leading-relaxed">
              বাংলা ভাষায় রাষ্ট্র, ইতিহাস ও চিন্তার দীর্ঘ-পাঠের একটি প্রকাশনা।
            </p>
          </div>

          {/* Column 2 — Categories */}
          <div>
            <h4 className="text-gold font-bn-sans uppercase text-xs tracking-[0.2em] mb-4">বিভাগ</h4>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.slug ? `/category/${c.slug}` : `/?cat=${c.id}`}
                    className="text-white/60 text-sm font-bn hover:text-gold transition-colors"
                  >
                    {c.name_bn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Links */}
          <div>
            <h4 className="text-gold font-bn-sans uppercase text-xs tracking-[0.2em] mb-4">সাইট</h4>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "আমাদের কথা" },
                { href: "/writers", label: "লেখকবৃন্দ" },
                { href: "/contact", label: "যোগাযোগ" },
                { href: "/search", label: "অনুসন্ধান" },
                { href: "/auth", label: "যোগ দিন" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 text-sm font-bn hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Colophon / Contact */}
          <div>
            <h4 className="text-gold font-bn-sans uppercase text-xs tracking-[0.2em] mb-4">সম্পর্ক</h4>
            <div className="space-y-3">
              <p className="text-white/60 text-xs font-bn leading-relaxed">
                যোগাযোগের জন্য সামাজিক যোগাযোগ মাধ্যম বা ইমেইল ব্যবহার করুন।
              </p>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black flex items-center justify-center hover:opacity-80 transition-opacity border border-white/20"
                  aria-label="X / Twitter"
                >
                  <Twitter className="w-4 h-4 text-white" />
                </a>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/40 text-xs font-en-sans">কিশতী</p>
                <p className="text-white/40 text-xs font-en-sans">সাপ্তাহিক · বাংলাদেশ</p>
                <a href="mailto:kishti@example.com" className="text-white/40 text-xs font-en-sans hover:text-gold transition-colors">
                  kishti@example.com
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
