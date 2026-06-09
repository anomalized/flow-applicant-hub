import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/app/dashboard");
  }

  return (
    <div
      className="flex items-center justify-center px-4"
      style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", fontFamily: "var(--font-base)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border p-8"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "color-mix(in oklab, var(--color-text) 12%, transparent)",
        }}
      >
        <h1
          className="text-center text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-primary)" }}
        >
          Velocity &amp; Flow
        </h1>
        <p
          className="mt-2 text-center text-sm"
          style={{ color: "color-mix(in oklab, var(--color-text) 70%, transparent)" }}
        >
          Sign in to your workspace
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="vf-input"
            />
          </Field>

          <Field label="Password">
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vf-input"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="vf-icon-btn"
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13 }} role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="vf-btn-primary w-full">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "color-mix(in oklab, var(--color-text) 70%, transparent)" }}
        >
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
            Register
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

export function SharedStyles() {
  return (
    <style>{`
      .vf-input {
        width: 100%;
        padding: 9px 12px;
        border-radius: 8px;
        background-color: color-mix(in oklab, var(--color-surface) 70%, var(--color-bg));
        border: 1px solid var(--color-border);
        color: var(--color-text);
        font-family: var(--font-base);
        font-size: 13.5px;
        outline: none;
        transition: border-color .15s, box-shadow .15s, background-color .15s;
      }
      .vf-input::placeholder { color: var(--color-muted); }
      .vf-input:hover { border-color: var(--color-border-strong); }
      .vf-input:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 25%, transparent);
      }
      .vf-btn-primary {
        padding: 10px 14px;
        border-radius: 6px;
        background-color: var(--color-primary);
        color: #ffffff;
        font-weight: 500;
        font-size: 14px;
        border: none;
        cursor: pointer;
        transition: filter .15s, box-shadow .15s;
      }
      .vf-btn-primary:hover { filter: brightness(1.08); }
      .vf-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
      .vf-btn-primary:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 40%, transparent);
      }
      .vf-btn-secondary {
        padding: 10px 14px;
        border-radius: 6px;
        background-color: var(--color-surface);
        color: var(--color-text);
        border: 1px solid color-mix(in oklab, var(--color-text) 20%, transparent);
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
      }
      .vf-icon-btn {
        background: transparent;
        border: none;
        color: color-mix(in oklab, var(--color-text) 70%, transparent);
        padding: 6px;
        border-radius: 4px;
        cursor: pointer;
      }
      .vf-icon-btn:hover { color: var(--color-text); }
      a:focus-visible, button:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-radius: 4px;
      }
    `}</style>
  );
}
