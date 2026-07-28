import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Workspace() {
  const { workspaceId, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "" });
  const isOwnerAdmin = user?.role === "owner" || user?.role === "admin";

  useEffect(() => {
    if (!workspaceId) return;
    void supabase
      .from("workspaces")
      .select("name,slug,logo_url")
      .eq("id", workspaceId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm({ name: data.name ?? "", slug: data.slug ?? "", logo_url: data.logo_url ?? "" });
        setLoading(false);
      });
  }, [workspaceId]);

  async function save() {
    if (!workspaceId) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: form.name, slug: form.slug, logo_url: form.logo_url || null })
      .eq("id", workspaceId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Workspace updated");
  }

  if (loading) return <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 640, color: "var(--color-text)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>Workspace</h1>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 24 }}>
        Public identity of your workspace.
      </p>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isOwnerAdmin} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!isOwnerAdmin} />
          <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 6 }}>
            Public job board: /jobs/{form.slug || "your-slug"}
          </p>
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} disabled={!isOwnerAdmin} />
        </div>
        {isOwnerAdmin && (
          <div>
            <Button className="vf-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
