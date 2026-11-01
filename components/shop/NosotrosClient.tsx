"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { Footer } from "@/components/shop/Footer";
import {
  Sparkles,
  Heart,
  Truck,
  ShieldCheck,
  Calendar,
  ArrowRight,
  MessageCircle,
  BookOpen,
  MapPin,
  Clock,
  Gift
} from "lucide-react";

interface NosotrosClientProps {
  initialPosts: any[];
  locale?: string;
}

export function NosotrosClient({ initialPosts = [], locale = "es" }: NosotrosClientProps) {
  const [selectedTag, setSelectedTag] = useState("all");
  const isEn = locale === "en";

  const cleanExcerpt = (text: string) => {
    if (!text) return "";
    return text
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^[-*]\s+/gm, "")
      .trim();
  };

  const tags = isEn
    ? [
        { id: "all", label: "All Articles" },
        { id: "guides", label: "Floral Guides" },
        { id: "anniversaries", label: "Anniversaries & Romance" },
        { id: "care", label: "Flower Care" }
      ]
    : [
        { id: "all", label: "Todos los Artículos" },
        { id: "guias", label: "Guías Florales" },
        { id: "aniversarios", label: "Aniversarios & Amor" },
        { id: "cuidados", label: "Cuidado de Flores" }
      ];

  const filteredPosts = initialPosts.filter((post) => {
    if (selectedTag === "all") return true;
    const search = selectedTag.toLowerCase();
    return (
      post.title?.toLowerCase().includes(search) ||
      post.excerpt?.toLowerCase().includes(search) ||
      post.content?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-[#FDFBF9] dark:bg-[#0B0C10] text-stone-900 dark:text-[#FFFFFF] flex flex-col transition-colors duration-300">
      <ShopHeader />

      <main className="nosotros-page-root flex-1">
        
        {/* HERO EDITORIAL: HISTORIA DE BONBON FLOWERS HOUSTON */}
        <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-[#fff0ef]/60 via-transparent to-transparent dark:from-[#141A16]/60 dark:via-transparent dark:to-transparent border-b border-[#D4AF37]/20">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              
              {/* Kicker */}
              <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-900/80 text-[#163422] dark:text-[#E6C98B] border border-[#D4AF37]/40 dark:border-[#E6C98B]/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm">
                <Sparkles size={13} className="text-[#163422] dark:text-[#E6C98B]" />
                <span>{isEn ? "Floral Boutique & Storytelling" : "Boutique Floral & Storytelling"}</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-stone-900 dark:text-[#FFFFFF] tracking-tight leading-tight">
                {isEn ? "Details That Enchant" : "Detalles que Enamoran"}
              </h1>

              {/* Resumen de Historia */}
              <p className="text-base sm:text-lg text-stone-700 dark:text-[#CBD5E1] leading-relaxed font-medium pt-2">
                {isEn ? (
                  <>
                    At <strong className="font-bold text-stone-900 dark:text-[#FFFFFF]">Bonbon Flowers Houston</strong>, we were born in Houston, Texas with a single mission: to transform every emotion into an unforgettable floral work of art. We handpick the freshest premium export roses to craft luxury buchón bouquets, signature boxes, and exclusive arrangements that celebrate life, love, and timeless memories.
                  </>
                ) : (
                  <>
                    En <strong className="font-bold text-stone-900 dark:text-[#FFFFFF]">Bonbon Flowers Houston</strong>, nacimos en Houston, Texas con un solo propósito: transformar cada sentimiento en una obra de arte floral inolvidable. Seleccionamos las rosas y flores más frescas de exportación para confeccionar ramos buchones, cajas de lujo y arreglos exclusivos que celebran la vida, el amor y los momentos que perduran.
                  </>
                )}
              </p>

              <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-bold text-stone-500 dark:text-[#94A3B8] pt-2">
                <span className="flex items-center gap-1">
                  <MapPin size={15} className="text-[#163422] dark:text-[#E6C98B]" /> Houston, TX
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={15} className="text-stone-500 dark:text-[#94A3B8]" /> {isEn ? "Same-Day Delivery" : "Entrega el Mismo Día"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Heart size={15} className="text-[#163422] dark:text-[#E6C98B]" /> {isEn ? "Master Florists" : "Floristas Expertos"}
                </span>
              </div>

            </div>

            {/* 3 PILARES DE LA BOUTIQUE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-14">
              
              <div className="bg-white/80 dark:bg-[#141A16]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-[#E6C98B]/20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-[#E6C98B]/40 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-emerald-950/60 text-[#163422] dark:text-[#E6C98B] flex items-center justify-center mb-4 shadow-sm border border-stone-200 dark:border-[#E6C98B]/30">
                  <Heart size={24} />
                </div>
                <h3 className="font-serif font-black text-lg text-stone-900 dark:text-[#FFFFFF] mb-2">
                  {isEn ? "Unmatched Freshness" : "Frescura Incomparable"}
                </h3>
                <p className="text-xs text-stone-600 dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {isEn
                    ? "Freshly handpicked roses and foliage daily to ensure firm petals, vibrant colors, and long-lasting vase life."
                    : "Rosas y follajes seleccionados a mano todos los días para asegurar pétalos firmes, colores vibrantes y una duración prolongada."}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-[#141A16]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-[#E6C98B]/20 shadow-[0_4px_20px_rgba(42,0,2,0.05)] hover:shadow-lg hover:border-[#E6C98B]/40 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-[#E6C98B] flex items-center justify-center mb-4 shadow-sm border border-teal-100 dark:border-[#E6C98B]/30">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-serif font-black text-lg text-stone-900 dark:text-[#FFFFFF] mb-2">
                  {isEn ? "Haute Floral Couture" : "Diseño de Alta Floristería"}
                </h3>
                <p className="text-xs text-stone-600 dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {isEn
                    ? "Imposing buchón bouquets, glittering crowns, decorative butterflies, luxury round boxes, and bespoke inscriptions with every order."
                    : "Ramos buchones de impacto, coronas brillantes, mariposas decorativas, cajas redondas de lujo y dedicatorias exclusivas en cada pedido."}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-[#141A16]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-[#E6C98B]/20 shadow-[0_4px_20px_rgba(42,0,2,0.05)] hover:shadow-lg hover:border-[#E6C98B]/40 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#E6C98B] flex items-center justify-center mb-4 shadow-sm border border-emerald-100 dark:border-[#E6C98B]/30">
                  <Truck size={24} />
                </div>
                <h3 className="font-serif font-black text-lg text-stone-900 dark:text-[#FFFFFF] mb-2">
                  {isEn ? "Punctual Delivery" : "Envíos y Puntualidad"}
                </h3>
                <p className="text-xs text-stone-600 dark:text-[#CBD5E1] leading-relaxed font-medium">
                  {isEn
                    ? "Prompt same-day delivery across Houston, Pearland, Sugar Land, Katy, and metropolitan areas with real-time tracking."
                    : "Cobertura puntual en Houston, Pearland y zonas metropolitanas con seguimiento en vivo de tu envío."}
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECCIÓN BLOG EDITORIAL & CONSEJOS FLORALES */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            {/* Cabecera del Blog */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-[#E6C98B]/20 text-[#163422] dark:text-[#E6C98B] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <BookOpen size={14} className="text-[#163422] dark:text-[#E6C98B]" />
                  <span>{isEn ? "Blog & Floral Insights" : "Blog & Consejos Florales"}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-[#FFFFFF]">
                  {isEn ? "Stories, Guides & Trends" : "Historias, Guías y Tendencias"}
                </h2>
                <p className="text-sm text-stone-600 dark:text-[#CBD5E1] font-semibold max-w-xl">
                  {isEn
                    ? "Learn how to choose and care for fresh luxury flowers with advice from our professional Texas florists."
                    : "Aprende a elegir y cuidar tus flores con los consejos de nuestros floristas profesionales en Texas."}
                </p>
              </div>

              {/* Filtros de Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(tag.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap border ${
                      selectedTag === tag.id
                        ? "bg-[#163422] dark:bg-[#163422] text-white dark:text-white border-[#163422] dark:border-[#E6C98B]/50 shadow-sm"
                        : "bg-white dark:bg-stone-900 text-stone-800 dark:text-[#CBD5E1] border-stone-200 dark:border-stone-800 hover:border-[#E6C98B]/40 hover:text-[#163422] dark:hover:text-[#E6C98B]"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID DE POSTS */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#141A16] rounded-3xl border border-stone-200 dark:border-stone-800 p-8">
                <p className="text-sm font-bold text-stone-700 dark:text-[#CBD5E1]">
                  {isEn ? "No articles available in this category at the moment." : "No hay artículos en esta categoría en este momento."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article
                    key={post.slug || post._id}
                    className="bg-white dark:bg-[#141A16] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-[#E6C98B]/40 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Imagen del Post */}
                    <Link href={isEn ? `/nosotros/${post.slug}` : `/es/nosotros/${post.slug}`} className="relative h-56 overflow-hidden block bg-stone-100 dark:bg-stone-800">
                      <img
                        src={post.mainImage || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#1A1C1C]/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                          {isEn ? "Floral Boutique" : "Boutique Floral"}
                        </span>
                      </div>
                    </Link>

                    {/* Contenido de la Tarjeta */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-[#94A3B8] font-bold">
                          <Calendar size={13} className="text-[#163422] dark:text-[#E6C98B]" />
                          <span>{new Date(post.createdAt || Date.now()).toLocaleDateString(isEn ? "en-US" : "es-ES", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <span>•</span>
                          <span>{isEn ? "3 min read" : "3 min de lectura"}</span>
                        </div>

                        <Link href={isEn ? `/nosotros/${post.slug}` : `/es/nosotros/${post.slug}`}>
                          <h3 className="font-serif font-black text-lg text-stone-900 dark:text-[#FFFFFF] group-hover:text-[#163422] dark:group-hover:text-[#E6C98B] transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-stone-600 dark:text-[#CBD5E1] line-clamp-3 leading-relaxed font-medium">
                          {cleanExcerpt(post.excerpt) || cleanExcerpt(post.content?.slice(0, 140))}
                        </p>
                      </div>

                      {/* Botón Leer Más */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                        <Link
                          href={isEn ? `/nosotros/${post.slug}` : `/es/nosotros/${post.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-black text-stone-800 dark:text-[#E6C98B] hover:text-[#163422] dark:hover:text-[#2DD4BF] group-hover:translate-x-1 transition-transform"
                        >
                          <span>{isEn ? "Read Full Article" : "Leer Artículo Completo"}</span>
                          <ArrowRight size={14} className="text-[#163422] dark:text-[#E6C98B]" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* CTA FINAL DE COMPRA / COTIZACIÓN */}
        <section className="py-14 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 dark:from-[#141A16] dark:via-[#161822] dark:to-[#141A16] border-t border-[#D4AF37]/20">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-[#FFFFFF]">
              {isEn ? "Looking to Surprise with a Bespoke Floral Arrangement?" : "¿Deseas Sorprender con un Arreglo Personalizado?"}
            </h2>
            <p className="text-sm text-stone-600 dark:text-[#CBD5E1] max-w-xl mx-auto font-medium leading-relaxed">
              {isEn
                ? "Browse our exclusive online catalog with same-day delivery in Houston, TX or contact our floral designers to create a custom arrangement."
                : "Conoce nuestro catálogo con entregas en Houston, TX o comunícate directamente con nuestros floristas para diseñar un ramo a tu medida."}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
              <Link
                href={isEn ? "/productos" : "/es/productos"}
                className="bg-[#163422] hover:bg-[#1B2E22] text-white px-7 py-3.5 rounded-full font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Gift size={16} />
                <span>{isEn ? "Explore Flower Catalog" : "Explorar Catálogo de Flores"}</span>
              </Link>
              <a
                href={isEn ? "https://wa.me/13467392730?text=Hello!%20I%20am%20visiting%20your%20About%20page%20and%20would%20like%20to%20order%20a%20custom%20flower%20arrangement." : "https://wa.me/13467392730?text=¡Hola!%20Leí%20su%20página%20de%20Nosotros%20y%20quisiera%20cotizar%20un%20arreglo%20floral%20personalizado."}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 rounded-full font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <MessageCircle size={16} />
                <span>{isEn ? "Chat on WhatsApp (+1 346 739 2730)" : "Hablar por WhatsApp (+1 346 739 2730)"}</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
