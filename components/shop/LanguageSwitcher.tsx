"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const isSpanish = pathname.startsWith("/es");
  const isEnglish = !isSpanish;

  const toggleLanguage = (targetLocale: "es" | "en") => {
    try {
      localStorage.setItem("bonbon_preferred_lang", targetLocale);
      document.cookie = `bonbon_lang=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (_) {}

    let newPath = pathname;

    if (targetLocale === "es") {
      if (pathname.startsWith("/en")) {
        newPath = pathname.replace(/^\/en/, "/es");
      } else if (!pathname.startsWith("/es")) {
        newPath = pathname === "/" ? "/es" : `/es${pathname}`;
      }
    } else {
      // Target English: navigate to clean root path
      if (pathname.startsWith("/es")) {
        newPath = pathname.replace(/^\/es/, "") || "/";
      } else if (pathname.startsWith("/en")) {
        newPath = pathname.replace(/^\/en/, "") || "/";
      }
    }

    router.push(newPath);
  };

  return (
    <div className="flex items-center bg-stone-100 dark:bg-stone-900/90 p-1 rounded-full border border-stone-200 dark:border-stone-800 text-[11px] font-extrabold text-stone-700 dark:text-stone-300 shadow-inner">
      <button
        type="button"
        onClick={() => toggleLanguage("es")}
        className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
          !isEnglish
            ? "bg-white dark:bg-[#163422] text-stone-900 dark:text-[#E6C98B] shadow-sm font-black border border-transparent dark:border-[#E6C98B]/50"
            : "text-stone-700 dark:text-stone-400 hover:text-[#163422] dark:hover:text-[#E6C98B] font-bold"
        }`}
        title="Cambiar a Español"
      >
        <span>🇲🇽</span>
        <span>ES</span>
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage("en")}
        className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
          isEnglish
            ? "bg-white dark:bg-[#163422] text-stone-900 dark:text-[#E6C98B] shadow-sm font-black border border-transparent dark:border-[#E6C98B]/50"
            : "text-stone-700 dark:text-stone-400 hover:text-[#163422] dark:hover:text-[#E6C98B] font-bold"
        }`}
        title="Switch to English"
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
