"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Role = "super_admin" | "admin" | "user";

interface Row { id: string; display_name: string | null; display_name_bn: string | null; roles: Role[]; is_banned: boolean; }

export default function AdminUsers() {
  const { user, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, display_name_bn, is_banned"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const merged: Row[] = (profiles ?? []).map((p: any) => ({
      ...p,
      roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      is_banned: p.is_banned ?? false
    }));
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: Role, has: boolean) => {
    if (!isSuperAdmin) { toast.error("Super admin only"); return; }
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Updated");
    load();
  };

  const toggleBan = async (userId: string, is_banned: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_banned: !is_banned }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(is_banned ? "User unbanned" : "User banned");
    load();
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Are you sure? This will delete the user's profile and ALL their comments permanently.")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      
      toast.success("User removed successfully");
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-bn text-4xl mb-1">ব্যবহারকারী</h1>
        <p className="text-sm text-muted-foreground font-en">Manage roles — super admin only</p>
      </div>

      {loading ? <p className="text-muted-foreground">…</p> : (
        <div className="border border-border">
          {rows.map((r) => {
            const isTargetSuperAdmin = r.roles.includes("super_admin");
            const isTargetAdmin = r.roles.includes("admin");
            const canManageRoles = isSuperAdmin && r.id !== user?.id;
            // Admins can manage users, as long as the target isn't an admin/super_admin
            const canRestrictOrRemove = (isSuperAdmin || (!isTargetSuperAdmin && !isTargetAdmin)) && r.id !== user?.id;

            return (
              <div key={r.id} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 flex-wrap gap-4">
                <div>
                  <div className="font-bn flex items-center gap-2">
                    {r.display_name_bn ?? r.display_name ?? "—"}
                    {r.is_banned && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-destructive/10 text-destructive font-en-sans">Banned</span>}
                  </div>
                  <div className="text-xs text-muted-foreground font-en-sans mt-1">
                    {r.roles.length === 0 ? "user" : r.roles.join(", ")}
                    {r.id === user?.id && <span className="ml-2 text-accent">(you)</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  {(["admin", "super_admin"] as Role[]).map((role) => {
                    const has = r.roles.includes(role);
                    return (
                      <Button key={role} size="sm" variant={has ? "default" : "outline"}
                        className="rounded-none text-xs" disabled={!canManageRoles}
                        onClick={() => setRole(r.id, role, has)}>
                        {has ? "✓ " : ""}{role}
                      </Button>
                    );
                  })}
                  <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>
                  <Button size="sm" variant={r.is_banned ? "default" : "secondary"} className="rounded-none text-xs"
                    disabled={!canRestrictOrRemove}
                    onClick={() => toggleBan(r.id, r.is_banned)}>
                    {r.is_banned ? "Unban" : "Ban"}
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-none text-xs"
                    disabled={!canRestrictOrRemove}
                    onClick={() => removeUser(r.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
