"use client";

import React, { useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { IAddon } from "@/lib/models/Addon";
import { normalizeAddon, ADDON_CATEGORIES_ORDER } from "@/lib/utils/addonCategories";
import {
  Sparkles,
  Check,
  MessageSquare,
  Gift,
  Heart,
  Palette,
  Feather,
  Crown,
  Plus,
} from "lucide-react";

export interface SelectedAddonState {
  addonId: string;
  name?: string;
  price?: number;
  value?: string;
  customText?: string;
}

interface AddonSelectionProps {
  addons: any[];
  onSelectionChange: (selectedAddons: SelectedAddonState[]) => void;
}

const categoryIcons: Record<string, any> = {
  "Globos con Helio": Sparkles,
  "Chocolates & Dulces": Gift,
  "Peluches": Heart,
  "Coronas & Joyería": Crown,
  "Personalización & Lazos": MessageSquare,
  "Otros Adicionales": Plus,
};

function getAddonId(addon: any): string {
  if (!addon) return "";
  if (addon._id) return addon._id.toString();
  if (addon.id) return String(addon.id);
  return "";
}

function translateAddonCategory(cat: string, isEs: boolean): string {
  if (isEs || !cat) return cat;
  switch (cat.trim()) {
    case "Globos con Helio":
      return "Helium Balloons";
    case "Chocolates & Dulces":
      return "Chocolates & Sweets";
    case "Peluches":
      return "Teddy Bears & Plushies";
    case "Coronas & Joyería":
      return "Crowns & Jewelry";
    case "Personalización & Lazos":
      return "Custom Ribbons & Cards";
    case "Otros Adicionales":
      return "Other Addons";
    default:
      return cat;
  }
}

export const AddonSelection = React.memo(({ addons, onSelectionChange }: AddonSelectionProps) => {
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const [selected, setSelected] = useState<SelectedAddonState[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Normalizar los adicionales para garantizar que Ferrero, Peluches y Globos estén en su categoría exacta
  const normalizedAddons = useMemo(() => {
    return (addons || []).filter(Boolean).map((a) => normalizeAddon(a));
  }, [addons]);

  // Extraer categorías únicas ordenadas de forma lógica y premium
  const categories = useMemo(() => {
    const set = new Set<string>();
    normalizedAddons.forEach((a) => {
      if (a.category) set.add(a.category.trim());
    });

    const list = Array.from(set);
    return list.sort((a, b) => {
      const idxA = (ADDON_CATEGORIES_ORDER as readonly string[]).indexOf(a);
      const idxB = (ADDON_CATEGORIES_ORDER as readonly string[]).indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [normalizedAddons]);

  // Agrupación de adicionales por categoría para vista organizada
  const groupedCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        items: normalizedAddons.filter((a) => a.category?.trim().toLowerCase() === cat.toLowerCase()),
      }))
      .filter((g) => g.items.length > 0);
  }, [normalizedAddons, categories]);

  // Filtrado por categoría activa cuando no es "all"
  const filteredAddons = useMemo(() => {
    if (activeCategory === "all") return normalizedAddons;
    return normalizedAddons.filter((a) => a.category?.trim().toLowerCase() === activeCategory.toLowerCase());
  }, [normalizedAddons, activeCategory]);

  const toggleAddon = useCallback((addon: any) => {
    const addonIdStr = getAddonId(addon);
    if (!addonIdStr) return;

    setSelected((prev) => {
      const exists = prev.find((s) => s.addonId === addonIdStr);
      const nextSelection = exists
        ? prev.filter((s) => s.addonId !== addonIdStr)
        : [...prev, { addonId: addonIdStr, name: addon.name, price: addon.price, customText: "" }];
      onSelectionChange(nextSelection);
      return nextSelection;
    });
  }, [onSelectionChange]);

  const handleCustomTextChange = (addonIdStr: string, customText: string) => {
    const nextSelection = selected.map((s) =>
      s.addonId === addonIdStr ? { ...s, customText } : s
    );
    setSelected(nextSelection);
    onSelectionChange(nextSelection);
  };

  const handleSelectOption = (addon: any, val: string) => {
    const addonIdStr = getAddonId(addon);
    if (!addonIdStr) return;

    const existing = selected.find((s) => s.addonId === addonIdStr);
    const filtered = selected.filter((s) => s.addonId !== addonIdStr);
    const nextSelection = val 
      ? [...filtered, { addonId: addonIdStr, name: `${addon.name}: ${val}`, value: val, price: addon.price, customText: existing?.customText || "" }] 
      : filtered;
    
    setSelected(nextSelection);
    onSelectionChange(nextSelection);
  };

  const optimizeImageUrl = (url?: string) => {
    if (!url) return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400";
    if (url.includes("ik.imagekit.io") && !url.includes("tr=")) {
      return `${url}?tr=w-300,q-80,f-auto`;
    }
    return url;
  };

  const renderAddonCard = (addon: any) => {
    const addonIdStr = getAddonId(addon);
    const selectedObj = selected.find((s) => s.addonId === addonIdStr);
    const isSelected = !!selectedObj;

    return (
      <div
        key={addonIdStr || addon.name}
        onClick={() => {
          if (addon.type !== "select" && addon.type !== "text") {
            toggleAddon(addon);
          }
        }}
        className={`relative bg-white dark:bg-[#141A16] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group shadow-xs ${
          isSelected
            ? "border-[#163422] dark:border-[#E6C98B] ring-2 ring-[#E6C98B]/40 shadow-md"
            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
        }`}
      >
        {/* Foto del Adicional con Zoom Suave */}
        <div className="relative aspect-square w-full bg-gray-50 dark:bg-gray-900/60 overflow-hidden">
          <img
            src={optimizeImageUrl(addon.image)}
            alt={addon.name || "Adicional"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badge de Selección / Check */}
          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected ? "bg-[#163422] text-[#E6C98B] border border-[#E6C98B]/50 shadow-md scale-105" : "bg-white/80 dark:bg-black/60 text-gray-400 border border-gray-200 dark:border-white/20"
          }`}>
            {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
          </div>

          {/* Badge de Precio Flotante */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/95 dark:bg-gray-900/90 text-stone-900 dark:text-stone-100 text-[10px] font-extrabold shadow-sm border border-black/5">
            {addon.price > 0 ? `+$${Number(addon.price).toFixed(2)}` : (isSpanish ? "Incluido" : "Included")}
          </div>
        </div>

        {/* Información y Explicación */}
        <div className="p-3 space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF97A4] block">
            {translateAddonCategory(addon.category, !!isSpanish)}
          </span>
          <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1 leading-snug">
            {addon.name}
          </h4>
          {addon.description && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
              {addon.description}
            </p>
          )}

          {/* Si es tipo select */}
          {addon.type === "select" && addon.options && addon.options.length > 0 && (
            <div className="pt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">{isSpanish ? "Opción:" : "Option:"}</span>
              <div className="flex flex-wrap gap-1">
                {addon.options.map((opt: string) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(addon, selectedObj?.value === opt ? "" : opt)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedObj?.value === opt
                        ? "bg-[#163422] text-white border-[#163422]"
                        : "bg-gray-50 dark:bg-[#1E2620] text-gray-600 dark:text-stone-300 border-gray-200 dark:border-white/10"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Si está seleccionado: campo opcional de personalización */}
          {isSelected && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
              <label className="text-[10px] font-bold text-[#FF97A4] flex items-center gap-1">
                <MessageSquare size={11} />
                <span>{isSpanish ? "Mensaje personalizado:" : "Custom message:"}</span>
              </label>
              <input
                type="text"
                value={selectedObj?.customText || ""}
                onChange={(e) => handleCustomTextChange(addonIdStr, e.target.value)}
                placeholder={isSpanish ? "Ej: Feliz Cumpleaños..." : "e.g. Happy Birthday..."}
                className="w-full p-1.5 border border-pink-200 dark:border-white/20 rounded-lg text-[11px] dark:bg-[#0D110F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FF97A4]"
              />
            </div>
          )}

          {/* Estado visual Stitch */}
          <div className="pt-1 flex items-center justify-between text-[10px] font-semibold">
            <span className={isSelected ? "text-emerald-600 dark:text-[#E6C98B] flex items-center gap-0.5" : "text-gray-400"}>
              {isSelected ? (isSpanish ? "✓ Equipado" : "✓ Added") : (isSpanish ? "Click para equipar" : "Click to add")}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pestañas de Categoría Estilo Stitch */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              activeCategory === "all"
                ? "bg-[#163422] text-white border-[#163422] shadow-sm"
                : "bg-white dark:bg-[#141A16] text-gray-700 dark:text-stone-300 border-gray-200 dark:border-white/10 hover:border-gray-400"
            }`}
          >
            <Sparkles size={13} className={activeCategory === "all" ? "text-[#E6C98B]" : "text-gray-400"} />
            <span>{isSpanish ? "Todos" : "All"} ({normalizedAddons.length})</span>
          </button>

          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat] || Sparkles;
            const isCatActive = activeCategory.toLowerCase() === cat.toLowerCase();
            const count = normalizedAddons.filter((a) => a.category?.trim().toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isCatActive
                    ? "bg-[#163422] text-white border-[#163422] shadow-sm"
                    : "bg-white dark:bg-[#141A16] text-gray-700 dark:text-stone-300 border-gray-200 dark:border-white/10 hover:border-gray-400"
                }`}
              >
                <IconComponent size={13} className={isCatActive ? "text-[#E6C98B]" : "text-gray-400"} />
                <span>{translateAddonCategory(cat, !!isSpanish)} ({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de Tarjetas Visuales Concierge Organizadas por Categoría */}
      {activeCategory === "all" ? (
        <div className="space-y-6">
          {groupedCategories.map(({ category, items }) => {
            const HeaderIcon = categoryIcons[category] || Sparkles;

            return (
              <div key={category} className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <HeaderIcon size={14} className="text-[#FF97A4]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      {translateAddonCategory(category, !!isSpanish)}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {items.length} {isSpanish ? (items.length === 1 ? "opción" : "opciones") : (items.length === 1 ? "option" : "options")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map(renderAddonCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredAddons.map(renderAddonCard)}
        </div>
      )}
    </div>
  );
});

AddonSelection.displayName = "AddonSelection";
