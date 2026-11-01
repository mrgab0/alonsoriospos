"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Sparkles, ArrowRight, ShoppingBag, Flame, Tag } from "lucide-react";
import { useCart } from "@/components/shop/Cart/CartContext";

export function FlashSaleCollectionsSection() {
  const { addToCart } = useCart();

  // Contador de Cuenta Regresiva Cíclica (48 horas dinámicas)
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 14,
    minutes: 36,
    seconds: 48
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          return { days: 2, hours: 12, minutes: 0, seconds: 0 }; // Reinicio elegante
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-14 sm:py-20 relative z-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Encabezado de Sección */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-[#D4AF37]/40 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
            <Flame size={13} className="text-amber-600" />
            <span>Colección & Ofertas Especiales</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
            Colección Boutique 2026
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
            Diseños florales contemporáneos con descuentos exclusivos por tiempo limitado.
          </p>
        </div>

        {/* Grilla: Oferta Flash a la izquierda + Colecciones a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* TARJETA PRINCIPAL IZQUIERDA: Flash Sale con Temporizador en Vivo */}
          <div className="lg:col-span-6 bg-white dark:bg-[#181922] p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/30 dark:border-gray-800 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            {/* Encabezado del Flash Sale & Contador */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#163422] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md animate-pulse">
                  <Tag size={12} />
                  <span>Oferta Flash • -25% OFF</span>
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock size={13} className="text-[#163422] dark:text-[#C5A059]" />
                  <span>Termina en:</span>
                </span>
              </div>

              {/* Bloques del Contador */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                <div className="bg-stone-50 dark:bg-gray-800/80 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
                  <span className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-white block">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-gray-700 dark:text-gray-200 tracking-wider">Días</span>
                </div>
                <div className="bg-stone-50 dark:bg-gray-800/80 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
                  <span className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-white block">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-gray-700 dark:text-gray-200 tracking-wider">Horas</span>
                </div>
                <div className="bg-stone-50 dark:bg-gray-800/80 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
                  <span className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-white block">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-gray-700 dark:text-gray-200 tracking-wider">Min</span>
                </div>
                <div className="bg-stone-50 dark:bg-gray-800/80 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
                  <span className="font-serif font-black text-2xl sm:text-3xl text-[#163422] dark:text-[#C5A059] block">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-gray-700 dark:text-gray-200 tracking-wider">Seg</span>
                </div>
              </div>
            </div>

            {/* Imagen del Ramo Estrella & Detalles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center my-2">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white dark:border-gray-700 group">
                <img
                  src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=500&auto=format&fit=crop&q=80"
                  alt="Ramo Estrella en Descuento"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-2 left-2 bg-[#163422] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  🔥 Más Vendido
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white">
                  Caja Velvet con 50 Rosas Rojas & Ferrero
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  Rosas rojas premium de exportación ecuatoriana en caja aterciopelada de lujo con lazo de seda.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-stone-900 dark:text-white">$119.99</span>
                  <span className="text-sm font-bold text-gray-400 line-through">$159.99</span>
                </div>
              </div>
            </div>

            {/* Botón de Compra Directa */}
            <div className="pt-2">
              <button
                onClick={() => addToCart({
                  id: "flash-sale-50-roses",
                  name: "Caja Velvet con 50 Rosas Rojas & Ferrero",
                  price: 119.99,
                  image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=500&auto=format&fit=crop&q=80"
                })}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg active:scale-95"
              >
                <ShoppingBag size={16} />
                <span>Aprovechar Oferta Flash Ahora</span>
              </button>
            </div>
          </div>

          {/* TARJETAS DERECHAS: Colecciones Visuales con Botón Central */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Colección 1: Ramos de Lujo */}
            <div className="group relative rounded-3xl overflow-hidden min-h-[260px] flex items-center justify-center shadow-lg border border-white/20">
              <img
                src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=80"
                alt="Colección Ramos de Lujo"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <Link
                href="/productos?cat=rosas"
                className="relative z-10 bg-white text-stone-900 hover:bg-[#163422] hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl group-hover:scale-105 active:scale-95"
              >
                Rosas de Lujo ↗
              </Link>
            </div>

            {/* Colección 2: Bouquets Silvestres */}
            <div className="group relative rounded-3xl overflow-hidden min-h-[260px] flex items-center justify-center shadow-lg border border-white/20">
              <img
                src="https://images.unsplash.com/photo-1520763185298-1b434c919102?w=500&auto=format&fit=crop&q=80"
                alt="Colección Bouquets Mixtos"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <Link
                href="/productos?cat=bouquets"
                className="relative z-10 bg-white text-stone-900 hover:bg-[#163422] hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl group-hover:scale-105 active:scale-95"
              >
                Bouquets Mixtos ↗
              </Link>
            </div>

            {/* Colección 3: Cajas Velvet & Cúpulas */}
            <div className="group relative rounded-3xl overflow-hidden min-h-[260px] flex items-center justify-center shadow-lg border border-white/20">
              <img
                src="https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=500&auto=format&fit=crop&q=80"
                alt="Colección Cajas Velvet"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <Link
                href="/productos?cat=cajas"
                className="relative z-10 bg-white text-stone-900 hover:bg-[#163422] hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl group-hover:scale-105 active:scale-95"
              >
                Cajas Velvet ↗
              </Link>
            </div>

            {/* Colección 4: Adicionales & Detalles */}
            <div className="group relative rounded-3xl overflow-hidden min-h-[260px] flex items-center justify-center shadow-lg border border-white/20">
              <img
                src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80"
                alt="Colección Complementos & Regalos"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <Link
                href="/productos?cat=adicionales"
                className="relative z-10 bg-white text-stone-900 hover:bg-[#163422] hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl group-hover:scale-105 active:scale-95"
              >
                Regalos & Extras ↗
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
