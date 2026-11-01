"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-900/80 flex items-center justify-center text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 ${className}`}
        aria-hidden="true"
      >
        <Moon size={16} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-900/80 text-stone-800 dark:text-stone-200 hover:text-[#163422] dark:hover:text-[#E6C98B] hover:bg-stone-200 dark:hover:bg-stone-800 transition-all shadow-xs border border-stone-200 dark:border-stone-800 flex items-center justify-center cursor-pointer active:scale-95 ${className}`}
      title={isDark ? "Cambiar a Modo Claro ☀️" : "Cambiar a Modo Oscuro 🌙"}
      aria-label={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
    >
      {isDark ? (
        <Sun size={17} className="text-[#E6C98B] animate-in spin-in-90 duration-300" />
      ) : (
        <Moon size={17} className="text-stone-800 animate-in spin-in-90 duration-300" />
      )}
    </button>
  );
}
