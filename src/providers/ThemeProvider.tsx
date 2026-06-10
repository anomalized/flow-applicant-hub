import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type ThemeVars = {
  primary_color: string;
  accent_color: string;
  bg_color: string;
  surface_color: string;
  text_color: string;
  font_family: string;
};

const FALLBACK: ThemeVars = {
  primary_color: "#6366f1",
  accent_color: "#8b5cf6",
  bg_color: "#09090b",
  surface_color: "#18181b",
  text_color: "#fafafa",
  font_family: "Inter",
};

const FONT_URLS: Record<string, string> = {
  Inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  Manrope: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap",
  "DM Sans": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  Geist: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap",
  "IBM Plex Sans": "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
};

function loadFont(family: string) {
  const href = FONT_URLS[family];
  if (!href || typeof document === "undefined") return;
  if (document.head.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function inject(theme: ThemeVars) {
  const root = document.documentElement;
  loadFont(theme.font_family);
  root.style.setProperty("--color-primary", theme.primary_color);
  root.style.setProperty("--color-accent", theme.accent_color);
  root.style.setProperty("--color-bg", theme.bg_color);
  root.style.setProperty("--color-surface", theme.surface_color);
  root.style.setProperty("--color-surface-2", "#1f1f23");
  root.style.setProperty("--color-text", theme.text_color);
  root.style.setProperty("--color-muted", "#a1a1aa");
  root.style.setProperty("--color-border", "#27272a");
  root.style.setProperty("--color-border-strong", "#3f3f46");
  root.style.setProperty("--font-base", theme.font_family);
  document.body.style.backgroundColor = theme.bg_color;
  document.body.style.color = theme.text_color;
  document.body.style.fontFamily = `${theme.font_family}, system-ui, -apple-system, Segoe UI, sans-serif`;
}

type ThemeContextValue = { reloadTheme: () => Promise<void> };
const ThemeContext = createContext<ThemeContextValue>({ reloadTheme: async () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const reloadTheme = useCallback(async () => {
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("workspace_id") : null;
    if (!workspaceId) {
      inject(FALLBACK);
      return;
    }
    const { data } = await supabase
      .from("workspace_themes")
      .select("primary_color, accent_color, bg_color, surface_color, text_color, font_family")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    // Keep neutral dark surfaces; only allow brand color + font from DB.
    const db = data as Partial<ThemeVars> | null;
    inject({
      ...FALLBACK,
      primary_color: db?.primary_color || FALLBACK.primary_color,
      accent_color: db?.accent_color || FALLBACK.accent_color,
      font_family: db?.font_family || FALLBACK.font_family,
    });
  }, []);

  useEffect(() => {
    inject(FALLBACK);
    void reloadTheme();
  }, [reloadTheme]);

  return <ThemeContext.Provider value={{ reloadTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
