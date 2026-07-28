import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

type Member = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

export default function Members() {
  const { workspaceId, user } = useAuth();
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    void supabase
      .from("users")
      .select("id,email,full_name,role,created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setRows((data as Member[]) ?? []);
        setLoading(false);
      });
  }, [workspaceId]);

  return (
    <div style={{ color: "var(--color-text)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Members</h1>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 24 }}>
        People with access to this workspace.
      </p>

      {loading ? (
        <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading…</div>
      ) : (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {rows.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {m.full_name || m.email}
                  {m.id === user?.id && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "var(--color-muted)", fontWeight: 400 }}>(you)</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>{m.email}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "color-mix(in oklab, var(--color-primary) 15%, transparent)",
                  color: "var(--color-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
