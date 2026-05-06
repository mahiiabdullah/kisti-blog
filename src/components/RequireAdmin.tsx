import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-muted-foreground">…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};
