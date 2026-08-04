/**
 * Shared light/dark application for public pages (market, login, callback, landing).
 * Keeps documentElement.dark in sync with:
 *   - localStorage "pcln-market-theme" (system | light | dark)
 *   - pinia globalStore.isDark (admin / console)
 */

import useGlobalStore from "@/stores/modules/global";

export type PublicThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "pcln-market-theme";

export function readPublicThemeMode(): PublicThemeMode {
  const raw = localStorage.getItem(STORAGE_KEY) as PublicThemeMode | null;
  if (raw === "system" || raw === "light" || raw === "dark") return raw;
  return "system";
}

export function writePublicThemeMode(mode: PublicThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function resolveIsDark(mode: PublicThemeMode = readPublicThemeMode()): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply dark class + color-scheme and mirror into global store. */
export function applyPublicTheme(mode?: PublicThemeMode): boolean {
  const resolved = mode ?? readPublicThemeMode();
  const dark = resolveIsDark(resolved);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  try {
    const globalStore = useGlobalStore();
    if (globalStore.isDark !== dark) {
      globalStore.setGlobalState("isDark", dark);
    }
  } catch {
    // Pinia may not be ready in edge cases
  }
  return dark;
}

export function cyclePublicThemeMode(current: PublicThemeMode): PublicThemeMode {
  return current === "system" ? "light" : current === "light" ? "dark" : "system";
}
