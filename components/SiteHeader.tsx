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

const getFullHijriDate = () => {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = formatter.formatToParts(now);
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
    const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "1448", 10);

    const hijriMonthsBn = [
      "মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি",
      "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান",
      "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"
    ];
    const hijriMonthsEn = [
      "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
      "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah"
    ];

    const monthIdx = Math.min(Math.max(month - 1, 0), 11);
    const bn = (num: number) => num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

    return {
      hijriBn: `${bn(day)} ${hijriMonthsBn[monthIdx]}, ${bn(year)} হি.`,
      hijriEn: `${day} ${hijriMonthsEn[monthIdx]}, ${year} AH`,
    };
  } catch (e) {
    return {
      hijriBn: "৫ রবিউল আউয়াল, ১৪৪৮ হি.",
      hijriEn: "5 Rabi al-Awwal, 1448 AH",
    };
  }
};

interface DateInfo { bnLine: string; hijriBn: string; bangabdaLine: string; }

const getBangabdaDate = (now: Date): string => {
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  const year = now.getFullYear();

  // Bangladesh revised Bengali calendar: Gregorian month (0-based), start day, Bengali month index
  // Bengali months: 0=বৈশাখ, 1=জ্যৈষ্ঠ, 2=আষাড়, 3=শ্রাবণ, 4=ভাদ্র, 5=আশ্বিন
  //                 6=কার্তিক, 7=অগ্রহায়ণ, 8=পৌষ, 9=মাঘ, 10=ফাল্গুন, 11=চৈত্র
  const boundaries = [
    { gDay: 13, bnM: 9 },  // Jan 13 → মাঘ
    { gDay: 12, bnM: 10 }, // Feb 12 → ফাল্গুন
    { gDay: 13, bnM: 11 }, // Mar 13 → চৈত্র
    { gDay: 14, bnM: 0 },  // Apr 14 → বৈশাখ
    { gDay: 15, bnM: 1 },  // May 15 → জ্যৈষ্ঠ
    { gDay: 15, bnM: 2 },  // Jun 15 → আষাড়
    { gDay: 16, bnM: 3 },  // Jul 16 → শ্রাবণ
    { gDay: 16, bnM: 4 },  // Aug 16 → ভাদ্র
    { gDay: 16, bnM: 5 },  // Sep 16 → আশ্বিন
    { gDay: 16, bnM: 6 },  // Oct 16 → কার্তিক
    { gDay: 15, bnM: 7 },  // Nov 15 → অগ্রহায়ণ
    { gDay: 15, bnM: 8 },  // Dec 15 → পৌষ
  ];
  const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাড়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];

  let bnMonthIdx: number;
  let bnDay: number;

  if (day >= boundaries[month].gDay) {
    bnMonthIdx = boundaries[month].bnM;
    bnDay = day - boundaries[month].gDay + 1;
  } else {
    const prevM = (month - 1 + 12) % 12;
    bnMonthIdx = boundaries[prevM].bnM;
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    bnDay = daysInPrevMonth - boundaries[prevM].gDay + 1 + day;
  }

  const bnYear = (month > 3 || (month === 3 && day >= 14)) ? year - 593 : year - 594;
  const bn = (n: number) => n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
  return `${bn(bnDay)} ${bnMonths[bnMonthIdx]}, ${bn(bnYear)} বঙ্গাব্দ`;
};

const getAllDates = (): DateInfo => {
  const now = new Date();
  const bnDays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const bn = (num: number) => num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
  const { hijriBn } = getFullHijriDate();
  return {
    bnLine: `${bnDays[now.getDay()]}, ${bn(now.getDate())} ${bnMonths[now.getMonth()]} ${bn(now.getFullYear())}`,
    hijriBn,
    bangabdaLine: getBangabdaDate(now),
  };
};

// Desktop nav dropdown
const DesktopDropdown = ({ label, to, items }: { label: string; to?: string; items: { to: string; label: string }[] }) => {
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
      <Link
        href={to ?? "#"}
        className="flex items-center gap-1 px-3 py-3 text-sm text-white/90 hover:text-gold transition-colors font-bn"
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Link>
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
  const [dates, setDates] = useState<DateInfo | null>(null);

  useEffect(() => {
    setDates(getAllDates());
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("position", { ascending: true });

      if (data && data.length > 0) {
        const all = data as unknown as NavCategory[];
        const mains = all
          .filter((c) => !c.parent_id && c.name_bn !== "লেখকবৃন্দ")
          .sort((a, b) => a.position - b.position);
        const built: NavItem[] = [];
        for (const m of mains) {
          const children = all.filter((c) => c.parent_id === m.id).sort((a, b) => a.position - b.position);
          const parentUrl = m.slug ? `/category/${m.slug}` : `/?cat=${m.id}`;
          if (children.length > 0) {
            built.push({
              to: parentUrl,
              label: m.name_bn,
              items: children.map((c) => ({
                to: c.slug ? `/category/${c.slug}` : `/?cat=${c.id}`,
                label: c.name_bn,
              })),
            });
          } else {
            built.push({
              to: parentUrl,
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
          <div className="grid grid-cols-3 items-center h-20 gap-2 sm:gap-4">
            {/* Left Column: Utility links (desktop) */}
            <div className="flex items-center justify-start">
              <nav className="hidden lg:flex items-center gap-3 text-xs font-bn-sans text-muted-foreground">
                <Link href="/about" className="hover:text-foreground transition-colors">আমাদের কথা</Link>
                <span className="text-border">·</span>
                <Link href="/writers" className="hover:text-foreground transition-colors">লেখকবৃন্দ</Link>
                <span className="text-border">·</span>
                <Link href="/contact" className="hover:text-foreground transition-colors">যোগাযোগ</Link>
              </nav>
            </div>

            {/* Center Column: Logo (Middle Aligned) */}
            <div className="flex items-center justify-center">
              <Link href="/" className="flex items-center group flex-shrink-0">
                <div className="flex flex-col leading-none h-18 justify-center">
                  <img src="/kishti%20banner%20name_2.png" alt="Kisti" className="h-14 sm:h-16 object-contain dark:brightness-0 dark:invert" />
                </div>
              </Link>
            </div>

            {/* Right Column: Date block + Auth + Theme toggle */}
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              {/* Date block */}
              {dates && (
                <div className="hidden md:flex flex-col text-right items-end gap-0.5 border-r border-border/60 pr-3 mr-1">
                  <span className="text-[11px] font-bn-sans text-muted-foreground leading-tight">{dates.bnLine}</span>
                  <span className="text-[11px] font-bn-sans text-muted-foreground/75 leading-tight">{dates.hijriBn}</span>
                  <span className="text-[11px] font-bn-sans text-muted-foreground/60 leading-tight">{dates.bangabdaLine}</span>
                </div>
              )}

              {/* Auth */}
              {!user ? (
                <Link
                  href="/auth"
                  className="hidden sm:block px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bn-sans hover:bg-primary/90 transition-colors rounded-sm"
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
      <div className="bg-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {/* Mobile hamburger on left */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-3 text-white hover:text-gold transition-colors" aria-label="Menu">
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm bg-navy text-white border-r-0">
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

                  {/* Divider */}
                  <div className="my-4 border-t border-white/10" />

                  {/* Utility Links */}
                  <div className="flex flex-col space-y-1">
                    <Link
                      href="/about"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                    >
                      আমাদের কথা
                    </Link>
                    <Link
                      href="/writers"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                    >
                      লেখকবৃন্দ
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                    >
                      যোগাযোগ
                    </Link>
                    <Link
                      href="/search"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                    >
                      অনুসন্ধান
                    </Link>
                    <Link
                      href="/donate"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                    >
                      অনুদান
                    </Link>
                    {!user ? (
                      <Link
                        href="/auth"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                      >
                        লগ-ইন করুন
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                        >
                          প্রোফাইল
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-2 py-2 text-sm text-white/70 hover:text-gold font-bn transition-colors"
                          >
                            অ্যাডমিন
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            supabase.auth.signOut();
                          }}
                          className="block text-left w-full px-2 py-2 text-sm text-destructive hover:text-destructive/80 font-bn transition-colors"
                        >
                          প্রস্থান
                        </button>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center justify-center flex-1">
              {nav.map((n) =>
                n.items ? (
                  <DesktopDropdown key={n.label} label={n.label} to={n.to} items={n.items} />
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
