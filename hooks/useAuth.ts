"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "super_admin" | "admin" | "user";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchCountRef = useRef(0);

  useEffect(() => {
    let effectActive = true;

    const fetchRoles = async (userId: string, fetchId: number) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (!effectActive || fetchId !== fetchCountRef.current) return;

        if (error) {
          console.error("Failed to fetch roles:", error);
          setRoles([]);
        } else {
          setRoles((data ?? []).map((r: any) => r.role as Role));
        }
      } catch (err) {
        if (!effectActive || fetchId !== fetchCountRef.current) return;
        console.error("Unexpected error fetching roles:", err);
        setRoles([]);
      }
    };

    const applySession = async (nextSession: Session | null) => {
      if (!effectActive) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        const fetchId = ++fetchCountRef.current;
        await fetchRoles(nextSession.user.id, fetchId);
      } else {
        setRoles([]);
      }

      if (effectActive) setLoading(false);
    };

    const initAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) console.error("Failed to get session:", error);
        await applySession(initialSession ?? null);
      } catch (err) {
        console.error("Unexpected error during auth init:", err);
        if (effectActive) setLoading(false);
      }
    };

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!effectActive || event === "INITIAL_SESSION") return;
      void applySession(newSession ?? null);
    });

    return () => {
      effectActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");

  return { session, user, roles, isAdmin, isSuperAdmin, loading };
};
