"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useCart } from "@/components/shop/Cart/CartContext";
import { useTranslations } from "next-intl";
import { ShoppingBag, Sparkles } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  badge?: string;
  image: string;
  secondaryImage?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  slug,
  price,
  category,
  badge,
  image,
  secondaryImage
}) => {
  const { addToCart } = useCart();
  const t = useTranslations("common");
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const productHref = isSpanish ? `/es/productos/${slug}` : `/productos/${slug}`;

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

  const optimizedMainImage = optimizeImageUrl(image);
  const optimizedSecondaryImage = secondaryImage ? optimizeImageUrl(secondaryImage) : undefined;

  return (
    <div className="group relative bg-white dark:bg-[#141A16] rounded-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-stone-800 hover:border-[#FF97A4]/40 shadow-[0px_4px_20px_rgba(42,0,2,0.04)] hover:shadow-[0px_16px_36px_rgba(42,0,2,0.12)] hover:-translate-y-1 flex flex-col justify-between select-none">
      <Link
        href={productHref}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="block relative select-none"
      >
        {/* Contenedor de Imagen con Zoom suave y preservación completa del arreglo floral */}
        <div className="relative aspect-square overflow-hidden bg-[#FAFAF9] dark:bg-[#101512] p-2.5 flex items-center justify-center">
          <img
            src={optimizedMainImage}
            alt={name}
            loading="lazy"
            decoding="async"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className={`w-full h-full object-contain select-none pointer-events-none transform group-hover:scale-105 transition-all duration-700 ease-out ${
              optimizedSecondaryImage ? 'group-hover:opacity-0' : ''
            }`}
          />
          {optimizedSecondaryImage && (
            <img
              src={optimizedSecondaryImage}
              alt={`${name} - alternativa`}
              loading="lazy"
              decoding="async"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="absolute inset-0 w-full h-full object-contain p-2.5 select-none pointer-events-none transform scale-100 group-hover:scale-105 transition-all duration-700 ease-out opacity-0 group-hover:opacity-100"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Badge Flotante estilo Categoría */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs text-[#163422] dark:text-[#E6C98B] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-stone-300 dark:border-[#C5A059]/30 shadow-md max-w-[130px] sm:max-w-[150px] truncate block">
              {category}
            </span>
          </div>

          {/* Insignia / Badge Personalizada */}
          {badge && (
            <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
              <span className="bg-[#163422]/95 dark:bg-[#163422]/95 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-[#D4AF37] flex items-center gap-1 max-w-[140px] truncate">
                <Sparkles size={10} className="text-[#D4AF37] shrink-0" />
                <span className="truncate">{badge}</span>
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow bg-white dark:bg-[#141A16]">
        <div>
          <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-[#163422] dark:group-hover:text-[#FF97A4] transition-colors mb-1 line-clamp-1">
            <Link
              href={productHref}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              {name}
            </Link>
          </h3>
          
          {/* Calificación de 5 estrellas estilo flor.zip */}
          <div className="flex items-center text-[11px] text-amber-500 mb-2">
            <span>★★★★★</span>
            <span className="text-stone-400 dark:text-gray-400 ml-1.5 text-[10px] font-medium">(5.0)</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 dark:border-gray-800/80 mt-auto">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-gray-400 block font-semibold">{isSpanish ? "Desde" : "From"}</span>
            <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-[#E6C98B] font-serif">${price.toFixed(2)} USD</span>
          </div>

          <button 
            onClick={() => addToCart({ id, name, price, image })}
            className="bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1F452E] text-white dark:text-white border border-transparent dark:border-[#C5A059]/40 px-3 sm:px-3.5 py-2 rounded-lg active:scale-95 transition-all duration-300 font-bold text-xs shadow-sm flex items-center gap-1.5 hover:scale-105"
            title={isSpanish ? "Añadir al Carrito" : "Add to Cart"}
          >
            <ShoppingBag size={13} />
            <span className="hidden sm:inline">{t('addToCart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
