import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ThemeRow = {
  id?: string;
  primary_color: string;
  accent_color: string;
  bg_color: string;
  surface_color: string;
  text_color: string;
  font_family: string;
};

const DEFAULTS: ThemeRow = {
  primary_color: "#6366f1",
  accent_color: "#8b5cf6",
  bg_color: "#0f1117",
  surface_color: "#1a1d27",
  text_color: "#f1f5f9",
  font_family: "Inter",
};

export default function Theme() {
  const { workspaceId, user } = useAuth();
  const [theme, setTheme] = useState<ThemeRow>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isOwnerAdmin = user?.role === "owner" || user?.role === "admin";

  useEffect(() => {
    if (!workspaceId) return;
    void supabase
      .from("workspace_themes")
      .select("id,primary_color,accent_color,bg_color,surface_color,text_color,font_family")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTheme(data as ThemeRow);
        setLoading(false);
      });
  }, [workspaceId]);

  async function save() {
    if (!workspaceId) return;
    setSaving(true);
    const payload = { ...theme, workspace_id: workspaceId, is_active: true };
    const { error } = theme.id
      ? await supabase.from("workspace_themes").update(payload).eq("id", theme.id)
      : await supabase.from("workspace_themes").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Theme saved. Refresh to apply everywhere.");
  }

  const fields: Array<{ key: keyof ThemeRow; label: string; type: "color" | "text" }> = [
    { key: "primary_color", label: "Primary", type: "color" },
    { key: "accent_color", label: "Accent", type: "color" },
    { key: "bg_color", label: "Background", type: "color" },
    { key: "surface_color", label: "Surface", type: "color" },
    { key: "text_color", label: "Text", type: "color" },
    { key: "font_family", label: "Font family", type: "text" },
  ];

  if (loading) return <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 720, color: "var(--color-text)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Theme</h1>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 24 }}>
        Customize your workspace branding.
      </p>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          padding: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {fields.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {f.type === "color" && (
                <input
                  type="color"
                  value={theme[f.key] as string}
                  onChange={(e) => setTheme({ ...theme, [f.key]: e.target.value })}
                  disabled={!isOwnerAdmin}
                  style={{ width: 40, height: 36, border: "1px solid var(--color-border)", borderRadius: 6, background: "transparent" }}
                />
              )}
              <Input
                value={theme[f.key] as string}
                onChange={(e) => setTheme({ ...theme, [f.key]: e.target.value })}
                disabled={!isOwnerAdmin}
              />
            </div>
          </div>
        ))}
        {isOwnerAdmin && (
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <Button className="vf-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save theme"}
            </Button>
            <Button variant="ghost" onClick={() => setTheme({ ...DEFAULTS, id: theme.id })}>
              Reset to defaults
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
