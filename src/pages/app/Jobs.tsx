import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

type Job = {
  id: string;
  title: string;
  department: string | null;
  status: string;
  due_date: string | null;
  description?: string | null;
  created_at: string;
};

const STATUS_OPTIONS = ["all", "open", "paused", "closed"] as const;

const jobSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["open", "paused", "closed"]),
  due_date: z.string().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
});

export default function Jobs() {
  const { workspaceId } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  async function load() {
    if (!workspaceId) return;
    const { data } = await supabase
      .from("jobs")
      .select("id, title, department, status, due_date, description, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    const rows = (data as Job[]) ?? [];
    setJobs(rows);

    const ids = rows.map((j) => j.id);
    if (ids.length) {
      const { data: apps } = await supabase
        .from("applications")
        .select("job_id")
        .in("job_id", ids);
      const c: Record<string, number> = {};
      ((apps as { job_id: string }[]) ?? []).forEach((a) => {
        c[a.job_id] = (c[a.job_id] ?? 0) + 1;
      });
      setCounts(c);
    } else {
      setCounts({});
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    (jobs ?? []).forEach((j) => j.department && s.add(j.department));
    return Array.from(s);
  }, [jobs]);

  const filtered = useMemo(() => {
    return (jobs ?? []).filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (departmentFilter !== "all" && j.department !== departmentFilter) return false;
      return true;
    });
  }, [jobs, statusFilter, departmentFilter]);

  async function confirmDelete() {
    if (!deleting) return;
    const job = deleting;
    setDeleting(null);
    // optimistic
    setJobs((prev) => (prev ?? []).filter((j) => j.id !== job.id));
    const { error } = await supabase.from("jobs").delete().eq("id", job.id);
    if (error) {
      toast.error(error.message);
      void load();
      return;
    }
    toast.success("Job deleted");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text)" }}>Jobs</h1>
          <div style={{ fontSize: 13, color: "color-mix(in oklab, var(--color-text) 60%, transparent)" }}>
            {jobs ? `${jobs.length} total` : "Loading..."}
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-surface)",
              }}
            >
              Create New Job
            </Button>
          </DialogTrigger>
          <JobFormDialog
            mode="create"
            workspaceId={workspaceId}
            onDone={() => {
              setCreateOpen(false);
              void load();
            }}
          />
        </Dialog>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 160 }}>
          <Label style={labelStyle}>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div style={{ minWidth: 200 }}>
          <Label style={labelStyle}>Department</Label>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid color-mix(in oklab, var(--color-text) 8%, transparent)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {jobs === null ? (
          <div style={{ padding: 24, color: "color-mix(in oklab, var(--color-text) 60%, transparent)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, color: "color-mix(in oklab, var(--color-text) 60%, transparent)" }}>
            No jobs match the current filters.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, color: "var(--color-text)" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid color-mix(in oklab, var(--color-text) 8%, transparent)" }}>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Applicants</th>
                <th style={thStyle}>Due date</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid color-mix(in oklab, var(--color-text) 6%, transparent)" }}>
                  <td style={tdStyle}>
                    <Link to={`/app/jobs/${j.id}/pipeline`} style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                      {j.title}
                    </Link>
                  </td>
                  <td style={tdStyle}>{j.department || "—"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        backgroundColor: "color-mix(in oklab, var(--color-primary) 12%, transparent)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td style={tdStyle}>{counts[j.id] ?? 0}</td>
                  <td style={tdStyle}>{j.due_date ? new Date(j.due_date).toLocaleDateString() : "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <Button size="sm" variant="outline" onClick={() => setEditing(j)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleting(j)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        {editing && (
          <JobFormDialog
            mode="edit"
            workspaceId={workspaceId}
            initial={editing}
            onDone={() => {
              setEditing(null);
              void load();
            }}
          />
        )}
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{deleting?.title}</strong> along with its applications,
              interviews and offers. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".04em",
  color: "color-mix(in oklab, var(--color-text) 60%, transparent)",
};
const tdStyle: React.CSSProperties = { padding: "12px 16px" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "color-mix(in oklab, var(--color-text) 60%, transparent)", marginBottom: 4, display: "block" };

function JobFormDialog({
  mode,
  workspaceId,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  workspaceId: string | null;
  initial?: Job;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [status, setStatus] = useState(initial?.status ?? "open");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    const parsed = jobSchema.safeParse({ title, department, status, due_date: dueDate, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      department: parsed.data.department || null,
      status: parsed.data.status,
      due_date: parsed.data.due_date || null,
      description: parsed.data.description || null,
    };
    const { error } =
      mode === "create"
        ? await supabase.from("jobs").insert({ ...payload, workspace_id: workspaceId })
        : await supabase.from("jobs").update(payload).eq("id", initial!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "create" ? "Job created" : "Job updated");
    onDone();
  }

  return (
    <DialogContent>
      <form onSubmit={submit}>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Job" : "Edit Job"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new position to your workspace." : "Update this job's details."}
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department ?? ""} onChange={(e) => setDepartment(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">open</SelectItem>
                  <SelectItem value="paused">paused</SelectItem>
                  <SelectItem value="closed">closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="due">Due date</Label>
            <Input id="due" type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} />
          </div>
        </div>
        <DialogFooter style={{ marginTop: 20 }}>
          <Button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-surface)" }}
          >
            {saving ? "Saving..." : mode === "create" ? "Create Job" : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
