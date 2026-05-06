"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, FileText, MessageSquare, Image, Users, LogOut, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Posts", icon: FileText },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading...</div>;
  if (!user) { router.push("/auth"); return null; }
  if (!isAdmin) { router.push("/"); return null; }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-en-sans transition-colors">
            <ChevronLeft className="w-3 h-3" />Back to site
          </Link>
          <div className="mt-3 font-bn text-xl text-foreground">প্যানেল</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
              >
                <Icon className="w-4 h-4" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors font-en-sans">
            <LogOut className="w-3 h-3" />Sign out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50 flex justify-around py-2 px-4">
        {links.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 text-[10px] px-2 py-1 ${isActive ? "text-accent" : "text-muted-foreground"}`}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 pb-20 md:pb-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
