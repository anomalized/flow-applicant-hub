import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { SharedStyles } from "./Login";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/app/dashboard`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      const user = signUpData.user;
      if (!user) throw new Error("Sign up did not return a user.");

      const baseSlug = slugify(workspaceName) || `workspace-${Date.now()}`;
      const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: ws, error: wsError } = await supabase
        .from("workspaces")
        .insert({ name: workspaceName, slug, owner_id: user.id })
        .select("id")
        .single();
      if (wsError) throw wsError;

      const { error: userError } = await supabase.from("users").insert({
        id: user.id,
        workspace_id: ws.id,
        email,
        full_name: fullName,
        role: "admin",
      });
      if (userError) throw userError;

      localStorage.setItem("workspace_id", ws.id);
      navigate("/app/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center px-4 py-10"
      style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", fontFamily: "var(--font-base)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border p-8"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "color-mix(in oklab, var(--color-text) 12%, transparent)",
        }}
      >
        <h1 className="text-center text-3xl font-semibold tracking-tight" style={{ color: "var(--color-primary)" }}>
          Velocity &amp; Flow
        </h1>
        <p
          className="mt-2 text-center text-sm"
          style={{ color: "color-mix(in oklab, var(--color-text) 70%, transparent)" }}
        >
          Create your workspace
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label="Full Name">
            <input className="vf-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Workspace Name">
            <input
              className="vf-input"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className="vf-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              className="vf-input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm Password">
            <input
              className="vf-input"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13 }} role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="vf-btn-primary w-full">
            {submitting ? "Creating workspace..." : "Create Account"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "color-mix(in oklab, var(--color-text) 70%, transparent)" }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
            Sign In
          </Link>
        </p>
      </div>
      <SharedStyles />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
        style={{ color: "color-mix(in oklab, var(--color-text) 70%, transparent)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
