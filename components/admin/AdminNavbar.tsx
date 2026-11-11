"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { ThemeToggle } from "@/components/shop/ThemeToggle";

interface AdminNavbarProps {
  logoutAction: () => Promise<void>;
}

const NAV_ITEMS = [
  {
    href: "/admin/ordenes",
    label: "Órdenes & Despacho",
    icon: "🛍️",
    badgeColor: "bg-pink-100 dark:bg-pink-950/80 text-[#B0004A] dark:text-pink-300 border-pink-300 dark:border-pink-800/80 hover:bg-pink-200"
  },
  {
    href: "/admin/productos",
    label: "Productos",
    icon: "📦",
    badgeColor: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-200"
  },
  {
    href: "/admin/catalogo",
    label: "Catálogo PDF",
    icon: "📖",
    badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800/80 hover:bg-amber-200"
  },
  {
    href: "/admin/sliders",
    label: "Banners",
    icon: "🖼️",
    badgeColor: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-200"
  },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    icon: "📊",
    badgeColor: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800/80 hover:bg-indigo-200"
  },
  {
    href: "/admin/adicionales",
    label: "Adicionales",
    icon: "✨",
    badgeColor: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-200"
  },
  {
    href: "/admin/papelera",
    label: "Papelera",
    icon: "🗑️",
    badgeColor: "bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800/80 hover:bg-rose-200"
  },
  {
    href: "/admin/entregas",
    label: "Entregas",
    icon: "🚚",
    badgeColor: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-200"
  },
  {
    href: "/admin/cupones",
    label: "Cupones",
    icon: "🎟️",
    badgeColor: "bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800/80 hover:bg-purple-200"
  },
  {
    href: "/admin/qr",
    label: "Códigos QR",
    icon: "📱",
    badgeColor: "bg-pink-100 dark:bg-pink-950/80 text-[#B0004A] dark:text-pink-300 border-pink-300 dark:border-pink-800/80 hover:bg-pink-200"
  },
  {
    href: "/admin/pagos",
    label: "Cuentas",
    icon: "💳",
    badgeColor: "bg-blue-100 dark:bg-blue-950/80 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800/80 hover:bg-blue-200"
  },
  {
    href: "/admin/seo",
    label: "SEO",
    icon: "🔍",
    badgeColor: "bg-teal-100 dark:bg-teal-950/80 text-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-800/80 hover:bg-teal-200"
  },
  {
    href: "/admin/blog",
    label: "Blogger",
    icon: "✍️",
    badgeColor: "bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800/80 hover:bg-rose-200"
  },
  {
    href: "/admin/configuracion?tab=chatbot",
    label: "Chatbot IA",
    icon: "🤖",
    badgeColor: "bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800/80 hover:bg-purple-200"
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: "⚙️",
    badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800/80 hover:bg-amber-200"
  }
];

export function AdminNavbar({ logoutAction }: AdminNavbarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Encontrar el item activo
  const activeItem = NAV_ITEMS.find((item) => pathname?.startsWith(item.href)) || {
    href: "/admin",
    label: "Panel Principal",
    icon: "🌸",
    badgeColor: ""
  };

  return (
    <nav className="bg-white dark:bg-[#181922] shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      
      {/* BARRA PRINCIPAL */}
      <div className="container mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* FILA SUPERIOR (Móvil y Escritorio): Logo, Tema y Acciones */}
        <div className="flex items-center justify-between w-full md:w-auto">
          
          <div className="flex items-center gap-2.5">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#92C21E]/50 overflow-hidden flex items-center justify-center bg-white shadow-sm group-hover:scale-105 transition-transform flex-shrink-0 p-0.5">
                <img src="/logo.png" alt="VKA POS Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <span className="font-serif font-black text-sm sm:text-base text-[#1A1C1C] dark:!text-white block leading-tight group-hover:text-[#E6007F] transition-colors">
                  VKA POS
                </span>
                <span className="text-[9px] font-bold text-[#92C21E] uppercase tracking-widest block">
                  Punto de Venta & Facturación
                </span>
              </div>
            </Link>

            {/* Selector de Modo Oscuro */}
            <div className="ml-1">
              <ThemeToggle />
            </div>

            {/* Chip de Sección Activa (Visible solo en móvil cuando el menú está cerrado) */}
            <div className="md:hidden flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/60 text-[#8B0024] dark:text-pink-300 text-[11px] font-bold">
              <span>{activeItem.icon}</span>
              <span className="truncate max-w-[85px]">{activeItem.label}</span>
            </div>
          </div>

          {/* CONTROLES MÓVILES (Salir + Botón Toggle Menú) */}
          <div className="flex md:hidden items-center gap-1.5">
            <form action={logoutAction}>
              <button
                type="submit"
                className="bg-[#1A1C1C] dark:bg-gray-800 text-white hover:bg-red-600 dark:hover:bg-red-600 p-2 rounded-xl text-xs font-bold transition-all flex items-center shadow-sm"
                title="Salir"
              >
                <LogOut size={14} />
              </button>
            </form>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-expanded={isMobileOpen}
              aria-label={isMobileOpen ? "Cerrar menú" : "Abrir menú de navegación"}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm border ${
                isMobileOpen
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-400"
                  : "bg-[#FF97A4] hover:bg-[#ff7e8e] text-white border-pink-400 active:scale-95"
              }`}
            >
              {isMobileOpen ? (
                <>
                  <X size={15} />
                  <span>Cerrar</span>
                </>
              ) : (
                <>
                  <Menu size={15} />
                  <span>Menú</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* NAVEGACIÓN EN ESCRITORIO (Siempre visible, horizontal y en una sola línea) */}
        <div className="hidden md:flex flex-wrap items-center justify-end gap-1.5 text-xs font-bold admin-nav-links">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5 font-bold border shadow-sm ${
                  isActive
                    ? "ring-2 ring-[#FF97A4] ring-offset-1 dark:ring-offset-gray-900 font-black scale-[1.02] " + (item.badgeColor || "bg-white dark:bg-gray-800 text-[#8B0024] dark:text-pink-300 border-pink-400")
                    : item.badgeColor
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

          {/* Enlace Ver Tienda */}
          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-pink-100 dark:bg-pink-950/80 hover:bg-pink-200 text-[#B0004A] dark:text-pink-300 transition-colors border border-pink-300 dark:border-pink-800 flex items-center gap-1 font-extrabold"
            title="Abrir tienda en nueva pestaña"
          >
            <span>👁️ Ver Tienda</span>
            <ExternalLink size={11} className="opacity-70" />
          </Link>

          {/* Formulario de Cierre de Sesión en Escritorio */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="bg-[#1A1C1C] dark:bg-gray-800 text-white hover:bg-red-600 dark:hover:bg-red-600 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ml-0.5"
            >
              <LogOut size={13} />
              <span>Salir</span>
            </button>
          </form>
        </div>

      </div>

      {/* MENÚ DESPLEGABLE EXCLUSIVO PARA MÓVILES (< md) */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-[#14151c]/95 backdrop-blur-md px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold admin-nav-links">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold border shadow-sm ${
                    isActive
                      ? "ring-2 ring-[#FF97A4] font-black " + (item.badgeColor || "bg-white dark:bg-gray-800 text-[#8B0024] dark:text-pink-300 border-pink-400")
                      : item.badgeColor
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {/* Enlace móvil adicional a 'Ver Tienda' */}
            <Link
              href="/"
              target="_blank"
              onClick={() => setIsMobileOpen(false)}
              className="col-span-2 px-3 py-2.5 rounded-xl bg-pink-100 dark:bg-pink-950/80 hover:bg-pink-200 text-[#B0004A] dark:text-pink-300 transition-colors border border-pink-300 dark:border-pink-800 flex items-center justify-center gap-2 font-bold"
            >
              <span>👁️ Ver Tienda Online</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}

    </nav>
  );
}
