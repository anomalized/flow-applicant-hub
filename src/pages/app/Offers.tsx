import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export default function Offers() {
  const { workspaceId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    void supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .then(({ count }) => {
        if (!active) return;
        setCount(count ?? 0);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  if (loading) {
    return <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading offers…</div>;
  }

  if (count === 0) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 20%, transparent), color-mix(in oklab, var(--color-accent) 20%, transparent))",
              border: "1px solid color-mix(in oklab, var(--color-primary) 30%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            <FileText size={26} />
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--color-text)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            No active offers found
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "var(--color-muted)",
            }}
          >
            Offers you extend to candidates will appear here. Create your first offer to start
            tracking acceptance, declines, and start dates.
          </p>
          <button
            type="button"
            className="vf-btn-primary"
            style={{
              marginTop: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 8,
            }}
          >
            <Plus size={16} />
            Create New Offer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: "var(--color-text)", fontFamily: "var(--font-base)" }}>
      {/* Offers list coming soon */}
      <p style={{ color: "var(--color-muted)", fontSize: 14 }}>{count} offers</p>
    </div>
  );
}
