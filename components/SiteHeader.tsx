"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavCategory {
  id: string;
  name_bn: string;
  name_en: string | null;
  slug?: string | null;
  parent_id: string | null;
  position: number;
  children?: NavCategory[];
}

interface NavItem {
  to?: string;
  label: string;
  items?: { to: string; label: string }[];
}

const getBengaliDate = () => {
  const now = new Date();
  const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const bn = (n: number) => n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
  return `${days[now.getDay()]}, ${bn(now.getDate())} ${months[now.getMonth()]} ${bn(now.getFullYear())}`;
};

// Desktop nav dropdown
const DesktopDropdown = ({ label, items }: { label: string; items: { to: string; label: string }[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 px-3 py-3 text-sm text-white/90 hover:text-gold transition-colors font-bn">
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 min-w-[180px] bg-primary border-t-2 border-gold shadow-lg z-50">
          {items.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className="block px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 transition-colors font-bn border-b border-white/10 last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const SiteHeader = () => {
  const { isAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [nav, setNav] = useState<NavItem[]>([]);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(getBengaliDate());
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("position", { ascending: true });

      if (data && data.length > 0) {
        const all = data as unknown as NavCategory[];
        const mains = all.filter((c) => !c.parent_id).sort((a, b) => a.position - b.position);
        const built: NavItem[] = [];
        for (const m of mains) {
          const children = all.filter((c) => c.parent_id === m.id).sort((a, b) => a.position - b.position);
          if (children.length > 0) {
            built.push({
              label: m.name_bn,
              items: children.map((c) => ({
                to: c.slug ? `/category/${c.slug}` : `/?cat=${c.id}`,
                label: c.name_bn,
              })),
            });
          } else {
            built.push({
              to: m.slug ? `/category/${m.slug}` : `/?cat=${m.id}`,
              label: m.name_bn,
            });
          }
        }
        setNav(built);
      } else {
        setNav([]);
      }
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* ── TOP UTILITY BAR ──────────────────────────── */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-10 h-10 flex items-center justify-center rounded-sm overflow-hidden bg-primary">
                <img src="/kishti%20logo.png" alt="Kisti Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-none h-10 justify-center">
                <img src="/kishti%20banner%20name.png" alt="Kisti" className="h-6 object-contain" />
              </div>
            </Link>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Utility links (desktop) */}
            <nav className="hidden md:flex items-center gap-4 text-xs font-bn-sans text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">আমাদের কথা</Link>
              <span className="text-border">·</span>
              <Link href="/writers" className="hover:text-foreground transition-colors">লেখকবৃন্দ</Link>
              <span className="text-border">·</span>
              <Link href="/contact" className="hover:text-foreground transition-colors">যোগাযোগ</Link>
            </nav>

            {/* Date (desktop) */}
            {dateStr && (
              <span className="hidden lg:block text-xs font-bn-sans text-muted-foreground border-l border-border pl-4">
                {dateStr}
              </span>
            )}

            {/* Auth */}
            {!user ? (
              <Link
                href="/auth"
                className="hidden md:block px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bn-sans hover:bg-primary/90 transition-colors rounded-sm"
              >
                প্রবেশ করুন
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-8 w-8 hover:ring-2 hover:ring-gold transition-all">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bn">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer font-bn">প্রোফাইল</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer font-bn">অ্যাডমিন</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => supabase.auth.signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive font-bn"
                  >
                    প্রস্থান
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />

            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileSearchOpen((v) => !v)}
              aria-label="Toggle Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile search bar */}
          {isMobileSearchOpen && (
            <form onSubmit={handleSearch} className="pb-3 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="খুঁজুন..."
                  autoFocus
                  className="w-full h-9 rounded-sm border border-border bg-background px-3 pl-10 text-sm font-bn focus:outline-none focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── DARK NAV BAR ─────────────────────────────── */}
      <div className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {/* Mobile hamburger on left */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-3 text-white hover:text-gold transition-colors" aria-label="Menu">
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm bg-primary text-white border-r-0">
                <div className="mb-8 mt-2">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bn text-2xl text-gold">
                    কিশতী
                  </Link>
                </div>
                <nav className="flex flex-col">
                  {nav.map((n) => (
                    <div key={n.label}>
                      {n.items ? (
                        <details className="group">
                          <summary className="flex items-center justify-between px-2 py-3 text-sm text-white/90 hover:text-gold cursor-pointer font-bn list-none">
                            {n.label}
                            <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="pl-4 flex flex-col border-l border-white/20 ml-2">
                            {n.items.map((item) => (
                              <Link
                                key={item.to}
                                href={item.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <Link
                          href={n.to!}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-2 py-3 text-sm text-white/90 hover:text-gold font-bn transition-colors border-b border-white/10"
                        >
                          {n.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center flex-1">
              {nav.map((n) =>
                n.items ? (
                  <DesktopDropdown key={n.label} label={n.label} items={n.items} />
                ) : (
                  <Link
                    key={n.label}
                    href={n.to!}
                    className={`px-3 py-3 text-sm font-bn transition-colors ${
                      pathname === n.to ? "text-gold" : "text-white/90 hover:text-gold"
                    }`}
                  >
                    {n.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop search (right side of nav) */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                <input
                  type="search"
                  placeholder="খুঁজুন..."
                  className="h-8 w-44 bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 pl-8 text-xs font-bn rounded-sm focus:outline-none focus:border-gold focus:bg-white/15 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
};
