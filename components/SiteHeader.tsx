"use client";

import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const nav = [
  { to: "/", label: "প্রচ্ছদ" },
  {
    label: "ইসলাম ও আধুনিকতা",
    items: [
      { to: "/?cat=সেক্যুলারিজম ও ধর্ম", label: "সেক্যুলারিজম ও ধর্ম" },
      { to: "/?cat=উত্তর-আধুনিকতা", label: "উত্তর-আধুনিকতা" },
      { to: "/?cat=মুসলিম আধুনিকতাবাদ", label: "মুসলিম আধুনিকতাবাদ" },
      { to: "/?cat=ইসলামি পুনরুজ্জীবন", label: "ইসলামি পুনরুজ্জীবন" },
    ],
  },
  {
    label: "শরিয়া ও ফিকহ",
    items: [
      { to: "/?cat=উসুলুল ফিকহ", label: "উসুলুল ফিকহ" },
      { to: "/?cat=সমসাময়িক মাসায়েল", label: "সমসাময়িক মাসায়েল" },
      { to: "/?cat=মাকাসিদ আশ-শরিয়া", label: "মাকাসিদ আশ-শরিয়া" },
      { to: "/?cat=তুলনামূলক ফিকহ", label: "তুলনামূলক ফিকহ" },
    ],
  },
  {
    label: "রাজনৈতিক ইসলাম",
    items: [
      { to: "/?cat=খেলাফত ও রাষ্ট্রতত্ত্ব", label: "খেলাফত ও রাষ্ট্রতত্ত্ব" },
      { to: "/?cat=গণতন্ত্র ও ইসলাম", label: "গণতন্ত্র ও ইসলাম" },
      { to: "/?cat=ইসলামী আন্দোলন", label: "ইসলামী আন্দোলন" },
    ],
  },
  { to: "/?cat=ইতিহাস ও সভ্যতা", label: "ইতিহাস ও সভ্যতা" },
  { to: "/?cat=তত্ত্ব ও দর্শন", label: "তত্ত্ব ও দর্শন" },
  { to: "/?cat=বাংলাদেশ প্রসঙ্গ", label: "বাংলাদেশ প্রসঙ্গ" },
  { to: "/?cat=গ্রন্থালোচনা", label: "গ্রন্থালোচনা" },
];

// Desktop dropdown menu component
const DesktopNavMenu = ({ items, label }: { items: typeof nav[0]["items"]; label: string }) => {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
        {label}
        <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute left-0 mt-0 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-popover border border-border rounded-lg shadow-lg py-2">
          {items?.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className="block w-full px-4 py-2 text-sm transition-colors text-left cursor-pointer font-bn-sans text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mobile menu component
const MobileNavMenu = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
      <nav className="flex flex-col gap-0 mt-8">
        {nav.map((n) => (
          <div key={n.label}>
            {n.items ? (
              <div>
                <button
                  onClick={() => toggleExpand(n.label)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                >
                  {n.label}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedItems.includes(n.label) ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {expandedItems.includes(n.label) && (
                  <div className="flex flex-col gap-0 mt-0 pl-4 border-l border-border/50">
                    {n.items.map((item) => (
                      <Link
                        key={item.to}
                        href={item.to}
                        className="px-3 py-2 text-sm font-bn-sans transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={n.to!}
                className="block px-4 py-3 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </SheetContent>
  );
};

export const SiteHeader = () => {
  const { isAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-2 group flex-shrink-0">
            <span className="font-bn text-2xl sm:text-3xl font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
              কিস্তি
            </span>
            <span className="hidden sm:inline font-en italic text-xs sm:text-sm text-muted-foreground tracking-wider">
              ki<span className="text-accent">S</span>ti
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0">
            {nav.map((n) => (
              <div key={n.label}>
                {n.items ? (
                  <DesktopNavMenu items={n.items} label={n.label} />
                ) : (
                  <Link
                    href={n.to!}
                    className={`px-3 py-2 text-sm font-medium transition-colors flex justify-center items-center ${
                      pathname === n.to ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-40 rounded-full border border-border bg-background/50 px-3 pl-10 text-sm focus:outline-none focus:border-accent focus:bg-background transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Auth Section */}
            {!user ? (
              <Link
                href="/auth"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-8 w-8 hover:ring-2 hover:ring-accent transition-all">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="font-en-sans text-xs bg-accent text-accent-foreground">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-en-sans">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => supabase.auth.signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden p-2 text-foreground transition-colors hover:text-muted-foreground"
                  aria-label="Toggle Mobile Menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </SheetTrigger>
              <MobileNavMenu />
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full h-9 rounded-full border border-border bg-background/50 px-3 pl-10 text-sm focus:outline-none focus:border-accent focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  );
};
