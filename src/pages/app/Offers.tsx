import { useEffect, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
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

type Row = {
  id: string;
  salary: number | null;
  currency: string;
  status: string;
  expires_at: string | null;
  application_id: string;
  applications: {
    candidates: { full_name: string } | null;
    jobs: { title: string } | null;
  } | null;
};

type AppOption = { id: string; label: string };

export default function Offers() {
  const { workspaceId } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({
    application_id: "",
    salary: "",
    currency: "USD",
    status: "pending",
    expires_at: "",
  });

  async function load() {
    if (!workspaceId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("offers")
      .select(
        "id,salary,currency,status,expires_at,application_id,applications(candidates(full_name),jobs(title))"
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
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
    if (!workspaceId || !form.application_id) {
      toast.error("Application is required");
      return;
    }
    const { error } = await supabase.from("offers").insert({
      workspace_id: workspaceId,
      application_id: form.application_id,
      salary: form.salary ? Number(form.salary) : null,
      currency: form.currency,
      status: form.status,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Offer created");
    setOpen(false);
    setForm({ application_id: "", salary: "", currency: "USD", status: "pending", expires_at: "" });
    void load();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("offers").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Offer deleted");
  }

  const CreateDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="vf-btn-primary">
          <Plus size={16} className="mr-1" /> Create New Offer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Offer</DialogTitle>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Salary</Label>
              <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Expires</Label>
            <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="vf-btn-primary" onClick={create}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) return <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading offers…</div>;

  if (rows.length === 0) {
    return (
      <div style={{ minHeight: "calc(100vh - 160px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 20%, transparent), color-mix(in oklab, var(--color-accent) 20%, transparent))",
              border: "1px solid color-mix(in oklab, var(--color-primary) 30%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            <FileText size={26} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            No active offers found
          </h2>
          <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.55, color: "var(--color-muted)" }}>
            Offers you extend to candidates will appear here.
          </p>
          <div style={{ marginTop: 24 }}>{CreateDialog}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: "var(--color-text)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Offers</h1>
          <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>{rows.length} total</p>
        </div>
        {CreateDialog}
      </div>

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
                {r.salary ? `${r.currency} ${r.salary.toLocaleString()}` : "No salary set"}
                {r.expires_at ? ` · expires ${new Date(r.expires_at).toLocaleDateString()}` : ""}
              </div>
            </div>
            <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
              <SelectTrigger style={{ width: 140 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => setDelId(r.id)}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete offer?</AlertDialogTitle>
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
