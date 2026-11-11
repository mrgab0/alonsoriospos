"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Activity,
  Image as ImageIcon,
  Sparkles,
  Truck,
  Ticket,
  CreditCard,
  Search,
  Settings,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  PackagePlus,
  Zap,
  Users,
} from "lucide-react";

interface AdminModule {
  id: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  badgeColor: string;
  actionText: string;
  iconGradient: string;
  iconShadow: string;
  borderColor: string;
  hoverBorder: string;
  icon: React.ElementType;
}

const ADMIN_MODULES: AdminModule[] = [
  {
    id: "pos",
    title: "Terminal Punto de Venta (POS)",
    description: "Caja rápida, escáner por cámara y lector USB, cobro multimétodo y tickets térmicos.",
    href: "/admin/pos",
    badge: "Mostrador ⚡",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    actionText: "Abrir caja POS",
    iconGradient: "from-emerald-500 to-teal-500",
    iconShadow: "shadow-emerald-500/30",
    borderColor: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-400",
    icon: Zap,
  },
  {
    id: "compras",
    title: "Compras & Recepción",
    description: "Ingreso de facturas de proveedores y aumento automático de stock en Kardex.",
    href: "/admin/compras",
    badge: "Kardex",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    actionText: "Recepcionar mercancía",
    iconGradient: "from-emerald-500 to-teal-600",
    iconShadow: "shadow-emerald-500/25",
    borderColor: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/60",
    icon: PackagePlus,
  },
  {
    id: "proveedores",
    title: "Gestión de Proveedores",
    description: "Empresas distribuidoras, días de crédito y saldos por pagar.",
    href: "/admin/proveedores",
    badge: "Directorio",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    actionText: "Ver proveedores",
    iconGradient: "from-blue-500 to-indigo-600",
    iconShadow: "shadow-blue-500/25",
    borderColor: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/60",
    icon: Building2,
  },
  {
    id: "cuentas-por-pagar",
    title: "Cuentas por Pagar",
    description: "Facturas pendientes a crédito, control de vencimientos y abonos.",
    href: "/admin/cuentas-por-pagar",
    badge: "Tesorería",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    actionText: "Gestionar pagos",
    iconGradient: "from-amber-500 to-orange-600",
    iconShadow: "shadow-amber-500/25",
    borderColor: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/60",
    icon: CreditCard,
  },
  {
    id: "cuentas-por-cobrar",
    title: "Cuentas por Cobrar (Fiado)",
    description: "Clientes deudores, registro de abonos en caja y límites de crédito.",
    href: "/admin/cuentas-por-cobrar",
    badge: "Crédito 👥",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    actionText: "Ver cartera deudora",
    iconGradient: "from-emerald-600 to-teal-700",
    iconShadow: "shadow-emerald-600/25",
    borderColor: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/60",
    icon: Users,
  },
  {
    id: "conductores",
    title: "Flota & Conductores",
    description: "Repartidores multivehículo (bici, moto, auto, fletes), tarifas y asignación.",
    href: "/admin/conductores",
    badge: "Delivery 🛵",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    actionText: "Gestionar flota",
    iconGradient: "from-cyan-500 to-blue-600",
    iconShadow: "shadow-cyan-500/25",
    borderColor: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/60",
    icon: Truck,
  },
  {
    id: "ordenes",
    title: "Gestor de Órdenes & Despacho",
    description: "Monitoreo de facturas, preparación de pedidos y asignación de ruta.",
    href: "/admin/ordenes",
    badge: "14 nuevos",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    actionText: "Abrir panel de órdenes",
    iconGradient: "from-pink-500 to-rose-600",
    iconShadow: "shadow-pink-500/25",
    borderColor: "border-pink-500/20",
    hoverBorder: "hover:border-pink-500/60",
    icon: ShoppingBag,
  },
  {
    id: "productos",
    title: "Gestionar Productos",
    description: "Catálogo de artículos, control de precios, código de barras y stock.",
    href: "/admin/productos",
    badge: "24 activos",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    actionText: "Añadir o editar productos",
    iconGradient: "from-blue-500 to-indigo-600",
    iconShadow: "shadow-blue-500/25",
    borderColor: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/60",
    icon: Package,
  },
  {
    id: "estadisticas",
    title: "Estadísticas & Carritos",
    description: "Resumen de conversiones y recuperación de carritos boutique.",
    href: "/admin/estadisticas",
    badge: "ACTIVE",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    actionText: "Ver métricas básicas",
    iconGradient: "from-purple-500 to-indigo-600",
    iconShadow: "shadow-purple-500/25",
    borderColor: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/60",
    icon: Activity,
  },
  {
    id: "banners",
    title: "Gestionar Banners",
    description: "Banners promocionales para San Valentín, Madres y Festivos.",
    href: "/admin/sliders",
    badge: "HERO WEB",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    actionText: "Actualizar banners",
    iconGradient: "from-rose-400 to-pink-500",
    iconShadow: "shadow-rose-500/25",
    borderColor: "border-rose-500/20",
    hoverBorder: "hover:border-rose-500/60",
    icon: ImageIcon,
  },
  {
    id: "adicionales",
    title: "Gestionar Adicionales",
    description: "Coronas, mariposas, peluches y lazos con mensajes en oro.",
    href: "/admin/adicionales",
    badge: "Personalización",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    actionText: "Ajustar complementos",
    iconGradient: "from-violet-500 to-purple-700",
    iconShadow: "shadow-violet-500/25",
    borderColor: "border-violet-500/20",
    hoverBorder: "hover:border-violet-500/60",
    icon: Sparkles,
  },
  {
    id: "entregas",
    title: "Opciones de Entrega",
    description: "Tarifas por código postal (River Oaks, Katy, Woodlands) y choferes.",
    href: "/admin/entregas",
    badge: "Houston Zonas",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    actionText: "Configurar zonas",
    iconGradient: "from-emerald-500 to-teal-700",
    iconShadow: "shadow-emerald-500/25",
    borderColor: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/60",
    icon: Truck,
  },
  {
    id: "doordash",
    title: "DoorDash Drive Encomiendas",
    description: "Verificación de dominio, script oficial de DoorDash y despacho automático.",
    href: "/admin/doordash",
    badge: "DOORDASH",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    actionText: "Configurar DoorDash & Archivo",
    iconGradient: "from-red-600 via-rose-500 to-amber-500",
    iconShadow: "shadow-red-500/25",
    borderColor: "border-red-500/20",
    hoverBorder: "hover:border-red-500/60",
    icon: Truck,
  },
  {
    id: "cupones",
    title: "Cupones de Descuento",
    description: "Creación de códigos VIP, descuentos porcentuales y límites de uso.",
    href: "/admin/cupones",
    badge: "Promos",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    actionText: "Crear nuevo cupón",
    iconGradient: "from-amber-500 to-orange-600",
    iconShadow: "shadow-amber-500/25",
    borderColor: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/60",
    icon: Ticket,
  },
  {
    id: "pagos",
    title: "Cuentas de Pago & QR",
    description: "Configuración Stripe, Zelle Houston, Apple Pay y Códigos QR.",
    href: "/admin/pagos",
    badge: "Pasarelas",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    actionText: "Gestionar pagos",
    iconGradient: "from-cyan-500 to-blue-600",
    iconShadow: "shadow-cyan-500/25",
    borderColor: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/60",
    icon: CreditCard,
  },
  {
    id: "seo",
    title: "Optimización SEO",
    description: "Metadatos, OpenGraph y keywords para floristerías de lujo Houston.",
    href: "/admin/seo",
    badge: "Google Index",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    actionText: "Inspeccionar SEO",
    iconGradient: "from-teal-500 to-emerald-600",
    iconShadow: "shadow-teal-500/25",
    borderColor: "border-teal-500/20",
    hoverBorder: "hover:border-teal-500/60",
    icon: Search,
  },
  {
    id: "configuracion",
    title: "Configuración (2FA & Lemas)",
    description: "Seguridad de acceso, lemas predeterminados de cinta y avisos.",
    href: "/admin/configuracion",
    badge: "2FA & Taller",
    badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    actionText: "Ajustes de sistema",
    iconGradient: "from-slate-600 to-slate-800",
    iconShadow: "shadow-slate-500/25",
    borderColor: "border-slate-500/20",
    hoverBorder: "hover:border-slate-500/60",
    icon: Settings,
  },
];

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Efecto inicial de carga suave (Stitch useEffect Shimmer)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleSimulateLoad = () => {
    setIsRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsRefreshing(false);
    }, 650);
  };

  return (
    <div className="relative space-y-8 select-none">
      {/* Luces de Fondo Ambientales (Console Glow) */}
      <div className="fixed top-20 right-1/4 w-[450px] h-[300px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[300px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none -z-0" />

      {/* HERO BANNER DE BIENVENIDA (Estilo Stitch Admin Console) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-[#13141c] to-gray-900 dark:from-[#0F1015] dark:via-[#161822] dark:to-[#0F1015] border border-gray-800 dark:border-gray-800/80 p-6 sm:p-8 shadow-2xl text-white">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#FF97A4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF97A4]">
                VKA POS • Centro de Gestión
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Modo Producción
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
              Bienvenido al Centro de Control
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 dark:text-gray-400 max-w-2xl leading-relaxed">
              Selecciona un módulo para gestionar facturación, inventario, punto de venta, compras a proveedores y despachos.
            </p>
          </div>

          {/* Quick status pills y Botón de Simulación de Efectos de Carga */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3 shadow-inner">
              <span className="text-2xl">🌺</span>
              <div className="text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">
                  Despachos Hoy
                </span>
                <span className="text-sm font-extrabold text-white">
                  14 Activos
                </span>
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3 shadow-inner">
              <span className="text-2xl">⚡</span>
              <div className="text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">
                  Catálogo Houston
                </span>
                <span className="text-sm font-extrabold text-emerald-400">
                  24 En Línea
                </span>
              </div>
            </div>

            {/* Botón Simular Carga (useEffect) */}
            <button
              onClick={handleSimulateLoad}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-xs font-bold text-white transition-all shadow-sm group hover:border-[#FF97A4]/50"
              title="Re-ejecutar animación de esqueletos shimmer"
            >
              <RefreshCw
                size={14}
                className={`text-[#FF97A4] transition-transform duration-500 ${
                  isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                }`}
              />
              <span className="hidden sm:inline">Simular Carga (useEffect)</span>
            </button>

            {/* Botón VKA Co-Pilot Asistente */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-bonbon-chat"));
                }
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 active:scale-95 border border-emerald-500/40 text-xs font-bold text-white transition-all shadow-sm group"
              title="Abrir VKA Co-Pilot Asistente de Gestión"
            >
              <span className="text-base group-hover:scale-110 transition-transform">⚡</span>
              <span>VKA Co-Pilot</span>
            </button>
          </div>
        </div>
      </div>


      {/* ENCABEZADO DE MÓDULOS */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF97A4]" />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-900 dark:text-white">
            Módulos de Gestión
          </h2>
          <span className="text-xs text-gray-400 font-mono">(10 accesos directos)</span>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          Presiona cualquier módulo para abrir la consola
        </span>
      </div>

      {/* ESTADO DE CARGA: ESQUELETOS SHIMMER */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-44 rounded-2xl bg-gray-100 dark:bg-[#12131A] border border-gray-200 dark:border-gray-800/80 p-5 skeleton-shimmer space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="w-16 h-5 rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
              <div className="w-3/4 h-5 rounded bg-gray-200 dark:bg-white/10" />
              <div className="w-1/2 h-3 rounded bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        /* GRID DE LOS 10 MÓDULOS CON EFECTO STAGGER & TÁCTIL */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {ADMIN_MODULES.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                href={module.href}
                style={{
                  animationDelay: `${index * 40}ms`,
                }}
                className={`stagger-item loaded btn-touchable group relative rounded-2xl bg-white dark:bg-[#13141C] border ${module.borderColor} ${module.hoverBorder} p-5 flex flex-col justify-between shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all duration-300 min-h-[185px]`}
              >
                <div>
                  {/* Fila Superior: Icono con Gradiente 3D + Badge */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.iconGradient} flex items-center justify-center text-white shadow-md ${module.iconShadow} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon size={22} strokeWidth={2} />
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${module.badgeColor}`}
                    >
                      {module.badge}
                    </span>
                  </div>

                  {/* Título & Descripción */}
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#FF97A4] transition-colors leading-snug">
                    {module.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                {/* Fila Inferior: Link de Acción con Flecha */}
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  <span className="text-[11px] group-hover:translate-x-1 transition-transform">
                    {module.actionText}
                  </span>
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform text-[#FF97A4]"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* FOOTER BAR: RE-AUTENTICACIÓN Y SEGURIDAD */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>VKA POS • Sistema de Facturación & Inventario</span>
          <span className="hidden sm:inline">•</span>
          <span className="font-mono text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} />
            React Native Engine Ready
          </span>
        </div>

        <div className="text-[11px] text-gray-400 font-mono">
          v2.4 Admin Console
        </div>
      </div>
    </div>
  );
}
