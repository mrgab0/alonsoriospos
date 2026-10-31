"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function WebsiteLaunchCelebration() {
  const pathname = usePathname();

  // No mostrar en ninguna pantalla administrativa
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Idioma: Español en rutas /es, Inglés por defecto en /en y la raíz /
  const isSpanish = pathname?.startsWith("/es");

  return (
    <>
      <style jsx global>{`
        @keyframes bowWiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(10deg);
          }
        }
        .bow-wiggle-anim {
          display: inline-block;
          animation: bowWiggle 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* LACITO EN EL BORDE SUPERIOR DERECHO (CORNER RIBBON) */}
      <div 
        aria-hidden="true"
        className="fixed top-0 right-0 w-36 h-36 sm:w-44 sm:h-44 overflow-hidden z-50 pointer-events-none select-none print:hidden"
      >
        <div 
          className="absolute top-7 -right-11 sm:top-8 sm:-right-10 w-48 sm:w-56 transform rotate-45 text-center py-1 sm:py-1.5 shadow-md flex items-center justify-center gap-1.5 border-y border-[#C5A059]/60"
          style={{
            background: "linear-gradient(135deg, #FF97A4 0%, #D85C6E 100%)",
            boxShadow: "0 4px 15px rgba(216, 92, 110, 0.4)",
          }}
        >
          <span className="bow-wiggle-anim text-xs sm:text-sm leading-none">🎀</span>
          <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wide text-white drop-shadow-xs whitespace-nowrap">
            {isSpanish ? "¡SEMANA DE ESTRENO!" : "GRAND OPENING WEEK"}
          </span>
        </div>
      </div>
    </>
  );
}

export default WebsiteLaunchCelebration;
