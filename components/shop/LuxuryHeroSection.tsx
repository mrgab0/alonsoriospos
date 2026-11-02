"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Star, Award, Truck, Sparkles } from "lucide-react";

interface LuxuryHeroSectionProps {
  siteConfig?: any;
  heroProducts?: any[];
  locale?: string;
}

export const LuxuryHeroSection: React.FC<LuxuryHeroSectionProps> = ({ siteConfig, heroProducts = [], locale = "es" }) => {
  const logoUrl = siteConfig?.logoUrl || "https://bonbonflowershouston.com/logo.png";
  const prefix = locale === "en" ? "/en" : "";
  const catalogUrl = `${prefix}/productos`;
  const whatsappUrl = "https://wa.me/13467392730?text=Hola!%20Quisiera%20pedir%20flores%20en%20Houston.";

  const fallbackProduct = {
    name: "Anniversary Romance Haute Floral Collection Houston",
    slug: "",
    price: 99.99,
    badge: "Haute Handcrafted",
    images: ["https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80&auto=format"]
  };

  const [currentProduct, setCurrentProduct] = useState<any>(
    heroProducts && heroProducts.length > 0 ? heroProducts[0] : fallbackProduct
  );

  useEffect(() => {
    if (heroProducts && heroProducts.length > 1) {
      const randomIndex = Math.floor(Math.random() * heroProducts.length);
      setCurrentProduct(heroProducts[randomIndex]);
    } else if (heroProducts && heroProducts.length === 1) {
      setCurrentProduct(heroProducts[0]);
    }
  }, [heroProducts]);

  const activeProduct = currentProduct || fallbackProduct;
  const productImage = (activeProduct.images && activeProduct.images.length > 0 && activeProduct.images[0])
    ? activeProduct.images[0]
    : "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80&auto=format";
  const productPrice = typeof activeProduct.price === "number" ? activeProduct.price.toFixed(2) : "99.99";
  const productBadge = activeProduct.badge || "Haute Handcrafted";
  const productLink = activeProduct.slug ? `${prefix}/productos/${activeProduct.slug}` : "#catalogo";

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0B0C10] py-12 lg:py-20 border-b border-stone-200/80 dark:border-gray-800/80 transition-colors duration-300 select-none">
      {/* Luces sutiles ambientales de fondo */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[350px] bg-[#FF97A4]/10 rounded-full blur-[140px] pointer-events-none -z-0" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[250px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Columna Izquierda: Tipografía Editorial y CTAs de Conversión */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-5 text-left">
            {/* Badge de Taller Couture */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-[#FF97A4]/30 text-[#B0004A] dark:text-[#FF97A4] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF97A4] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
                Houston Couture Boutique
              </span>
            </div>

            {/* Kicker y Título Principal */}
            <div className="space-y-1.5">
              <span className="text-xs font-serif uppercase tracking-[0.25em] text-[#92C21E] font-bold block">
                Art Floral • Houston
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-luxury-serif text-stone-900 dark:text-white tracking-tight leading-[1.08] font-normal">
                Flowers that make them{" "}
                <span className="font-script-custom text-[#163422] dark:text-[#E6C98B] text-6xl sm:text-7xl lg:text-8xl italic block mt-1">
                  feel loved ♡
                </span>
              </h1>
            </div>

            {/* Descripción Editorial */}
            <p className="text-sm sm:text-base text-stone-600 dark:text-gray-300 max-w-xl leading-relaxed font-medium">
              Entrega de flores de alta costura el mismo día en Houston, TX y área metropolitana. Composiciones de autor confeccionadas a mano con rosas ecuatorianas selectas para momentos inolvidables.
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
              <Link
                href="#catalogo"
                className="px-8 py-3.5 rounded-xl bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1F452E] text-white dark:text-white border border-transparent dark:border-[#C5A059]/40 text-xs font-extrabold uppercase tracking-widest text-center shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                EXPLORAR COLECCIÓN
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-xl bg-[#FAF7F5] dark:bg-[#141A16] hover:bg-pink-50 dark:hover:bg-[#1A221D] text-stone-800 dark:text-white border border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-center shadow-sm hover:border-[#FF97A4]/50 hover:text-[#163422] dark:hover:text-[#FF97A4] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} className="text-emerald-500 dark:text-[#FF97A4]" />
                <span>PEDIR POR WHATSAPP</span>
              </a>
            </div>

            {/* Fila de Insignias de Confianza en Vivo */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2.5 gap-x-5 text-xs text-stone-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-t border-stone-100 dark:border-gray-800/80 w-full">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-500 text-sm">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                </div>
                <span className="font-extrabold text-stone-900 dark:text-white">4.9/5</span>
                <span className="text-[11px]">• 500+ CLIENTES FELICES</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF97A4]" />
                <span className="text-[11px]">CORTE HOY: 1:00 PM CST</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px]">ROSAS 100% FRESCAS</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Showcase Asimétrico Hero con Tarjetas Flotantes */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Círculo Principal con Marco Elegante */}
            <Link
              href={productLink}
              title={activeProduct.name || "Ver producto"}
              className="relative w-full max-w-[420px] aspect-square rounded-full bg-gradient-to-tr from-[#FAF7F5] via-white to-pink-50 dark:from-[#12131A] dark:via-[#181922] dark:to-[#12131A] p-4 shadow-2xl border border-stone-200/80 dark:border-gray-800 group block cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
            >
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                <img
                  alt={activeProduct.name || "Anniversary Romance Haute Floral Collection Houston"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={productImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Badge Flotante 1: Haute Handcrafted */}
              <div className="absolute -bottom-3 left-4 sm:left-8 bg-white dark:bg-[#181922] px-4 py-3 rounded-2xl shadow-xl border border-stone-200/80 dark:border-gray-700/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-[#FF97A4]/30 flex items-center justify-center text-[#B0004A] dark:text-[#FF97A4]">
                  <Award size={20} />
                </div>
                <div className="flex flex-col text-left max-w-[190px]">
                  <span className="text-[10px] uppercase tracking-widest text-[#C5A059] dark:text-[#5EEAD4] font-extrabold truncate">
                    {productBadge}
                  </span>
                  <span className="text-sm font-bold text-stone-900 dark:text-[#E6F7F0] leading-tight">
                    Desde ${productPrice} USD
                  </span>
                </div>
              </div>

              {/* Badge Flotante 2: Houston Tag */}
              <div className="absolute top-4 -right-2 sm:-right-4 bg-[#163422] text-white px-3.5 py-1.5 rounded-full shadow-lg border border-[#C5A059]/40 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <Truck size={13} className="text-[#C5A059]" />
                <span className="text-[11px]">River Oaks &amp; Galleria</span>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};
