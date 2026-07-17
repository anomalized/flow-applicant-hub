import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";

type Row = {
  id: string;
  scheduled_at: string;
  type: string;
  status: string;
  application_id: string;
  applications: {
    candidates: { full_name: string } | null;
    jobs: { title: string } | null;
  } | null;
};

type AppOption = {
  id: string;
  label: string;
};

export default function Interviews() {
  const { workspaceId } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const [form, setForm] = useState({
    application_id: "",
    scheduled_at: "",
    type: "video",
    status: "scheduled",
  });

  async function load() {
    if (!workspaceId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("interviews")
      .select(
        "id,scheduled_at,type,status,application_id,applications(candidates(full_name),jobs(title))"
      )
      .eq("workspace_id", workspaceId)
      .order("scheduled_at", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }

  async function loadApps() {
    if (!workspaceId) return;
    const { data } = await supabase
      .from("applications")
      .select("id,candidates(full_name),jobs(title)")
      .eq("workspace_id", workspaceId);
    setApps(
      ((data as unknown as Array<{
        id: string;
        candidates: { full_name: string } | null;
        jobs: { title: string } | null;
      }>) ?? []).map((a) => ({
        id: a.id,
        label: `${a.candidates?.full_name ?? "?"} — ${a.jobs?.title ?? "?"}`,
      }))
    );
  }

  useEffect(() => {
    void load();
    void loadApps();
     
  }, [workspaceId]);

  async function create() {
    if (!workspaceId || !form.application_id || !form.scheduled_at) {
      toast.error("Application and date/time are required");
      return;
    }
    const { error } = await supabase.from("interviews").insert({
      workspace_id: workspaceId,
      application_id: form.application_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      type: form.type,
      status: form.status,
    });
    if (error) return toast.error(error.message);
    toast.success("Interview scheduled");
    setOpen(false);
    setForm({ application_id: "", scheduled_at: "", type: "video", status: "scheduled" });
    void load();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("interviews").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("interviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Interview deleted");
  }

  return (
    <div style={{ color: "var(--color-text)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Interviews</h1>
          <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
            {rows.length} scheduled
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="vf-btn-primary">
              <Plus size={16} className="mr-1" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Application</Label>
                <Select value={form.application_id} onValueChange={(v) => setForm({ ...form, application_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select candidate/job" /></SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="vf-btn-primary" onClick={create}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            borderRadius: 14,
            padding: 40,
            textAlign: "center",
          }}
        >
          <Calendar size={28} style={{ margin: "0 auto 12px", color: "var(--color-primary)" }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No interviews scheduled</div>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 6 }}>
            Schedule an interview to see it here.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {r.applications?.candidates?.full_name ?? "Unknown"}{" "}
                  <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>
                    · {r.applications?.jobs?.title ?? "?"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                  {new Date(r.scheduled_at).toLocaleString()} · {r.type}
                </div>
              </div>
              <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                <SelectTrigger style={{ width: 140 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setDelId(r.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interview?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (delId) void remove(delId);
                setDelId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
