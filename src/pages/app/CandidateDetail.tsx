import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

type Candidate = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type Application = {
  id: string;
  stage: string;
  created_at: string;
  jobs: { id: string; title: string; department: string | null } | null;
};

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspaceId } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !workspaceId) return;
    let active = true;
    (async () => {
      const [c, a] = await Promise.all([
        supabase.from("candidates").select("id,full_name,email,phone,created_at").eq("id", id).maybeSingle(),
        supabase
          .from("applications")
          .select("id,stage,created_at,jobs(id,title,department)")
          .eq("candidate_id", id)
          .eq("workspace_id", workspaceId),
      ]);
      if (!active) return;
      setCandidate((c.data as Candidate | null) ?? null);
      setApps(((a.data as unknown as Application[]) ?? []));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, workspaceId]);

  if (loading) return <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading…</div>;
  if (!candidate) return <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Candidate not found.</div>;

  return (
    <div style={{ color: "var(--color-text)", maxWidth: 820 }}>
      <Link
        to="/app/candidates"
        style={{ color: "var(--color-muted)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Back to candidates
      </Link>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 12 }}>
          {candidate.full_name}
        </h1>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--color-muted)" }}>
          {candidate.email && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} /> {candidate.email}
            </span>
          )}
          {candidate.phone && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Phone size={14} /> {candidate.phone}
            </span>
          )}
          <span>Added {new Date(candidate.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        Applications ({apps.length})
      </h2>
      {apps.length === 0 ? (
        <div style={{ color: "var(--color-muted)", fontSize: 13 }}>Not applied to any job yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {apps.map((a) => (
            <div
              key={a.id}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.jobs?.title ?? "Unknown role"}</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                  {a.jobs?.department ?? "—"} · Applied {new Date(a.created_at).toLocaleDateString()}
                </div>
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
                {a.stage}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
