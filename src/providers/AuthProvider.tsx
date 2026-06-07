import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AppUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  workspace_id: string;
};

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  workspaceId: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  workspaceId: null,
  loading: true,
});

async function loadAppUser(userId: string): Promise<AppUser | null> {
  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, role, workspace_id")
    .eq("id", userId)
    .maybeSingle();
  return (data as AppUser | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("workspace_id") : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        // Defer profile fetch out of the auth callback to avoid deadlocks.
        setTimeout(async () => {
          const appUser = await loadAppUser(newSession.user.id);
          if (!mounted) return;
          setUser(appUser);
          if (appUser?.workspace_id) {
            localStorage.setItem("workspace_id", appUser.workspace_id);
            setWorkspaceId(appUser.workspace_id);
          }
        }, 0);
      } else {
        setUser(null);
        setWorkspaceId(null);
        localStorage.removeItem("workspace_id");
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const appUser = await loadAppUser(data.session.user.id);
        if (!mounted) return;
        setUser(appUser);
        if (appUser?.workspace_id) {
          localStorage.setItem("workspace_id", appUser.workspace_id);
          setWorkspaceId(appUser.workspace_id);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, workspaceId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
