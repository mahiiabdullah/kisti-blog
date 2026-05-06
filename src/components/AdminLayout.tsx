import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, FileText, MessageSquare, Users, Image, LayoutDashboard, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin", label: "Posts", icon: FileText, end: true },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/media", label: "Media", icon: Image },
  { to: "/admin/users", label: "Users", icon: Users, superOnly: true },
];

export const AdminLayout = () => {
  const { isSuperAdmin, user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      <Link to="/" className="flex items-baseline gap-2 mb-12 px-3">
        <span className="font-bn text-2xl">কিস্তি</span>
        <span className="font-en italic text-xs text-muted-foreground">admin</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.filter((l) => !l.superOnly || isSuperAdmin).map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            <l.icon className="w-4 h-4" /> <span className="font-en-sans">{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3">
        <div className="text-xs text-muted-foreground mb-3 truncate">{user?.email}</div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button onClick={signOut} className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-bn text-xl">কিস্তি</span>
          <span className="font-en italic text-xs text-muted-foreground">admin</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border flex-col p-6 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
