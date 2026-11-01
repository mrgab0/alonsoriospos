"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { Footer } from "@/components/shop/Footer";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Check,
  MessageCircle,
  Gift,
  Sparkles,
  MapPin,
  Heart
} from "lucide-react";

interface BlogPostDetailProps {
  post: any;
  locale?: string;
}

export function BlogPostDetail({ post, locale = "es" }: BlogPostDetailProps) {
  const [copied, setCopied] = useState(false);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] dark:bg-[#0D110F] text-stone-900 dark:text-[#FFFFFF] flex flex-col">
        <ShopHeader />
        <main className="nosotros-page-root flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-serif font-black text-stone-900 dark:text-[#FFFFFF]">Artículo no encontrado</h1>
            <p className="text-sm text-stone-700 dark:text-[#CBD5E1] font-semibold">El post que buscas no existe o fue movido.</p>
            <Link
              href="/nosotros"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#163422] text-white rounded-full text-xs font-bold hover:bg-[#1B2E22] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a Nosotros & Blog</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`Mira este artículo de Bonbon Flowers: ${post.title} ` + (typeof window !== "undefined" ? window.location.href : ""))}`;

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

  // Función auxiliar para parsear negritas, cursivas y enlaces inline en el texto
  const renderInlineFormattedText = (text: string) => {
    if (!text) return "";
    const parts: (string | React.ReactNode)[] = [];
    const tokenRegex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        // Limpiamos cualquier asterisco huérfano del texto regular
        parts.push(text.substring(lastIndex, match.index).replace(/\*\*/g, ''));
      }

      const token = match[0];
      if (token.startsWith('***') && token.endsWith('***')) {
        parts.push(
          <strong key={match.index} className="font-extrabold italic text-stone-900 dark:text-[#FFFFFF]">
            {token.slice(3, -3).replace(/\*\*/g, '')}
          </strong>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-extrabold text-stone-900 dark:text-[#FFFFFF]">
            {token.slice(2, -2).replace(/\*\*/g, '')}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-stone-800 dark:text-[#CBD5E1] font-semibold">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('[') && token.includes('](')) {
        const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          const isInternal = url.startsWith('/');
          parts.push(
            isInternal ? (
              <Link
                key={match.index}
                href={url}
                className="text-[#163422] dark:text-[#E6C98B] font-extrabold underline hover:text-[#0f2417] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {label.replace(/\*\*/g, '')}
              </Link>
            ) : (
              <a
                key={match.index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#163422] dark:text-[#E6C98B] font-extrabold underline hover:text-[#0f2417] dark:hover:text-[#2DD4BF] transition-colors"
              >
                {label.replace(/\*\*/g, '')}
              </a>
            )
          );
        } else {
          parts.push(token.replace(/\*\*/g, ''));
        }
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex).replace(/\*\*/g, ''));
    }

    return parts.length > 0 ? parts : text.replace(/\*\*/g, '');
  };

  // Formatear markdown básico a HTML seguro y estructurado
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Normalizar saltos de línea para aislar títulos y divisores
    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\n---\n/g, '\n\n---\n\n');

    const paragraphs = normalized.split(/\n\n+/);

    return (
      <div className="space-y-6 text-stone-800 dark:text-[#CBD5E1] text-sm sm:text-base leading-relaxed">
        {paragraphs.map((para, i) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Separador horizontal (--- o ***)
          if (trimmed === '---' || trimmed === '***') {
            return (
              <div key={i} className="py-2">
                <hr className="border-t-2 border-stone-200 dark:border-stone-800" />
              </div>
            );
          }

          // Subtítulo H2 (## o pregunta/título destacado sin prefijo)
          const isExplicitH2 = trimmed.startsWith("## ");
          const isAutoH2 = !isExplicitH2 && trimmed.length < 85 && (trimmed.startsWith("¿") || trimmed.endsWith("?") || /^(principales|beneficios|del laboratorio|ordena|como cuidar|guia|celebrating|the art|how to|about|order your)/i.test(trimmed)) && !trimmed.includes('\n');
          
          if (isExplicitH2 || isAutoH2) {
            const headingText = isExplicitH2 ? trimmed.replace(/^##\s*/, "") : trimmed;
            return (
              <h2
                key={i}
                className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-[#FFFFFF] pt-6 pb-2 border-b-2 border-stone-200 dark:border-stone-800 tracking-tight"
              >
                {renderInlineFormattedText(headingText)}
              </h2>
            );
          }

          // Subtítulo H3 (###)
          if (trimmed.startsWith("### ")) {
            return (
              <h3
                key={i}
                className="text-lg sm:text-xl font-serif font-black text-stone-900 dark:text-[#FFFFFF] pt-4 pb-1"
              >
                {renderInlineFormattedText(trimmed.replace(/^###\s*/, ""))}
              </h3>
            );
          }

          // Blockquote (>)
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote
                key={i}
                className="p-4 sm:p-5 my-4 bg-stone-100 dark:bg-stone-900/80 rounded-2xl border-l-4 border-[#163422] dark:border-[#E6C98B] text-stone-800 dark:text-[#CBD5E1] font-semibold italic shadow-xs"
              >
                {renderInlineFormattedText(trimmed.replace(/^>\s*/, ""))}
              </blockquote>
            );
          }

          // Lista numerada (1. , 2. ) con tarjetas destacadas para variedades o pasos
          if (/^\d+\.\s+/.test(trimmed)) {
            const items = trimmed.split(/\n(?=\d+\.\s+)/).filter((l) => l.trim().length > 0);
            return (
              <div key={i} className="space-y-3.5 my-4">
                {items.map((item, idx) => {
                  const numberMatch = item.match(/^(\d+)\.\s+([\s\S]*)/);
                  const num = numberMatch ? numberMatch[1] : (idx + 1);
                  const body = numberMatch ? numberMatch[2] : item;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-[#E6C98B]/50 transition-colors"
                    >
                      <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#163422] dark:bg-[#E6C98B] text-white dark:text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                        {num}
                      </span>
                      <div className="flex-1 font-medium text-stone-800 dark:text-[#CBD5E1] text-sm sm:text-base leading-relaxed">
                        {renderInlineFormattedText(body)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Bloque con viñetas o líneas que comienzan en negrita (**Poder...**)
          const sublines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
          const isBoldListBlock = sublines.length > 1 && sublines.some(l => l.startsWith('**') || l.startsWith('- ') || l.startsWith('* '));
          
          if (isBoldListBlock) {
            return (
              <div key={i} className="space-y-3 my-4">
                {sublines.map((sub, idx) => {
                  const cleanItem = sub.replace(/^[-*]\s*/, "");
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-[#E6C98B]/40 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#163422] dark:bg-[#E6C98B] mt-2 shrink-0 shadow-xs" />
                      <div className="flex-1 font-medium text-stone-800 dark:text-[#CBD5E1] text-sm sm:text-base leading-relaxed">
                        {renderInlineFormattedText(cleanItem)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // Lista de viñetas simples (-)
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const items = trimmed.split(/\n/).filter((l) => l.trim().length > 0);
            return (
              <ul key={i} className="space-y-2.5 my-3 pl-4 list-disc marker:text-[#163422] dark:marker:text-[#E6C98B]">
                {items.map((it, idx) => {
                  const cleanItem = it.replace(/^[-*]\s*/, "");
                  return (
                    <li key={idx} className="font-semibold text-stone-800 dark:text-[#CBD5E1]">
                      {renderInlineFormattedText(cleanItem)}
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Imagen en Markdown: ![alt](url)
          const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imgMatch) {
            const [, alt, src] = imgMatch;
            return (
              <figure key={i} className="my-6 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
                <img
                  src={src}
                  alt={alt || "Arreglo Floral Bonbon Flowers"}
                  className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300"
                  loading="lazy"
                />
                {alt && (
                  <figcaption className="text-center text-xs text-stone-500 dark:text-[#94A3B8] py-2.5 px-4 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 italic">
                    {alt}
                  </figcaption>
                )}
              </figure>
            );
          }

          // Párrafo normal (con detección de imagen inline si estuviese combinada)
          if (trimmed.includes("![") && trimmed.includes("](") && trimmed.includes(")")) {
            const inlineMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
            if (inlineMatch) {
              const [, alt, src] = inlineMatch;
              return (
                <figure key={i} className="my-6 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
                  <img
                    src={src}
                    alt={alt || "Arreglo Floral Bonbon Flowers"}
                    className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300"
                    loading="lazy"
                  />
                  {alt && (
                    <figcaption className="text-center text-xs text-stone-500 dark:text-[#94A3B8] py-2.5 px-4 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 italic">
                      {alt}
                    </figcaption>
                  )}
                </figure>
              );
            }
          }

          // Si el párrafo tiene saltos de línea simples, respetamos cada línea
          if (trimmed.includes('\n')) {
            const simpleLines = trimmed.split('\n').filter((l) => l.trim().length > 0);
            return (
              <div key={i} className="space-y-3 font-medium text-stone-800 dark:text-[#CBD5E1] leading-relaxed">
                {simpleLines.map((l, lIdx) => (
                  <p key={lIdx}>
                    {renderInlineFormattedText(l)}
                  </p>
                ))}
              </div>
            );
          }

          return (
            <p key={i} className="font-medium text-stone-800 dark:text-[#CBD5E1] leading-relaxed">
              {renderInlineFormattedText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };


  const isEn = locale === "en" || post.language === "en";

  return (
    <div className="min-h-screen bg-[#FDFBF9] dark:bg-[#0D110F] text-stone-900 dark:text-[#FFFFFF] flex flex-col transition-colors duration-300">
      <ShopHeader />

      {/* Structured Data JSON-LD para Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: cleanExcerpt(post.excerpt) || post.title,
            image: post.mainImage || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200",
            author: {
              "@type": "Organization",
              name: "Bonbon Flowers Houston"
            },
            publisher: {
              "@type": "Organization",
              name: "Bonbon Flowers Houston",
              logo: {
                "@type": "ImageObject",
                url: "https://bonbonflowershouston.com/logo.png"
              }
            },
            datePublished: post.createdAt || new Date().toISOString()
          })
        }}
      />

      <main className="nosotros-page-root flex-1 py-10 md:py-16">
        <article className="max-w-4xl w-full mx-auto px-4 sm:px-6 space-y-8">
          
          {/* Navegación de Regreso */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href={isEn ? "/nosotros" : "/es/nosotros"}
              className="inline-flex items-center gap-2 text-xs font-black text-stone-700 dark:text-[#E6C98B] hover:text-[#163422] dark:hover:text-[#2DD4BF] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>{isEn ? "Back to About & Blog" : "Volver a Nosotros & Blog"}</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-[#FFFFFF] hover:bg-stone-200 dark:hover:bg-stone-700 transition-all text-xs font-bold flex items-center gap-1.5"
                title={isEn ? "Copy link" : "Copiar enlace"}
              >
                {copied ? <Check size={14} className="text-emerald-500 dark:text-[#E6C98B]" /> : <Share2 size={14} />}
                <span className="hidden sm:inline">{copied ? (isEn ? "Copied!" : "¡Copiado!") : (isEn ? "Share" : "Compartir")}</span>
              </button>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#E6C98B] hover:bg-emerald-100 transition-all text-xs font-bold flex items-center gap-1.5"
                title="WhatsApp"
              >
                <MessageCircle size={14} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Encabezado del Post */}
          <header className="space-y-4 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-[#E6C98B]/20 text-[#163422] dark:text-[#E6C98B] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles size={13} className="text-[#163422] dark:text-[#E6C98B]" />
              <span>{isEn ? "Floral Boutique & Insights" : "Boutique Floral & Consejos"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-stone-900 dark:text-[#FFFFFF] leading-tight tracking-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-sm sm:text-base text-stone-700 dark:text-[#CBD5E1] font-semibold leading-relaxed max-w-2xl mx-auto">
                {cleanExcerpt(post.excerpt)}
              </p>
            )}

            <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-bold text-stone-500 dark:text-[#94A3B8] pt-1">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-[#163422] dark:text-[#E6C98B]" />
                {new Date(post.createdAt || Date.now()).toLocaleDateString(isEn ? "en-US" : "es-ES", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-stone-500 dark:text-[#94A3B8]" />
                {isEn ? "3 min read" : "3 min de lectura"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-emerald-600 dark:text-[#E6C98B]" />
                Houston, TX
              </span>
            </div>
          </header>

          {/* Imagen Principal del Artículo */}
          {post.mainImage && (
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 h-72 sm:h-96 md:h-[420px] bg-gray-100 dark:bg-gray-800">
              <img
                src={post.mainImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Contenido Completo del Artículo */}
          <div className="bg-white dark:bg-[#141A16] p-6 sm:p-10 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
            {renderFormattedContent(post.content)}
          </div>

          {/* CAJA DE ACCIÓN / COMPRA RELACIONADA */}
          <div className="bg-stone-50 dark:bg-[#141A16] p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-[#E6C98B]/20 shadow-md space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#163422] dark:bg-[#E6C98B] text-white dark:text-stone-950 flex items-center justify-center mx-auto shadow-md">
              <Gift size={22} />
            </div>
            <h3 className="text-2xl font-serif font-black text-stone-900 dark:text-[#FFFFFF]">
              {isEn ? "Ready to Order Luxury Flowers in Houston?" : "¿Listo para Enviar Flores de Lujo en Houston?"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-[#CBD5E1] max-w-lg mx-auto font-medium">
              {isEn 
                ? "Explore our exclusive collection of luxury rose bouquets, signature hatboxes, and custom designs with prompt same-day delivery."
                : "Explora nuestra exclusiva colección de ramos buchones, rosas de exportación y cajas personalizadas con entrega el mismo día."
              }
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
              <Link
                href={isEn ? "/productos" : "/es/productos"}
                className="px-6 py-3 rounded-full bg-[#163422] hover:bg-[#1B2E22] text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                {isEn ? "Explore Flower Catalog" : "Ver Catálogo de Flores"}
              </Link>
              <a
                href={`https://wa.me/13467392730?text=${encodeURIComponent(isEn ? `Hello! I just read your article "${post.title}" and would like to order a flower arrangement.` : `¡Hola! Leí su artículo sobre "${post.title}" y quisiera cotizar un arreglo floral.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <MessageCircle size={15} />
                <span>{isEn ? "Order via WhatsApp" : "Ordenar por WhatsApp"}</span>
              </a>
            </div>
          </div>

        </article>
      </main>

      <Footer />
    </div>
  );
}
