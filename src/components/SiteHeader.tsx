import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export const SiteHeader = () => {
  const { isAdmin, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container max-w-6xl flex items-center justify-between py-5">
        <Link to="/" className="flex items-baseline gap-3 group">
          <span className="font-bn text-3xl font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
            কিস্তি
          </span>
          <span className="font-en italic text-sm text-muted-foreground tracking-wider">
            ki<span className="text-accent">S</span>ti
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              {nav.map((n) => (
                <NavigationMenuItem key={n.label}>
                  {n.items ? (
                    <>
                      <NavigationMenuTrigger className="font-bn-sans text-sm tracking-wide bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                        {n.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-2 p-4 bg-background border border-border shadow-md rounded-md">
                          {n.items.map((item) => (
                            <li key={item.to}>
                              <NavigationMenuLink asChild>
                                <NavLink
                                  to={item.to}
                                  className={({ isActive }) =>
                                    `block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground font-bn-sans text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"
                                    }`
                                  }
                                >
                                  {item.label}
                                </NavLink>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavLink
                      to={n.to!}
                      end={n.to === "/"}
                      className={({ isActive }) =>
                        `group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-bn-sans tracking-wide transition-colors hover:text-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      {n.label}
                    </NavLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <form onSubmit={handleSearch} className="relative ml-4">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="h-8 w-40 rounded-full border border-border bg-background px-3 pl-8 text-xs focus:outline-none focus:border-foreground transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="font-en-sans text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">Admin</Link>
          )}
          {!user ? (
            <Link to="/auth" className="font-en-sans text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">Sign in</Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="font-en-sans text-xs">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 font-en-sans">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()} className="cursor-pointer text-red-500 focus:text-red-500">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ThemeToggle />
          <button
            className="lg:hidden p-2 -mr-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-background border-b border-border/60 py-4 shadow-lg flex flex-col">
          <form onSubmit={handleSearch} className="relative px-6 mb-4">
            <Search className="absolute left-9 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-full rounded-full border border-border bg-background px-3 pl-10 text-sm focus:outline-none focus:border-foreground transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="px-6 flex flex-col gap-1">
            {nav.map((n) =>
              n.items ? (
                <Accordion type="single" collapsible key={n.label} className="w-full">
                  <AccordionItem value={n.label} className="border-none">
                    <AccordionTrigger className="py-3 font-bn-sans text-base tracking-wide text-muted-foreground hover:text-foreground hover:no-underline">
                      {n.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1 pl-4 border-l border-border ml-2">
                        {n.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `py-2 font-bn-sans text-sm tracking-wide transition-colors ${isActive
                                ? "text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                              }`
                            }
                          >
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <NavLink
                  key={n.to}
                  to={n.to!}
                  end={n.to === "/"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `py-3 font-bn-sans text-base tracking-wide transition-colors ${isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
};
