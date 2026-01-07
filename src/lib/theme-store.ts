"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => "light" | "dark";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === "system") {
          if (typeof window !== "undefined") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
          }
          return "light";
        }
        return theme;
      },
    }),
    {
      name: "menodao-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// Initialize theme on client side
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("menodao-theme");
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      applyTheme(parsed.state?.theme || "system");
    } catch {
      applyTheme("system");
    }
  }

  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const store = useThemeStore.getState();
      if (store.theme === "system") {
        applyTheme("system");
      }
    });
}
