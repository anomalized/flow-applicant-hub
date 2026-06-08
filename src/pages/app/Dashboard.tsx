import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

type Kpis = { openRoles: number; applicants: number; interviews: number; offers: number };
type JobRow = { id: string; title: string; department: string | null; due_date: string | null; app_count: number };
type InterviewRow = {
  id: string;
  scheduled_at: string;
  type: string;
  candidate_name: string;
  job_title: string;
};
type OfferRow = {
  id: string;
  salary: number | null;
  currency: string;
  expires_at: string | null;
  candidate_name: string;
  job_title: string;
};
type ActivityRow = { id: string; action: string; created_at: string };

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday-first
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff).toISOString();
}
function endOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = 7 - ((day + 6) % 7) - 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, 23, 59, 59).toISOString();
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const { workspaceId } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [interviews, setInterviews] = useState<InterviewRow[] | null>(null);
  const [offers, setOffers] = useState<OfferRow[] | null>(null);
  const [activity, setActivity] = useState<ActivityRow[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const wsId: string = workspaceId;
    let cancelled = false;

    async function loadAll() {
      const monthStart = startOfMonth();
      const weekStart = startOfWeek();
      const weekEnd = endOfWeek();
      const nowIso = new Date().toISOString();

      const [openRolesRes, applicantsRes, interviewsCountRes, offersCountRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "open"),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .gte("created_at", monthStart),
        supabase
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .gte("scheduled_at", weekStart)
          .lte("scheduled_at", weekEnd),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", wsId)
          .eq("status", "pending"),
      ]);

      if (!cancelled) {
        setKpis({
          openRoles: openRolesRes.count ?? 0,
          applicants: applicantsRes.count ?? 0,
          interviews: interviewsCountRes.count ?? 0,
          offers: offersCountRes.count ?? 0,
        });
      }

      const { data: jobRows } = await supabase
        .from("jobs")
        .select("id, title, department, due_date")
        .eq("workspace_id", wsId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      const jobRowsWithCounts: JobRow[] = await Promise.all(
        (jobRows ?? []).map(async (j) => {
          const { count } = await supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("job_id", j.id);
          return { ...j, app_count: count ?? 0 } as JobRow;
        }),
      );
      if (!cancelled) setJobs(jobRowsWithCounts);

      const { data: upcoming } = await supabase
        .from("interviews")
        .select(
          "id, scheduled_at, type, applications:application_id(jobs:job_id(title), candidates:candidate_id(full_name))",
        )
        .eq("workspace_id", wsId)
        .eq("status", "scheduled")
        .gte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (!cancelled) {
        type RawInterview = {
          id: string;
          scheduled_at: string;
          type: string;
          applications: {
            jobs: { title: string } | null;
            candidates: { full_name: string } | null;
          } | null;
        };
        setInterviews(
          ((upcoming as unknown as RawInterview[]) ?? []).map((i) => ({
            id: i.id,
            scheduled_at: i.scheduled_at,
            type: i.type,
            candidate_name: i.applications?.candidates?.full_name ?? "—",
            job_title: i.applications?.jobs?.title ?? "—",
          })),
        );
      }

      const { data: offerRows } = await supabase
        .from("offers")
        .select(
          "id, salary, currency, expires_at, applications:application_id(jobs:job_id(title), candidates:candidate_id(full_name))",
        )
        .eq("workspace_id", wsId)
        .eq("status", "pending")
        .order("expires_at", { ascending: true, nullsFirst: false })
        .limit(5);

      if (!cancelled) {
        type RawOffer = {
          id: string;
          salary: number | null;
          currency: string;
          expires_at: string | null;
          applications: {
            jobs: { title: string } | null;
            candidates: { full_name: string } | null;
          } | null;
        };
        setOffers(
          ((offerRows as unknown as RawOffer[]) ?? []).map((o) => ({
            id: o.id,
            salary: o.salary,
            currency: o.currency,
            expires_at: o.expires_at,
            candidate_name: o.applications?.candidates?.full_name ?? "—",
            job_title: o.applications?.jobs?.title ?? "—",
          })),
        );
      }

      const { data: act } = await supabase
        .from("activity_log")
        .select("id, action, created_at")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (!cancelled) setActivity((act as ActivityRow[]) ?? []);
    }

    void loadAll();

    const channel = supabase
      .channel(`activity-${wsId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `workspace_id=eq.${wsId}` },
        (payload) => {
          const row = payload.new as ActivityRow;
          setActivity((prev) => [row, ...(prev ?? [])].slice(0, 15));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <KpiRow kpis={kpis} />

      <div className="vf-grid-2">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Section title="Active Jobs">
            {jobs === null ? (
              <SkeletonList rows={3} />
            ) : jobs.length === 0 ? (
              <Empty label="No open jobs yet" />
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {jobs.map((j) => (
                  <li key={j.id}>
                    <button
                      onClick={() => navigate(`/app/jobs/${j.id}/pipeline`)}
                      className="vf-row-btn"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, color: "var(--color-text)" }}>{j.title}</div>
                        <div className="vf-muted-sm">{j.department || "—"}</div>
                      </div>
                      <div className="vf-muted-sm">{j.app_count} applicants</div>
                      {j.due_date && (
                        <div className="vf-muted-sm" style={{ marginLeft: 16 }}>
                          due {new Date(j.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Upcoming Interviews">
            {interviews === null ? (
              <SkeletonList rows={3} />
            ) : interviews.length === 0 ? (
              <Empty label="No interviews scheduled" />
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {interviews.map((i) => (
                  <li key={i.id} className="vf-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>{i.candidate_name}</div>
                      <div className="vf-muted-sm">
                        {i.job_title} · {i.type}
                      </div>
                    </div>
                    <div className="vf-muted-sm">{formatDateTime(i.scheduled_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Section title="Recent Activity">
            {activity === null ? (
              <SkeletonList rows={5} />
            ) : activity.length === 0 ? (
              <Empty label="No activity yet" />
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activity.map((a) => (
                  <li key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: "var(--color-text)", fontSize: 14 }}>{a.action}</span>
                    <span className="vf-muted-sm" style={{ whiteSpace: "nowrap" }}>
                      {relativeTime(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Pending Offers">
            {offers === null ? (
              <SkeletonList rows={3} />
            ) : offers.length === 0 ? (
              <Empty label="No pending offers" />
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {offers.map((o) => (
                  <li key={o.id} className="vf-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>{o.candidate_name}</div>
                      <div className="vf-muted-sm">{o.job_title}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 500 }}>
                        {o.salary != null
                          ? `${o.currency} ${Number(o.salary).toLocaleString()}`
                          : "—"}
                      </div>
                      {o.expires_at && (
                        <div className="vf-muted-sm">
                          expires {new Date(o.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <DashboardStyles />
    </div>
  );
}

function KpiRow({ kpis }: { kpis: Kpis | null }) {
  const items: Array<{ label: string; value: number | null }> = [
    { label: "Open Roles", value: kpis?.openRoles ?? null },
    { label: "Applicants This Month", value: kpis?.applicants ?? null },
    { label: "Interviews This Week", value: kpis?.interviews ?? null },
    { label: "Pending Offers", value: kpis?.offers ?? null },
  ];
  return (
    <div className="vf-grid-4">
      {items.map((k) => (
        <div key={k.label} className="vf-card">
          <div className="vf-muted-sm" style={{ textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 }}>
            {k.label}
          </div>
          <div style={{ marginTop: 8, fontSize: 32, fontWeight: 600, color: "var(--color-primary)" }}>
            {k.value === null ? <SkeletonBlock w={48} h={32} /> : k.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="vf-card">
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "var(--color-text)" }}>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="vf-muted-sm" style={{ padding: "12px 0" }}>
      {label}
    </div>
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} h={36} />
      ))}
    </div>
  );
}

function SkeletonBlock({ w, h }: { w?: number; h: number }) {
  return (
    <div
      style={{
        width: w ?? "100%",
        height: h,
        borderRadius: 6,
        backgroundColor: "color-mix(in oklab, var(--color-text) 10%, transparent)",
        animation: "vf-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function DashboardStyles() {
  return (
    <style>{`
      .vf-card {
        background-color: var(--color-surface);
        border: 1px solid color-mix(in oklab, var(--color-text) 8%, transparent);
        border-radius: 8px;
        padding: 20px;
      }
      .vf-grid-4 {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }
      .vf-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }
      @media (max-width: 1024px) {
        .vf-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .vf-grid-2 { grid-template-columns: 1fr; }
      }
      @media (max-width: 540px) {
        .vf-grid-4 { grid-template-columns: 1fr; }
      }
      .vf-muted-sm {
        color: color-mix(in oklab, var(--color-text) 60%, transparent);
        font-size: 12px;
      }
      .vf-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid color-mix(in oklab, var(--color-text) 6%, transparent);
        font-size: 14px;
      }
      .vf-row:last-child { border-bottom: none; }
      .vf-row-btn {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 8px;
        border-radius: 6px;
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
        border-bottom: 1px solid color-mix(in oklab, var(--color-text) 6%, transparent);
      }
      .vf-row-btn:hover { background-color: color-mix(in oklab, var(--color-primary) 6%, transparent); }
      @keyframes vf-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .5 } }
    `}</style>
  );
}
