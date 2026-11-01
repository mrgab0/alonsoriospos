"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface BentoProduct {
  _id?: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  images?: string[];
  category?: string;
}

interface BentoEditorialGridProps {
  products?: BentoProduct[];
}

export function BentoEditorialGrid({ products = [] }: BentoEditorialGridProps) {
  const t = useTranslations("Index");

  // Fallbacks elegantes por si la DB tiene menos productos
  const p0 = products[0] || {
    name: "Ramo Buchón de 100 Rosas",
    slug: "buchon-bouquet-of-100-roses",
    price: 290,
    image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=900&q=85&auto=format",
  };
  const p1 = products[1] || {
    name: "Buchón de Rosas Blancas",
    slug: "buchon-bouquet-of-white-roses",
    price: 75,
    image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&q=85&auto=format",
  };
  const p2 = products[2] || {
    name: "Buchón de Rosas Amarillas",
    slug: "buchon-yellow-rose-bouquet",
    price: 75,
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&q=85&auto=format",
  };
  const p3 = products[3] || {
    name: "Ramo Tricolor Exclusivo",
    slug: "tricolor-bouquet",
    price: 120,
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=700&q=85&auto=format",
  };

  const getImg = (p: BentoProduct) => {
    if (p.image) return p.image;
    if (p.images && p.images.length > 0) return p.images[0];
    return "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&q=80&auto=format";
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 py-14 sm:py-20 relative z-20">
      {/* Encabezado Editorial estilo Botanical Romance */}
      <div className="text-center mb-10 sm:mb-14">
        <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] inline-flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-[#D4AF37]" />
          Nuestra Colección
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
          Arreglos Florales de Autor
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto mt-3 font-medium">
          Diseños artesanales de alta floristería pensados para despertar emociones inolvidables.
        </p>
      </div>

      {/* Bento Grid Editorial */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 auto-rows-auto md:auto-rows-[310px]">
        {/* 1. Elemento Principal Grande (8 columnas x 2 filas en escritorio) */}
        <div className="md:col-span-8 md:row-span-2 relative group overflow-hidden rounded-2xl bg-stone-100 dark:bg-[#141A16] shadow-[0px_4px_25px_rgba(0,0,0,0.08)] border border-[#D4AF37]/20 min-h-[420px] md:min-h-full">
          <img
            src={getImg(p0)}
            alt={p0.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300" />
          
          <div className="absolute top-4 left-4">
            <span className="bg-[#D4AF37] text-stone-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Colección Estrella
            </span>
          </div>

          <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full text-white">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold mb-2 drop-shadow-md text-white">
              {p0.name}
            </h3>
            <p className="text-xl sm:text-2xl font-serif font-semibold text-[#ffdf92] mb-4">
              ${p0.price} <span className="text-xs text-gray-300 font-sans tracking-normal uppercase font-bold">USD</span>
            </p>
            <Link
              href={`/productos/${p0.slug}`}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-[#D4AF37] hover:text-stone-900 backdrop-blur-md border border-white/60 hover:border-[#D4AF37] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95"
            >
              <span>Ver Detalles</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 2. Tarjeta Mediana Superior Derecha (4 columnas x 1 fila) */}
        <div className="md:col-span-4 md:row-span-1 relative group overflow-hidden rounded-2xl bg-stone-100 dark:bg-[#141A16] shadow-[0px_4px_20px_rgba(0,0,0,0.06)] border border-[#D4AF37]/20 min-h-[280px]">
          <img
            src={getImg(p1)}
            alt={p1.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-[#141A16]/95 backdrop-blur-md border-t border-[#D4AF37]/20 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center">
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-white text-base leading-tight">
                {p1.name}
              </h4>
              <p className="text-sm font-bold text-[#745b0f] dark:text-[#ffdf92]">
                ${p1.price} USD
              </p>
            </div>
            <Link
              href={`/productos/${p1.slug}`}
              className="p-2 rounded-lg bg-[#163422] text-white hover:bg-[#1B2E22] transition-colors"
              title="Ver producto"
            >
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 3. Tarjeta Mediana Inferior Derecha (4 columnas x 1 fila) */}
        <div className="md:col-span-4 md:row-span-1 relative group overflow-hidden rounded-2xl bg-stone-100 dark:bg-[#141A16] shadow-[0px_4px_20px_rgba(0,0,0,0.06)] border border-[#D4AF37]/20 min-h-[280px]">
          <img
            src={getImg(p2)}
            alt={p2.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-[#141A16]/95 backdrop-blur-md border-t border-[#D4AF37]/20 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center">
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-white text-base leading-tight">
                {p2.name}
              </h4>
              <p className="text-sm font-bold text-[#745b0f] dark:text-[#ffdf92]">
                ${p2.price} USD
              </p>
            </div>
            <Link
              href={`/productos/${p2.slug}`}
              className="p-2 rounded-lg bg-[#163422] text-white hover:bg-[#1B2E22] transition-colors"
              title="Ver producto"
            >
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 4. Tarjeta Ancha Inferior Izquierda (6 columnas x 1 fila) */}
        <div className="md:col-span-6 md:row-span-1 relative group overflow-hidden rounded-2xl bg-stone-100 dark:bg-[#141A16] shadow-[0px_4px_20px_rgba(0,0,0,0.06)] border border-[#D4AF37]/20 min-h-[260px]">
          <img
            src={getImg(p3)}
            alt={p3.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex justify-between items-end">
            <div>
              <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest block mb-1">
                Destacado Floral
              </span>
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1">
                {p3.name}
              </h4>
              <p className="text-lg font-serif font-bold text-[#ffdf92]">
                ${p3.price} USD
              </p>
            </div>
            <Link
              href={`/productos/${p3.slug}`}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] text-stone-900 font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md"
            >
              Ver Arreglo
            </Link>
          </div>
        </div>

        {/* 5. Tarjeta Editorial de Pedidos Especiales (6 columnas x 1 fila) */}
        <div className="md:col-span-6 md:row-span-1 bg-stone-50 dark:bg-[#141A16] rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center text-center shadow-[0px_4px_20px_rgba(0,0,0,0.06)] border-2 border-dashed border-[#D4AF37]/50 min-h-[260px] relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 dark:bg-[#D4AF37]/25 flex items-center justify-center mb-3 text-[#745b0f] dark:text-[#ffdf92] shadow-sm">
            <Sparkles size={24} className="text-[#D4AF37]" />
          </div>
          
          <h4 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">
            Pedidos Especiales & Eventos
          </h4>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-gray-300 max-w-md mb-5 leading-relaxed font-medium">
            Creamos diseños florales personalizados a tu gusto y presupuesto para bodas, aniversarios y momentos inolvidables.
          </p>

          <a
            href="https://wa.me/13467392730?text=Hola%2C%20me%20gustar%C3%ADa%20cotizar%20un%20arreglo%20floral%20personalizado"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#163422] hover:bg-[#1B2E22] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 border border-[#D4AF37]/60"
          >
            <MessageCircle size={15} className="text-[#D4AF37]" />
            <span>Cotizar por WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
