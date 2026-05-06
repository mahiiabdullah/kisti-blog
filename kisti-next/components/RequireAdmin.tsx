"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="p-12 text-center text-muted-foreground">…</div>;
  if (!user) {
    router.push("/auth");
    return null;
  }
  if (!isAdmin) {
    router.push("/");
    return null;
  }
  return <>{children}</>;
};
