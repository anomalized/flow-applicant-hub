import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";


type Job = { id: string; title: string };
type AppRow = {
  id: string;
  stage: string;
  job_id: string;
  candidate_id: string;
  candidates: { full_name: string; email: string | null } | null;
  jobs: { title: string } | null;
};

const STAGES = ["applied", "screening", "interview", "offer", "rejected"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABEL: Record<Stage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default function Candidates() {
  const { workspaceId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [apps, setApps] = useState<AppRow[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newJobId, setNewJobId] = useState<string>("");
  const [newStage, setNewStage] = useState<Stage>("applied");

  const candidateSchema = z.object({
    full_name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    job_id: z.string().uuid("Select a job"),
    stage: z.enum(STAGES),
  });

  function resetForm() {
    setFullName(""); setEmail(""); setPhone(""); setNewJobId(""); setNewStage("applied");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    const parsed = candidateSchema.safeParse({
      full_name: fullName, email, phone, job_id: newJobId, stage: newStage,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { data: cand, error: candErr } = await supabase
      .from("candidates")
      .insert({
        workspace_id: workspaceId,
        full_name: parsed.data.full_name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
      })
      .select("id")
      .single();
    if (candErr || !cand) {
      setSubmitting(false);
      toast.error(candErr?.message ?? "Could not create candidate");
      return;
    }
    const { error: appErr } = await supabase.from("applications").insert({
      workspace_id: workspaceId,
      candidate_id: cand.id,
      job_id: parsed.data.job_id,
      stage: parsed.data.stage,
    });
    setSubmitting(false);
    if (appErr) {
      toast.error(appErr.message);
      return;
    }
    toast.success("Candidate added");
    setOpen(false);
    resetForm();
    void load();
  }


  async function load() {
    if (!workspaceId) return;
    const { data: jobRows } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    setJobs((jobRows as Job[]) ?? []);

    let q = supabase
      .from("applications")
      .select("id, stage, job_id, candidate_id, candidates:candidate_id(full_name, email), jobs:job_id(title)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (jobFilter !== "all") q = q.eq("job_id", jobFilter);
    const { data } = await q;
    setApps((data as unknown as AppRow[]) ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, jobFilter]);

  const grouped = useMemo(() => {
    const g: Record<Stage, AppRow[]> = {
      applied: [], screening: [], interview: [], offer: [], rejected: [],
    };
    (apps ?? []).forEach((a) => {
      const s = (STAGES as readonly string[]).includes(a.stage) ? (a.stage as Stage) : "applied";
      g[s].push(a);
    });
    return g;
  }, [apps]);

  async function moveTo(appId: string, newStage: Stage) {
    const current = apps?.find((a) => a.id === appId);
    if (!current || current.stage === newStage) return;
    // optimistic
    setApps((prev) =>
      (prev ?? []).map((a) => (a.id === appId ? { ...a, stage: newStage } : a)),
    );
    const { error } = await supabase
      .from("applications")
      .update({ stage: newStage })
      .eq("id", appId);
    if (error) {
      toast.error(error.message);
      // revert
      setApps((prev) =>
        (prev ?? []).map((a) => (a.id === appId ? { ...a, stage: current.stage } : a)),
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text)" }}>Candidates</h1>
          <div style={{ fontSize: 13, color: "color-mix(in oklab, var(--color-text) 60%, transparent)" }}>
            Drag candidates between stages to update their status.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ minWidth: 240 }}>
            <Label style={{ fontSize: 12, color: "color-mix(in oklab, var(--color-text) 60%, transparent)", marginBottom: 4, display: "block" }}>
              Filter by job
            </Label>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All open jobs</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button disabled={jobs.length === 0} title={jobs.length === 0 ? "Create a job first" : undefined}>
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Candidate</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Label htmlFor="cand-name">Full name</Label>
                  <Input id="cand-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} required />
                </div>
                <div>
                  <Label htmlFor="cand-email">Email</Label>
                  <Input id="cand-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="cand-phone">Phone</Label>
                  <Input id="cand-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
                </div>
                <div>
                  <Label>Job</Label>
                  <Select value={newJobId} onValueChange={setNewJobId}>
                    <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((j) => (
                        <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={newStage} onValueChange={(v) => setNewStage(v as Stage)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Candidate"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${STAGES.length}, minmax(220px, 1fr))`,
          gap: 12,
          overflowX: "auto",
        }}
      >
        {STAGES.map((stage) => {
          const items = grouped[stage];
          const isOver = overStage === stage;
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => {
                if (dragId) void moveTo(dragId, stage);
                setDragId(null);
                setOverStage(null);
              }}
              style={{
                backgroundColor: "var(--color-surface)",
                border: `1px solid ${isOver ? "var(--color-primary)" : "color-mix(in oklab, var(--color-text) 8%, transparent)"}`,
                borderRadius: 8,
                padding: 12,
                minHeight: 320,
                transition: "border-color .15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                  {STAGE_LABEL[stage]}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    padding: "1px 8px",
                    borderRadius: 999,
                    backgroundColor: "color-mix(in oklab, var(--color-primary) 12%, transparent)",
                    color: "var(--color-primary)",
                  }}
                >
                  {items.length}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {apps === null ? (
                  <div style={{ fontSize: 12, color: "color-mix(in oklab, var(--color-text) 50%, transparent)" }}>
                    Loading...
                  </div>
                ) : items.length === 0 ? (
                  <div style={{ fontSize: 12, color: "color-mix(in oklab, var(--color-text) 50%, transparent)", padding: "8px 0" }}>
                    No candidates
                  </div>
                ) : (
                  items.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      style={{
                        backgroundColor: "var(--color-bg)",
                        border: "1px solid color-mix(in oklab, var(--color-text) 8%, transparent)",
                        borderRadius: 6,
                        padding: 10,
                        cursor: "grab",
                        opacity: dragId === a.id ? 0.5 : 1,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
                        {a.candidates?.full_name ?? "Unknown"}
                      </div>
                      {a.candidates?.email && (
                        <div style={{ fontSize: 11, color: "color-mix(in oklab, var(--color-text) 55%, transparent)", marginTop: 2 }}>
                          {a.candidates.email}
                        </div>
                      )}
                      {jobFilter === "all" && a.jobs?.title && (
                        <div style={{ fontSize: 11, color: "color-mix(in oklab, var(--color-text) 55%, transparent)", marginTop: 4 }}>
                          {a.jobs.title}
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <Select value={a.stage} onValueChange={(v) => void moveTo(a.id, v as Stage)}>
                          <SelectTrigger style={{ height: 26, fontSize: 11 }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
