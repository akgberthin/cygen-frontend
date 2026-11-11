import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "cygen-theme";
const CHOICES = ["system", "dark", "light"];

function resolve(choice) {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return choice;
}

function paint(choice) {
  const resolved = resolve(choice);
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#07090f" : "#f7f5f0");
}

function initialChoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CHOICES.includes(saved)) return saved;
  } catch (e) {
    /* private mode */
  }
  return "dark"; // dark is the brand default
}

export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(initialChoice);
  const resolved = resolve(choice);

  useEffect(() => {
    paint(choice);
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch (e) {
      /* private mode */
    }
    if (choice !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => paint("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const value = useMemo(() => ({ choice, setChoice, resolved }), [choice, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
