"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Truck, Clock, MapPin, Phone } from "lucide-react";

interface TrustAnnouncementBarProps {
  phone?: string;
}

export const TrustAnnouncementBar: React.FC<TrustAnnouncementBarProps> = ({
  phone = "(346) 739-2730"
}) => {
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return (
    <div className="w-full z-40 relative">
      {/* Barra superior de anuncios estilo boutique de flor.zip */}
      <aside
        className="text-xs md:text-sm font-serif font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] py-2 px-4 text-center flex justify-center items-center shadow-xs border-b border-black/10 dark:border-white/10 transition-colors duration-200"
        style={{
          backgroundColor: "var(--theme-announcement-bg, #33cccc)",
          color: "var(--theme-announcement-text, #1c1917)",
        }}
      >
        <a
          className="hover:underline flex items-center gap-2 transition-opacity hover:opacity-85"
          href={`tel:${cleanPhone || "+13467392730"}`}
        >
          <Phone size={13} className="inline-block animate-pulse text-[#FF97A4] dark:text-[#E6C98B]" />
          <span>{isSpanish ? `ENTREGA EL MISMO DÍA EN HOUSTON • ${phone}` : `SAME DAY DELIVERY HOUSTON • ${phone}`}</span>
          <span className="inline-block transition-transform group-hover:translate-x-1 font-bold">→</span>
        </a>
      </aside>

      {/* Barra de 3 compromisos de servicio / Trust Bar */}
      <section
        className="py-2.5 px-4 text-xs font-serif font-bold tracking-[0.18em] sm:tracking-[0.22em] uppercase border-t border-black/10 dark:border-white/10 shadow-inner transition-colors duration-200"
        style={{
          backgroundColor: "var(--theme-announcement-bg, #33cccc)",
          color: "var(--theme-announcement-text, #1c1917)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center sm:justify-around items-center gap-y-2 gap-x-6 text-[10px] sm:text-xs">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 shrink-0 text-[#FF97A4] dark:text-[#E6C98B]" />
            <span className="tracking-[0.18em] sm:tracking-[0.22em]">{isSpanish ? "ENTREGA EL MISMO DÍA EN HOUSTON" : "SAME DAY DELIVERY HOUSTON"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 shrink-0 text-[#FF97A4] dark:text-[#E6C98B]" />
            <span className="font-script-custom preserve-color text-sm sm:text-base normal-case tracking-normal italic font-normal" style={{ color: "var(--theme-announcement-text, inherit)" }}>
              {isSpanish ? "Ordena antes de la 1 PM para entrega el mismo día" : "Order before 1 PM for same-day delivery"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 shrink-0 text-[#FF97A4] dark:text-[#E6C98B]" />
            <span className="tracking-[0.18em] sm:tracking-[0.22em]">{isSpanish ? "ORGULLOSAMENTE SIRVIENDO AL METROPLEX DE HOUSTON" : "PROUDLY SERVING HOUSTON METROPLEX"}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
