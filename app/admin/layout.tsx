"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, FileText, MessageSquare, Image,
  Users, LogOut, ChevronLeft, FolderTree, PenTool, FileEdit,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ── Navigation items (Analytics merged into Dashboard) ─────────────────
const links = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin",           label: "Posts",       icon: FileText,        exact: true },
  { href: "/admin/writers",   label: "Writers",     icon: PenTool,         exact: false },
  { href: "/admin/comments",  label: "Comments",    icon: MessageSquare,   exact: false },
  { href: "/admin/categories",label: "Categories",  icon: FolderTree,      exact: false },
  { href: "/admin/media",     label: "Media",       icon: Image,           exact: false },
  { href: "/admin/users",     label: "Users",       icon: Users,           exact: false },
  { href: "/admin/about",     label: "About Page",  icon: FileEdit,        exact: false },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse font-en-sans">
        Loading admin…
      </div>
    );
  if (!user) { router.push("/auth"); return null; }
  if (!isAdmin) { router.push("/"); return null; }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)]">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        {/* Back link + brand */}
        <div className="p-4 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-en-sans transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> সাইটে ফিরুন
          </Link>
          <div className="mt-3 font-bn text-xl text-foreground">অ্যাডমিন প্যানেল</div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-en-sans">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors font-en-sans"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50 flex justify-around py-2 px-1">
        {links.slice(0, 5).map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-[9px] px-2 py-1 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-en-sans">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
