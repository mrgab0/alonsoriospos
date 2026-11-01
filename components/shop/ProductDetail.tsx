"use client";

import { useState, useCallback, useMemo, startTransition } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { AddonSelection } from "@/components/shop/AddonSelection";
import { ShopHeader } from "@/components/shop/ShopHeader";
import {
  CheckCircle2, Flower2, Package, Sparkles, ShieldCheck, Truck, Tag,
  ArrowDown, Palette, Layers, Plus, Minus, Check, Heart
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  translateProductDescription,
  translateFeatureLabel,
  translateFloralSentence,
} from "@/lib/utils/productTranslator";

interface StemTier {
  label: string;
  stems: number;
  price: number;
}

const COLOR_SWATCHES: Record<string, { bg: string; border?: string; text?: string }> = {
  // Paleta oficial de rosas Bonbon Flowers
  "Deep Purple": { bg: "#4a154b", text: "#ffffff" },
  "deep purple": { bg: "#4a154b", text: "#ffffff" },
  "Light Pink": { bg: "#fbcfe8", border: "#f472b6", text: "#831843" },
  "light pink": { bg: "#fbcfe8", border: "#f472b6", text: "#831843" },
  "White": { bg: "#ffffff", border: "#cbd5e1", text: "#0f172a" },
  "white": { bg: "#ffffff", border: "#cbd5e1", text: "#0f172a" },
  "Be Sweet": { bg: "#be185d", text: "#ffffff" },
  "be sweet": { bg: "#be185d", text: "#ffffff" },
  "Sweet Beat": { bg: "#be185d", text: "#ffffff" },
  "sweet beat": { bg: "#be185d", text: "#ffffff" },
  "Red": { bg: "#b91c1c", text: "#ffffff" },
  "red": { bg: "#b91c1c", text: "#ffffff" },
  "Hot Pink": { bg: "#ec4899", text: "#ffffff" },
  "hot pink": { bg: "#ec4899", text: "#ffffff" },

  // Preservación de variantes históricas
  "Rojo Pasión": { bg: "#991b1b", text: "#ffffff" },
  "Rojo": { bg: "#b91c1c", text: "#ffffff" },
  "Rosa Empolvado": { bg: "#fbcfe8", border: "#f472b6", text: "#831843" },
  "Rosa Pastel": { bg: "#fbcfe8", border: "#f472b6", text: "#831843" },
  "Rosa": { bg: "#f472b6", text: "#ffffff" },
  "Blanco Puro": { bg: "#ffffff", border: "#cbd5e1", text: "#0f172a" },
  "Blanco": { bg: "#ffffff", border: "#cbd5e1", text: "#0f172a" },
  "Amarillo Dorado": { bg: "#fef08a", border: "#eab308", text: "#713f12" },
  "Amarillo Sol": { bg: "#fef08a", border: "#eab308", text: "#713f12" },
  "Amarillo": { bg: "#facc15", text: "#713f12" },
  "Negro Couture": { bg: "#18181b", text: "#ffffff" },
  "Negro Velvet": { bg: "#18181b", text: "#ffffff" },
  "Negro": { bg: "#09090b", text: "#ffffff" },
  "Bicolor Romance": { bg: "linear-gradient(135deg, #be123c 50%, #fbcfe8 50%)", border: "#f472b6", text: "#ffffff" },
  "Azul Real": { bg: "#1d4ed8", text: "#ffffff" },
  "Lavanda / Lila": { bg: "#e9d5ff", border: "#c084fc", text: "#581c87" },
  "Lila": { bg: "#e9d5ff", border: "#c084fc", text: "#581c87" },
  "Durazno / Peach": { bg: "#fed7aa", border: "#fb923c", text: "#7c2d12" },
};

const DEFAULT_ROSE_COLORS = [
  "Red",
  "Deep Purple",
  "Light Pink",
  "White",
  "Be Sweet",
  "Hot Pink",
];

export const ProductDetail = ({ product }: { product: any }) => {
  const t = useTranslations("ProductDetail");
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const [selectedAddons, setSelectedAddons] = useState<{ addonId: string; value?: string; price?: number; name?: string; customText?: string }[]>([]);
  const [lastAddonToast, setLastAddonToast] = useState<{ name: string; price: number } | null>(null);

  const images = useMemo(() => (
    product.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&q=80&w=800"]
  ), [product.images]);

  const [activeImage, setActiveImage] = useState(images[0]);

  // Colores de Rosas Disponibles (Configurados o Predefinidos de la Boutique)
  const availableColors: string[] = useMemo(() => {
    let rawList: string[] = [];
    if (Array.isArray(product.availableColors) && product.availableColors.length > 0) {
      rawList = product.availableColors;
    } else {
      rawList = DEFAULT_ROSE_COLORS;
    }
    // Normalizar automáticamente cualquier "Sweet Beat" histórico a "Be Sweet"
    return rawList.map((c) =>
      typeof c === "string" && c.trim().toLowerCase() === "sweet beat" ? "Be Sweet" : c
    );
  }, [product.availableColors]);

  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || "Red");

  const basePrice = Number(product.price || 0);
  const baseFlowerCount = Number(product.flowerCount) || 24;

  // Rosas Adicionales en el Bouquet (+25, +50, +75, +100 rosas a $3.50 c/u)
  const [extraRoses, setExtraRoses] = useState<number>(0);
  const pricePerExtraRose = Number(product.pricePerExtraRose) >= 3.50 ? Number(product.pricePerExtraRose) : 3.50;
  const extraRosesTotal = extraRoses * pricePerExtraRose;

  // Formateador de viñetas para la descripción (con soporte bilingüe e inglés por defecto)
  const effectiveDescription = useMemo(() => {
    if (isSpanish) {
      return product.description || "";
    }
    return product.description_en || translateProductDescription(product.description || "", false);
  }, [isSpanish, product.description, product.description_en]);

  const descriptionBullets = useMemo(() => (
    effectiveDescription
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
  ), [effectiveDescription]);

  // Cálculo Dinámico del Precio Combinado Total (Base + Rosas Extras + Adicionales)
  const { addonsTotalPrice, combinedTotalPrice } = useMemo(() => {
    const addonsTotal = selectedAddons.reduce((acc, curr) => acc + (curr.price || 0), 0);
    return {
      addonsTotalPrice: addonsTotal + extraRosesTotal,
      combinedTotalPrice: basePrice + extraRosesTotal + addonsTotal,
    };
  }, [selectedAddons, basePrice, extraRosesTotal]);

  const handleSelectionChange = useCallback((newSelection: { addonId: string; value?: string; price?: number; name?: string; customText?: string }[]) => {
    setSelectedAddons(newSelection);
    if (newSelection.length > selectedAddons.length) {
      const added = newSelection[newSelection.length - 1];
      if (added && added.name) {
        startTransition(() => {
          setLastAddonToast({ name: added.name || "Adicional", price: added.price || 0 });
        });
        setTimeout(() => {
          startTransition(() => {
            setLastAddonToast(null);
          });
        }, 4500);
      }
    }
  }, [selectedAddons.length]);

  // Consolidación de Opciones en selectedAddons para Carrito & Checkout (Transparente y Seguro)
  const finalAddons = useMemo(() => {
    const list = [...selectedAddons];

    // 1. Color de Rosas Seleccionado
    if (selectedColor) {
      list.unshift({
        addonId: "rose-color",
        name: isSpanish ? `Color de Rosas: ${selectedColor}` : `Rose Color: ${selectedColor}`,
        value: selectedColor,
        price: 0,
      });
    }

    // 2. Rosas Adicionales en el Bouquet
    if (extraRoses > 0) {
      list.push({
        addonId: "extra-roses",
        name: isSpanish ? `+${extraRoses} Rosas en Bouquet (${selectedColor})` : `+${extraRoses} Roses in Bouquet (${selectedColor})`,
        value: isSpanish ? `${extraRoses} rosas` : `${extraRoses} roses`,
        price: extraRosesTotal,
      });
    }

    return list;
  }, [selectedAddons, selectedColor, extraRoses, extraRosesTotal]);

  // Conteo total de flores visible
  const totalRosesDisplay = baseFlowerCount + extraRoses;

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0D110F] flex flex-col font-sans">
      {/* Header Visible con Logo al Home y Carrito */}
      <ShopHeader />

      {/* Contenido Principal */}
      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-10">
          
          {/* Tarjeta Principal de Producto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-[#141A16] p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10">
            
            {/* COLUMNA IZQUIERDA: Galería de Imágenes + Adicionales Concierge */}
            <div className="space-y-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 dark:bg-[#0F1411] border border-gray-100 dark:border-white/10 shadow-sm group">
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Insignia o Categoría Flotante */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-[#1A1C1C] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    {product.category}
                  </span>
                  {product.badge && (
                    <span className="bg-[#163422] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-[#D4AF37]">
                      {product.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Tira de Miniaturas Seleccionables */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeImage === img ? "border-[#163422] ring-2 ring-[#163422]/30 scale-105" : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* SECCIÓN DE ADICIONALES CONCIERGE (ESTILO STITCH) */}
              {product.addons && product.addons.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Sparkles size={14} className="text-[#FF97A4]" /> {isSpanish ? "Adicionales Concierge (Personaliza tu Ramo)" : "Concierge Addons (Customize your Bouquet)"}
                    </h3>
                    <span className="text-[11px] font-medium text-gray-400">{isSpanish ? "Click para equipar" : "Click to add"}</span>
                  </div>
                  <AddonSelection addons={product.addons} onSelectionChange={handleSelectionChange} />
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: Estudio de Compra, Configurador de Rosas y Opciones */}
            <div className="flex flex-col space-y-6">
              
              {/* Titular y Precio Dinámico */}
              <div>
                <span className="text-[#163422] dark:text-[#E6C98B] text-xs font-black uppercase tracking-[0.2em] block mb-1">
                  Atelier Floral Houston • Handcrafted
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-black text-[#1A1C1C] dark:text-white leading-tight mb-3">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-baseline gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-black text-black dark:text-[#E6C98B] transition-all">
                      ${combinedTotalPrice.toFixed(2)} USD
                    </span>
                    {addonsTotalPrice > 0 && (
                      <span className="text-xs text-gray-400 line-through font-bold">
                        ${basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {addonsTotalPrice > 0 && (
                    <span className="bg-stone-100 dark:bg-[#1E2620] text-[#163422] dark:text-[#E6C98B] text-xs font-black px-3 py-1 rounded-full border border-[#163422]/20 dark:border-[#E6C98B]/30 flex items-center gap-1 shadow-sm">
                      <Sparkles size={13} className="text-[#E6C98B]" /> +${addonsTotalPrice.toFixed(2)} {isSpanish ? "en extras y personalización" : "in extras & customization"}
                    </span>
                  )}
                </div>
              </div>

              {/* CONFIGURADOR 1: SELECTOR DE COLOR DE ROSAS */}
              <div className="bg-gray-50/80 dark:bg-[#141A16] p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-gray-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Palette size={14} className="text-[#FF97A4]" /> {isSpanish ? "Color de Rosas" : "Rose Color"}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white bg-white dark:bg-[#1E2620] px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/20">
                    {selectedColor}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableColors.map((colorName) => {
                    const isSelected = selectedColor === colorName;
                    const swatch = COLOR_SWATCHES[colorName] || { bg: "#e2e8f0" };

                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => setSelectedColor(colorName)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border select-none ${
                          isSelected
                            ? "bg-[#163422] text-white border-[#163422] shadow-sm ring-2 ring-[#E6C98B]/50 scale-102"
                            : "bg-white dark:bg-[#1A221D] text-gray-700 dark:text-stone-200 border-gray-200 dark:border-white/10 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 inline-block shadow-xs flex-shrink-0"
                          style={{
                            background: swatch.bg,
                            borderColor: swatch.border || "transparent",
                          }}
                        />
                        <span>{colorName}</span>
                        {isSelected && <Check size={13} className="text-[#E6C98B]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONFIGURADOR: AUMENTA LA CANTIDAD DE ROSAS EN TU BOUQUET */}
              <div className="bg-gray-50/80 dark:bg-[#141A16] p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                      <Plus size={14} className="text-[#FF97A4]" /> {isSpanish ? "Aumenta la cantidad de rosas en tu bouquet" : "Increase the number of roses in your bouquet"}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {isSpanish ? "Aumenta el volumen y opulencia del bouquet" : "Increase the volume and opulence of the bouquet"}
                    </span>
                  </div>

                  {extraRoses > 0 && (
                    <button
                      type="button"
                      onClick={() => setExtraRoses(0)}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 underline transition-colors"
                    >
                      {isSpanish ? "Quitar extras (0)" : "Remove extras (0)"}
                    </button>
                  )}
                </div>

                {/* Los 4 Botones de Incremento: +25, +50, +75, +100 Rosas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((amount) => {
                    const isSelected = extraRoses === amount;
                    const addedCost = amount * pricePerExtraRose;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setExtraRoses((prev) => (prev === amount ? 0 : amount))}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center select-none ${
                          isSelected
                            ? "bg-[#163422] text-white border-[#163422] shadow-sm ring-2 ring-[#E6C98B]/50 scale-102"
                            : "bg-white dark:bg-[#1A221D] text-gray-800 dark:text-stone-200 border-gray-200 dark:border-white/10 hover:border-[#FF97A4]/60"
                        }`}
                      >
                        <span className={`text-xs font-black ${isSelected ? "text-white" : "text-gray-900 dark:text-white"}`}>
                          +{amount} {isSpanish ? "Rosas" : "Roses"}
                        </span>
                        <span className={`text-[10px] font-bold ${isSelected ? "text-[#E6C98B]" : "text-gray-500 dark:text-gray-400"}`}>
                          +${addedCost.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Micro-Stepper para ajuste fino individual */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-800">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {isSpanish ? "Ajuste fino unidad por unidad:" : "Fine adjustment unit by unit:"}
                  </span>
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setExtraRoses((prev) => Math.max(0, prev - 1))}
                      disabled={extraRoses === 0}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white disabled:opacity-30 rounded-lg transition-colors"
                      title={isSpanish ? "Quitar 1 rosa" : "Remove 1 rose"}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-10 text-center font-black text-xs text-gray-900 dark:text-white">
                      +{extraRoses}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExtraRoses((prev) => prev + 1)}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white rounded-lg transition-colors"
                      title={isSpanish ? "Sumar 1 rosa" : "Add 1 rose"}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* CAJA VISUAL DE ESPECIFICACIONES DINÁMICAS */}
              <div className="bg-gray-50/80 dark:bg-[#141A16] rounded-2xl p-5 border border-gray-100 dark:border-white/10 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-stone-300 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#E6C98B]" /> {isSpanish ? "Especificaciones del Diseño" : "Design Specifications"}
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-[#1A221D] p-3 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-2.5">
                    <div className="p-2 bg-[#FF97A4]/10 text-[#FF97A4] rounded-lg">
                      <Flower2 size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">{isSpanish ? "Flores en Total" : "Total Flowers"}</span>
                      <span className="font-bold text-gray-800 dark:text-white">{totalRosesDisplay} {isSpanish ? "Rosas Frescas" : "Fresh Roses"}</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1A221D] p-3 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-2.5">
                    <div className="p-2 bg-[#FF97A4]/10 text-[#FF97A4] rounded-lg">
                      <Package size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">{isSpanish ? "Presentación" : "Presentation"}</span>
                      <span className="font-bold text-gray-800 dark:text-white capitalize">{product.bouquetType ? (isSpanish ? product.bouquetType : translateFeatureLabel(product.bouquetType)) : (isSpanish ? "Ramo de Alta Costura" : "Haute Couture Bouquet")}</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1A221D] p-3 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-2.5">
                    <div className="p-2 bg-[#FF97A4]/10 text-[#FF97A4] rounded-lg">
                      <Truck size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">{isSpanish ? "Entrega" : "Delivery"}</span>
                      <span className="font-bold text-gray-800 dark:text-white">{isSpanish ? "Mismo Día en Houston" : "Same Day in Houston"}</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1A221D] p-3 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-2.5">
                    <div className="p-2 bg-[#FF97A4]/10 text-[#FF97A4] rounded-lg">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">{isSpanish ? "Garantía" : "Guarantee"}</span>
                      <span className="font-bold text-gray-800 dark:text-white">{isSpanish ? "Flores 100% Frescas" : "100% Fresh Flowers"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIÑETAS / CARACTERÍSTICAS DINÁMICAS (Features) */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-stone-300">{t('includesTitle')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.features.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs bg-white dark:bg-[#1A221D] p-2.5 rounded-xl border border-gray-100 dark:border-white/10">
                        <CheckCircle2 size={16} className="text-[#E6C98B] flex-shrink-0" />
                        <span className="font-medium text-gray-700 dark:text-stone-200">
                          <strong className="text-gray-900 dark:text-white">{isSpanish ? feature.label : translateFeatureLabel(feature.label)}:</strong> {isSpanish ? feature.value : translateFloralSentence(feature.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* DESCRIPCIÓN SECTORIZADA EN VIÑETAS LIMPIAS */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-stone-300">{t('descriptionTitle')}</h3>
                <div className="bg-white dark:bg-[#141A16] p-5 rounded-2xl border border-gray-100 dark:border-white/10 space-y-2 text-sm text-gray-600 dark:text-stone-200 font-light leading-relaxed">
                  {descriptionBullets.map((paragraph: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E6C98B] mt-2 flex-shrink-0" />
                      <p>{paragraph}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÓN AGREGAR AL CARRITO CON ANIMACIÓN GAMIFICADA */}
              <div className="pt-4 mt-auto space-y-3 relative">

                {/* Toast / Tooltip Flotante Animado cuando se selecciona un adicional */}
                {lastAddonToast && (
                  <div className="p-3 bg-[#1A1C1C] text-white rounded-2xl shadow-xl border border-pink-500/30 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#FF97A4] rounded-lg text-white">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block text-white">
                          {isSpanish ? `¡+1 ${lastAddonToast.name} añadido al regalo!` : `+1 ${lastAddonToast.name} added to the gift!`}
                        </span>
                        <span className="text-[10px] text-pink-300 font-medium">
                          {isSpanish ? `Sumado al total: $${combinedTotalPrice.toFixed(2)} USD` : `Added to total: $${combinedTotalPrice.toFixed(2)} USD`}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-white bg-white/20 px-2.5 py-1 rounded-full">
                      +${lastAddonToast.price.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Banner Tutorial Animado estilo Boutique con Flecha Rebotando cuando hay adicionales */}
                {selectedAddons.length > 0 && (
                  <div className="p-3.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl shadow-lg border border-pink-300/40 flex items-center justify-between animate-bounce duration-1000">
                    <div className="flex items-center gap-2.5">
                      <Flower2 size={20} className="text-pink-200 animate-spin duration-1000" />
                      <span className="text-xs font-black tracking-wide">
                        {isSpanish
                          ? `🌸 ¡Tu ramo con ${selectedColor} (${totalRosesDisplay} rosas) está configurado! 🌸`
                          : `🌸 Your bouquet with ${selectedColor} (${totalRosesDisplay} roses) is configured! 🌸`}
                      </span>
                    </div>
                    <ArrowDown size={20} className="text-white animate-pulse" />
                  </div>
                )}

                <AddToCartButton
                  product={{
                    ...product,
                    price: combinedTotalPrice,
                    selectedAddons: finalAddons,
                  }}
                />
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
};
