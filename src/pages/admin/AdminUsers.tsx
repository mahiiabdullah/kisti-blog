import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Role = "super_admin" | "admin" | "user";

interface Row {
  id: string;
  display_name: string | null;
  display_name_bn: string | null;
  roles: Role[];
}

export default function AdminUsers() {
  const { user, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, display_name_bn"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const merged: Row[] = (profiles ?? []).map((p: any) => ({
      ...p,
      roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
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

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-bn text-4xl mb-1">ব্যবহারকারী</h1>
        <p className="text-sm text-muted-foreground font-en">Manage roles — super admin only</p>
      </div>

      {loading ? <p className="text-muted-foreground">…</p> : (
        <div className="border border-border">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
              <div>
                <div className="font-bn">{r.display_name_bn ?? r.display_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground font-en-sans mt-1">
                  {r.roles.length === 0 ? "user" : r.roles.join(", ")}
                  {r.id === user?.id && <span className="ml-2 text-accent">(you)</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {(["admin", "super_admin"] as Role[]).map((role) => {
                  const has = r.roles.includes(role);
                  return (
                    <Button key={role} size="sm" variant={has ? "default" : "outline"}
                      className="rounded-none text-xs" disabled={!isSuperAdmin || r.id === user?.id}
                      onClick={() => setRole(r.id, role, has)}>
                      {has ? "✓ " : ""}{role}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
