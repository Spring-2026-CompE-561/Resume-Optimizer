export type ThemePreference = "dark" | "light";

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "resumePilot.sidebarCollapsed";
export const THEME_STORAGE_KEY = "resumePilot.theme";

export function readSidebarCollapsedPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}

export function writeSidebarCollapsedPreference(collapsed: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
}

export function normalizeThemePreference(value: string | null): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function writeThemePreference(theme: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemePreference(theme);
}
