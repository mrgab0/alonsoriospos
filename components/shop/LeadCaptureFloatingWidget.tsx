"use client";

import React, { useState, useEffect } from "react";
import { Gift, X, Sparkles, Check, ArrowRight, Loader2 } from "lucide-react";
import { captureLeadAction, getLeadCaptureConfigAction } from "@/lib/actions/leadCapture";
import { usePathname } from "next/navigation";

export function LeadCaptureFloatingWidget() {
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const [config, setConfig] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successCoupon, setSuccessCoupon] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // No mostrar en rutas administrativas
    if (pathname?.startsWith("/admin")) return;

    // Verificar si el usuario ya interactuó o se suscribió
    const alreadyCaptured = localStorage.getItem("bonbon_lead_captured");
    if (alreadyCaptured) return;

    let timer: NodeJS.Timeout;

    getLeadCaptureConfigAction().then((res) => {
      if (res.success && res.data && res.data.leadCaptureActive) {
        setConfig(res.data);
        const delayMs = (res.data.leadCaptureDelaySeconds || 7) * 1000;

        timer = setTimeout(() => {
          setIsOpen(true);
        }, delayMs);
      }
    });

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isOpen || !config || !config.leadCaptureActive || pathname?.startsWith("/admin")) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    // Guardar para no molestar por 7 días
    localStorage.setItem("bonbon_lead_captured", "dismissed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setLoading(true);
    const res = await captureLeadAction({
      email: email.trim(),
      source: "floating_popup",
      templateId: config.leadCaptureTemplate,
    });
    setLoading(false);

    if (res.success && res.couponCode) {
      setSuccessCoupon(res.couponCode);
      localStorage.setItem("bonbon_lead_captured", "subscribed");
    }
  };

  const handleCopyCoupon = () => {
    if (successCoupon) {
      navigator.clipboard.writeText(successCoupon);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ---------------------------------------------------------------------------
  // TEMPLATE 1: CHAMPAGNE LUXURY PILL (Discreta en Esquina Inferior Izquierda)
  // ---------------------------------------------------------------------------
  if (config.leadCaptureTemplate === "champagne_pill") {
    return (
      <div className="fixed bottom-6 left-5 sm:left-6 z-40 max-w-sm animate-in slide-in-from-bottom-6 duration-500">
        {!isExpanded && !successCoupon ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2.5 bg-[#163422] text-white px-4 py-3 rounded-full shadow-2xl border-2 border-[#C5A059] hover:scale-105 active:scale-95 transition-all group"
          >
            <span className="w-8 h-8 rounded-full bg-[#C5A059] text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <Gift size={16} className="group-hover:rotate-12 transition-transform" />
            </span>
            <div className="text-left pr-1">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#E6C98B]">
                {isSpanish ? "Regalo de Bienvenida" : "Welcome Gift"}
              </span>
              <span className="block text-xs font-bold leading-tight">
                {isSpanish ? "10% OFF en tu primer pedido" : "10% OFF your first order"}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-white/60 hover:text-white p-1 ml-1"
            >
              <X size={14} />
            </button>
          </button>
        ) : (
          <div className="bg-[#163422] text-white p-5 rounded-3xl shadow-2xl border-2 border-[#C5A059] relative space-y-3.5">
            <button
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 text-white/60 hover:text-white p-1 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#C5A059] text-stone-950 flex items-center justify-center font-bold">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="font-serif font-black text-sm text-[#E6C98B]">
                  {config.leadCaptureTitle}
                </h4>
                <p className="text-[11px] text-[#E6F7F0]/80 mt-0.5">
                  {config.leadCaptureSubtitle}
                </p>
              </div>
            </div>

            {successCoupon ? (
              <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 text-center space-y-2">
                <span className="text-[10px] font-bold text-[#E6C98B] uppercase tracking-wider block">
                  {isSpanish ? "¡Cupón Activado!" : "Coupon Activated!"}
                </span>
                <strong className="text-xl font-mono text-white tracking-widest block">
                  {successCoupon}
                </strong>
                <button
                  onClick={handleCopyCoupon}
                  className="w-full py-2 bg-[#C5A059] text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  {copied ? <Check size={14} /> : null}
                  <span>{copied ? (isSpanish ? "¡Copiado!" : "Copied!") : (isSpanish ? "Copiar Cupón" : "Copy Coupon")}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isSpanish ? "Escribe tu correo..." : "Enter your email..."}
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#d8b568] text-stone-950 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : (isSpanish ? "Reclamar" : "Claim")}
                  </button>
                </div>
                <span className="text-[9px] text-[#A3B8AD] block text-center">
                  {isSpanish ? "Sin spam. Puedes desuscribirte en cualquier momento." : "No spam. Unsubscribe anytime."}
                </span>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TEMPLATE 2: COUTURE VELVET MODAL (Ventana Emergente Centrada)
  // ---------------------------------------------------------------------------
  if (config.leadCaptureTemplate === "velvet_modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
        <div className="relative w-full max-w-md bg-[#0F1210] text-white p-7 rounded-3xl border-2 border-[#C5A059]/50 shadow-2xl text-center space-y-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-full"
          >
            <X size={18} />
          </button>

          <img
            src="https://bonbonflowershouston.com/logo.png"
            alt="Bonbon Flowers"
            className="w-16 h-16 rounded-full mx-auto border-2 border-[#C5A059] shadow-md object-cover"
          />

          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C5A059] block mb-1">
              {isSpanish ? "Club Exclusivo • Houston" : "Exclusive Club • Houston"}
            </span>
            <h3 className="font-serif font-black text-xl text-[#FFFFFF]">
              {config.leadCaptureTitle}
            </h3>
            <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto">
              {config.leadCaptureSubtitle}
            </p>
          </div>

          {successCoupon ? (
            <div className="p-4 bg-white/5 rounded-2xl border border-[#C5A059]/40 space-y-3">
              <span className="text-xs font-bold text-[#E6C98B] block">
                {isSpanish ? "Tu cupón exclusivo está listo:" : "Your exclusive coupon is ready:"}
              </span>
              <strong className="text-2xl font-mono text-[#E6C98B] tracking-widest block">
                {successCoupon}
              </strong>
              <button
                onClick={handleCopyCoupon}
                className="w-full py-3 bg-[#163422] text-white border border-[#C5A059] rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                {copied ? (isSpanish ? "✓ Copiado al portapapeles" : "✓ Copied to clipboard") : (isSpanish ? "Copiar Cupón y Comprar" : "Copy Coupon & Shop")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isSpanish ? "Ingresa tu correo electrónico..." : "Enter your email address..."}
                required
                className="w-full p-3.5 rounded-xl text-xs bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#163422] hover:bg-[#1B2E22] text-white border border-[#C5A059] rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                {loading ? (isSpanish ? "Generando Cupón..." : "Generating Coupon...") : (isSpanish ? "Obtener 10% de Regalo Ahora" : "Get 10% Gift Now")}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TEMPLATE 3: CORNER TOAST CARD (Tarjeta Flotante Inferior Derecha)
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 max-w-xs bg-white dark:bg-[#141A16] text-stone-900 dark:text-white p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl space-y-3 animate-in slide-in-from-bottom-6">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#163422] dark:text-[#E6C98B] flex items-center gap-1.5">
          <Gift size={12} /> {isSpanish ? "Regalo Especial" : "Special Gift"}
        </span>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={14} />
        </button>
      </div>

      <h5 className="font-bold text-xs leading-snug">{config.leadCaptureTitle}</h5>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{config.leadCaptureSubtitle}</p>

      {successCoupon ? (
        <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl text-center space-y-1.5 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">{isSpanish ? "¡Cupón Activo!" : "Active Coupon!"}</span>
          <strong className="text-lg font-mono tracking-wider">{successCoupon}</strong>
          <button
            onClick={handleCopyCoupon}
            className="w-full py-1.5 bg-[#163422] text-white rounded-lg text-xs font-bold"
          >
            {copied ? (isSpanish ? "Copiado" : "Copied") : (isSpanish ? "Copiar" : "Copy")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isSpanish ? "Tu email..." : "Your email..."}
            required
            className="flex-1 p-2 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 bg-[#163422] hover:bg-[#1B2E22] text-white rounded-lg text-xs font-bold whitespace-nowrap"
          >
            {loading ? "..." : (isSpanish ? "Obtener" : "Get")}
          </button>
        </form>
      )}
    </div>
  );
}
