"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-900/80 flex items-center justify-center text-gray-400">
        <Sun size={16} />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 rounded-full bg-stone-100 dark:bg-stone-900/80 text-stone-800 dark:text-stone-200 hover:text-[#163422] dark:hover:text-[#E6C98B] transition-all shadow-sm border border-stone-200 dark:border-stone-800 flex items-center justify-center cursor-pointer"
      title={isDark ? "Cambiar a Modo Claro ☀️" : "Cambiar a Modo Oscuro 🌙"}
      aria-label="Alternar tema claro/oscuro"
    >
      {isDark ? (
        <Sun size={17} className="text-[#E6C98B] animate-in spin-in-90 duration-300" />
      ) : (
        <Moon size={17} className="text-stone-800 animate-in spin-in-90 duration-300" />
      )}
    </button>
  );
}
