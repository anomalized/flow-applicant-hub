import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "9999px",
            border: "3px solid color-mix(in oklab, var(--color-primary) 25%, transparent)",
            borderTopColor: "var(--color-primary)",
            animation: "vf-spin 0.9s linear infinite",
          }}
        />
        <style>{`@keyframes vf-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
