import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { SharedStyles } from "@/pages/Login";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/jobs", label: "Jobs", icon: Briefcase },
  { to: "/app/candidates", label: "Candidates", icon: Users },
  { to: "/app/interviews", label: "Interviews", icon: Calendar },
  { to: "/app/offers", label: "Offers", icon: FileText },
  { to: "/app/settings/workspace", label: "Settings", icon: Settings },
];

function titleForPath(path: string): string {
  if (path.startsWith("/app/dashboard")) return "Dashboard";
  if (path.startsWith("/app/jobs/new")) return "New Job";
  if (path.includes("/pipeline")) return "Job Pipeline";
  if (path.includes("/candidates") && path.startsWith("/app/jobs/")) return "Job Candidates";
  if (path.startsWith("/app/jobs")) return "Jobs";
  if (path.startsWith("/app/candidates")) return "Candidates";
  if (path.startsWith("/app/interviews")) return "Interviews";
  if (path.startsWith("/app/offers")) return "Offers";
  if (path.startsWith("/app/settings/theme")) return "Theme";
  if (path.startsWith("/app/settings/pipeline")) return "Pipeline";
  if (path.startsWith("/app/settings/email-templates")) return "Email Templates";
  if (path.startsWith("/app/settings/members")) return "Members";
  if (path.startsWith("/app/settings")) return "Workspace Settings";
  return "Velocity & Flow";
}

function initials(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function AppShell() {
  const { user, workspaceId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    void supabase
      .from("workspaces")
      .select("name, logo_url")
      .eq("id", workspaceId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setWorkspace((data as { name: string; logo_url: string | null } | null) ?? null);
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const Sidebar = (
    <aside
      style={{
        width: 248,
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <Link to="/app/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          {workspace?.logo_url ? (
            <img
              src={workspace.logo_url}
              alt={workspace.name}
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 13,
                boxShadow: "0 4px 12px -4px color-mix(in oklab, var(--color-primary) 60%, transparent)",
              }}
            >
              {initials(workspace?.name || "VF")}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--color-text)", fontWeight: 600, fontSize: 14, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {workspace?.name || "Workspace"}
            </div>
            <div
              style={{
                color: "var(--color-muted)",
                fontSize: 11,
                marginTop: 3,
                fontWeight: 500,
              }}
            >
              Velocity &amp; Flow
            </div>
          </div>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app/dashboard"}
            className="vf-nav-link"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "9px 12px",
              paddingLeft: 14,
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 13.5,
              fontWeight: 500,
              position: "relative",
              color: isActive ? "#ffffff" : "var(--color-muted)",
              backgroundColor: isActive
                ? "color-mix(in oklab, var(--color-primary) 14%, transparent)"
                : "transparent",
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 2,
                      borderRadius: 2,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                )}
                <item.icon size={16} strokeWidth={isActive ? 2.25 : 2} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {initials(user?.full_name || user?.email || "VF")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "var(--color-text)",
              fontSize: 13,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.full_name || user?.email || "—"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="vf-icon-btn"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );

  const sidebarVisibleDesktop = `@media (max-width: 767px) { .vf-sidebar-desktop { display: none !important; } .vf-main { margin-left: 0 !important; } .vf-main-header { left: 0 !important; } .vf-mobile-trigger { display: inline-flex !important; } }
                                 @media (min-width: 768px) { .vf-mobile-trigger { display: none !important; } .vf-mobile-overlay { display: none !important; } }
                                 .vf-nav-link:hover { color: var(--color-text) !important; background-color: color-mix(in oklab, var(--color-text) 5%, transparent) !important; }`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", fontFamily: "var(--font-base)", color: "var(--color-text)" }}>
      <div className="vf-sidebar-desktop">{Sidebar}</div>

      {mobileOpen && (
        <div
          className="vf-mobile-overlay"
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,.5)", zIndex: 50 }}
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{Sidebar}</div>
        </div>
      )}

      <header
        className="vf-main"
        style={{
          position: "fixed",
          top: 0,
          left: 240,
          right: 0,
          height: 56,
          backgroundColor: "var(--color-bg)",
          borderBottom: "1px solid color-mix(in oklab, var(--color-text) 8%, transparent)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          zIndex: 30,
        }}
      >
        <button
          className="vf-icon-btn vf-mobile-trigger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{ display: "none" }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>
          {titleForPath(location.pathname)}
        </h1>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 380 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "color-mix(in oklab, var(--color-text) 50%, transparent)",
              }}
            />
            <input className="vf-input" placeholder="Search..." style={{ paddingLeft: 32, height: 34 }} />
          </div>
        </div>
        <button className="vf-icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </header>

      <main
        className="vf-main"
        style={{ marginLeft: 240, paddingTop: 56, minHeight: "100vh", backgroundColor: "var(--color-bg)" }}
      >
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>

      <SharedStyles />
      <style>{sidebarVisibleDesktop}</style>
    </div>
  );
}
