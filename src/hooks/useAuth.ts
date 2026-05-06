import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "super_admin" | "admin" | "user";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSessionAndRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (mounted) {
          setRoles((data ?? []).map((r: any) => r.role as Role));
        }
      } else {
        if (mounted) setRoles([]);
      }

      if (mounted) setLoading(false);
    };

    fetchSessionAndRoles();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return;
      if (s?.user && !user) setLoading(true); // User signing in, wait for roles
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", s.user.id);
        if (mounted) setRoles((data ?? []).map((r: any) => r.role as Role));
      } else {
        if (mounted) setRoles([]);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");

  return { session, user, roles, isAdmin, isSuperAdmin, loading };
};
