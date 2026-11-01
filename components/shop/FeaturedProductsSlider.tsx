"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, Flame, Star } from "lucide-react";
import { useCart } from "@/components/shop/Cart/CartContext";
import { useTranslations } from "next-intl";

interface FeaturedProductsSliderProps {
  products: any[];
}

export function FeaturedProductsSlider({ products }: FeaturedProductsSliderProps) {
  const [activeTab, setActiveTab] = useState("TODOS");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const t = useTranslations("common");

  const tabs = [
    { id: "TODOS", label: "Todos", filter: () => true },
    { id: "POPULARES", label: "Más Vendidos 🔥", filter: (p: any) => p.badge || p.isFeatured },
    { id: "ROSAS", label: "Rosas de Lujo", filter: (p: any) => p.category?.toLowerCase().includes("rosa") || p.name?.toLowerCase().includes("rosa") },
    { id: "BOUQUETS", label: "Bouquets & Cajas", filter: (p: any) => p.category?.toLowerCase().includes("bouquet") || p.category?.toLowerCase().includes("caja") },
  ];

  const optimizeImageUrl = (url: string) => {
    if (!url) return "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80&auto=format";
    if (url.includes("ik.imagekit.io") && !url.includes("tr=")) {
      return url.includes("?") ? `${url}&tr=w-400,q-80,f-auto` : `${url}?tr=w-400,q-80,f-auto`;
    }
    if (url.includes("images.unsplash.com") && !url.includes("w=")) {
      return `${url}${url.includes("?") ? "&" : "?"}w=400&q=80&auto=format`;
    }
    return url;
  };

  const activeFilter = tabs.find(tab => tab.id === activeTab)?.filter || (() => true);
  let filteredProducts = products.filter(activeFilter);
  if (filteredProducts.length === 0) {
    filteredProducts = products; // Fallback para mostrar siempre productos
  }

  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isMouseDown.current = true;
    isDragging.current = false;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftPos.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.scrollSnapType = "none";
    scrollContainerRef.current.style.scrollBehavior = "auto";
  };

  const handleMouseLeaveOrUp = () => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = "";
      scrollContainerRef.current.style.scrollBehavior = "";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = x - startX.current;
    if (Math.abs(walk) > 5) {
      isDragging.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = false;
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 relative z-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Encabezado con Título y Controles */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-4 border-b border-[#D4AF37]/20">
          <div>
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <Sparkles size={14} className="text-[#C5A059] dark:text-[#E6C98B]" />
              <span className="text-[#163422] dark:text-[#E6C98B] text-xs font-black uppercase tracking-[0.2em]">
                Selección de Temporada
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-white tracking-tight text-center md:text-left">
              Nuestros Productos Destacados
            </h2>
          </div>

          {/* Pestañas de Filtrado */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-[#163422] text-white shadow-md scale-105"
                    : "bg-white/70 dark:bg-stone-900/80 text-slate-700 dark:text-gray-300 hover:bg-white dark:hover:bg-stone-800 border border-gray-200/60 dark:border-stone-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Flechas de Navegación del Carrusel */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => handleScroll("left")}
              className="p-2.5 rounded-full bg-white dark:bg-stone-900 text-stone-900 dark:text-white hover:bg-[#163422] hover:text-white dark:hover:bg-[#163422] shadow-md border border-gray-100 dark:border-stone-700 transition-all active:scale-95"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="p-2.5 rounded-full bg-white dark:bg-stone-900 text-stone-900 dark:text-white hover:bg-[#163422] hover:text-white dark:hover:bg-[#163422] shadow-md border border-gray-100 dark:border-stone-700 transition-all active:scale-95"
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Carrusel Deslizable */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className="flex items-stretch gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden select-none"
          style={{ scrollbarWidth: "none" }}
        >
          {filteredProducts.map((product: any) => {
            const rawImage = product.images && product.images.length > 0 ? product.images[0] : "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400";
            const rawSecondary = product.images && product.images.length > 1 ? product.images[1] : undefined;
            const image = optimizeImageUrl(rawImage);
            const secondaryImage = rawSecondary ? optimizeImageUrl(rawSecondary) : undefined;
            return (
              <div
                key={product._id.toString()}
                className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start group relative bg-white dark:bg-[#141A16] rounded-2xl overflow-hidden border border-gray-100 dark:border-stone-800 shadow-[0_6px_20px_rgba(42,0,2,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_36px_rgba(42,0,2,0.15)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
              >
                {/* Imagen del Producto */}
                <Link
                  href={`/productos/${product.slug}`}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="block relative aspect-square overflow-hidden bg-gray-50 dark:bg-[#101512] select-none"
                >
                  <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className={`w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-all duration-700 ${
                      secondaryImage ? 'group-hover:opacity-0' : ''
                    }`}
                  />
                  {secondaryImage && (
                    <img
                      src={secondaryImage}
                      alt={`${product.name} - alternativa`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transform scale-100 group-hover:scale-105 transition-all duration-700 ease-out opacity-0 group-hover:opacity-100"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Badge de Categoría */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs text-[#163422] dark:text-[#E6C98B] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-stone-300 dark:border-stone-700 max-w-[130px] sm:max-w-[150px] truncate block">
                      {product.category || "Boutique"}
                    </span>
                  </div>

                  {/* Badge Destacado */}
                  {product.badge && (
                    <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                      <span className="bg-[#163422]/95 dark:bg-[#163422]/95 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-[#D4AF37] flex items-center gap-1 max-w-[140px] truncate">
                        <Flame size={10} className="text-amber-300 shrink-0" />
                        <span className="truncate">{product.badge}</span>
                      </span>
                    </div>
                  )}
                </Link>

                {/* Contenido & Precio */}
                <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" stroke="none" />
                      ))}
                      <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold ml-1">5.0</span>
                    </div>

                    <Link
                      href={`/productos/${product.slug}`}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white line-clamp-1 group-hover:text-[#163422] dark:group-hover:text-[#E6C98B] transition-colors select-none">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  {/* Precio y Botón de Carrito */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 block font-bold uppercase tracking-wider">Precio</span>
                      <span className="text-lg font-black text-stone-900 dark:text-[#E6C98B]">
                        ${product.price ? product.price.toFixed(2) : "0.00"}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart({
                        id: product._id.toString(),
                        name: product.name,
                        price: product.price,
                        image: image
                      })}
                      className="inline-flex items-center gap-1.5 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1F452E] text-white dark:text-white border border-transparent dark:border-[#C5A059]/40 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                      <ShoppingBag size={14} />
                      <span>{t("addToCart") || "Agregar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
