"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard/ProductCard";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { Footer } from "@/components/shop/Footer";
import { Search, ArrowUpDown, Sparkles, Flower2, RefreshCw, Gift, Check, Tag } from "lucide-react";
import { useCart } from "@/components/shop/Cart/CartContext";
import { useTranslations } from "next-intl";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";
import { normalizeAddon } from "@/lib/utils/addonCategories";
import { matchesCatalogSearch } from "@/lib/utils/searchHelper";

interface CatalogClientProps {
  initialProducts: any[];
  initialAddons?: any[];
  initialTab?: "all" | "products" | "addons";
  initialCategory?: string;
}

export function CatalogClient({
  initialProducts,
  initialAddons = [],
  initialTab = "all",
  initialCategory = "all",
}: CatalogClientProps) {
  const t = useTranslations("Catalog");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "products" | "addons">(initialTab);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const { addToCart } = useCart();
  const [addedAddonId, setAddedAddonId] = useState<string | null>(null);

  // Sincronizar filtros desde la URL (soporta ?cat=, ?category= y ?tab=)
  useEffect(() => {
    if (!searchParams) return;
    const searchVal = searchParams.get("search");
    const catVal = searchParams.get("cat") || searchParams.get("category");
    const tabVal = searchParams.get("tab");

    if (searchVal) {
      setSearchTerm(searchVal);
    }

    if (tabVal === "addons" || tabVal === "adicionales") {
      setActiveTab("addons");
    }

    if (catVal) {
      const c = catVal.toLowerCase();
      if (c.includes("adicional") || c === "addons") {
        setActiveTab("addons");
        setSelectedCategory("all");
      } else if (c.includes("chocolate") || c.includes("dulce")) {
        setActiveTab("addons");
        setSelectedCategory("Adicional: Chocolates & Dulces");
      } else if (c.includes("peluche") || c.includes("oso") || c.includes("teddy")) {
        setActiveTab("addons");
        setSelectedCategory("Adicional: Peluches");
      } else if (c.includes("globo") || c.includes("balloon") || c.includes("helio")) {
        setActiveTab("addons");
        setSelectedCategory("Adicional: Globos con Helio");
      } else if (c.includes("corona") || c.includes("crown")) {
        setActiveTab("addons");
        setSelectedCategory("Adicional: Coronas & Joyería");
      } else {
        setSelectedCategory(catVal);
      }
    }
  }, [searchParams]);

  // Normalizar items combinados (Arreglos + Adicionales con categorías consistentes)
  const combinedItems = useMemo(() => {
    const productsFormatted = (initialProducts || []).map((p) => ({
      ...p,
      itemType: "product",
      displayCategory: p.category || "Flores",
    }));

    const addonsFormatted = (initialAddons || []).map((raw) => {
      const a = normalizeAddon(raw);
      return {
        ...a,
        itemType: "addon",
        images: [a.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600"],
        displayCategory: a.category ? `Adicional: ${a.category}` : "Adicionales",
      };
    });

    return [...productsFormatted, ...addonsFormatted];
  }, [initialProducts, initialAddons]);

  // Extraer categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    combinedItems.forEach((item) => {
      if (item.displayCategory) set.add(item.displayCategory);
    });
    return Array.from(set);
  }, [combinedItems]);

  // Filtrado y Ordenamiento en tiempo real
  const filteredItems = useMemo(() => {
    return combinedItems
      .filter((item) => {
        // Filtro por Tab
        if (activeTab === "products" && item.itemType !== "product") return false;
        if (activeTab === "addons" && item.itemType !== "addon") return false;

        // Filtro Semántico & Bilingüe por Búsqueda (evalúa nombre, descripción, ocasiones y flores)
        const matchSearch = matchesCatalogSearch(item, searchTerm);

        // Filtro Inteligente por Categoría
        const selLower = selectedCategory.toLowerCase();
        let matchCategory = selectedCategory === "all";

        if (!matchCategory) {
          if (selLower.includes("adicional") && item.itemType === "addon") {
            matchCategory = true;
          } else if (item.displayCategory?.toLowerCase() === selLower) {
            matchCategory = true;
          } else if (
            selLower.includes("chocolate") &&
            (item.category?.toLowerCase().includes("chocolate") ||
              item.name?.toLowerCase().includes("ferrero") ||
              item.name?.toLowerCase().includes("chocolate"))
          ) {
            matchCategory = true;
          } else if (
            selLower.includes("peluche") &&
            (item.category?.toLowerCase().includes("peluche") ||
              item.name?.toLowerCase().includes("teddy") ||
              item.name?.toLowerCase().includes("peluche") ||
              item.name?.toLowerCase().includes("bear"))
          ) {
            matchCategory = true;
          } else if (
            selLower.includes("globo") &&
            (item.category?.toLowerCase().includes("globo") ||
              item.name?.toLowerCase().includes("balloon") ||
              item.name?.toLowerCase().includes("helium"))
          ) {
            matchCategory = true;
          }
        }

        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return 0;
      });
  }, [combinedItems, activeTab, searchTerm, selectedCategory, sortBy]);

  const handleAddAddonToCart = (addon: any) => {
    addToCart({
      id: addon._id,
      name: addon.name,
      price: addon.price,
      image: addon.images[0],
    });
    setAddedAddonId(addon._id);
    setTimeout(() => setAddedAddonId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <ShopHeader />

      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl space-y-8">
          
          {/* Cabecera Principal del Catálogo */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[#163422] text-xs font-black uppercase tracking-[0.25em] bg-stone-100 px-4 py-1.5 rounded-full border border-[#163422]/20 inline-block shadow-sm">
              {t('headerBadge')}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-[#1A1C1C] tracking-tight">
              {t('headerTitle')}
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed">
              {t('headerDesc')}
            </p>
          </div>

          {/* TAB SWITCHER: Todos | Arreglos | Adicionales */}
          <div className="flex justify-center gap-2 max-w-md mx-auto p-1.5 bg-gray-200/70 dark:bg-stone-800 rounded-full">
            <button
              onClick={() => { setActiveTab("all"); setSelectedCategory("all"); }}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-extrabold transition-all text-center cursor-pointer ${
                activeTab === "all"
                  ? "bg-black dark:bg-[#163422] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 shadow-md"
                  : "text-gray-600 dark:text-stone-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t('allTab')} ({combinedItems.length})
            </button>
            <button
              onClick={() => { setActiveTab("products"); setSelectedCategory("all"); }}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-extrabold transition-all text-center cursor-pointer ${
                activeTab === "products"
                  ? "bg-[#163422] dark:bg-[#163422] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 shadow-md"
                  : "text-gray-600 dark:text-stone-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t('flowersTab')} ({initialProducts.length})
            </button>
            <button
              onClick={() => { setActiveTab("addons"); setSelectedCategory("all"); }}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-extrabold transition-all text-center cursor-pointer ${
                activeTab === "addons"
                  ? "bg-purple-600 dark:bg-purple-500 text-white shadow-md"
                  : "text-gray-600 dark:text-stone-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t('addonsTab')} ({initialAddons.length})
            </button>
          </div>

          {/* PANEL DE BÚSQUEDA Y FILTROS */}
          <div className="bg-white dark:bg-[#141A16] p-5 md:p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* Campo de Búsqueda Sencillo */}
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-stone-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-stone-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF97A4] transition-all bg-gray-50/50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:dark:text-stone-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:text-stone-400 dark:hover:text-stone-200 bg-gray-200 dark:bg-stone-800 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Ordenamiento por Precio */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span className="text-xs font-bold text-gray-500 dark:text-stone-400 flex items-center gap-1.5">
                  <ArrowUpDown size={14} className="text-[#FF97A4]" /> {t('sortBy')}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-3 border border-gray-200 dark:border-stone-700 rounded-2xl bg-white dark:bg-stone-900 text-xs font-bold text-gray-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                >
                  <option value="featured">{t('featured')}</option>
                  <option value="price-asc">{t('priceLowHigh')}</option>
                  <option value="price-desc">{t('priceHighLow')}</option>
                </select>
              </div>
            </div>

            {/* Pastillas de Categorías (Pills) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-gray-100 dark:border-stone-800 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-[#FF97A4] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                }`}
              >
                {t('allCategories')}
              </button>

              {categories.map((cat) => {
                const count = combinedItems.filter((i) => i.displayCategory === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-[#FF97A4] text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* RESULTADOS DEL CATÁLOGO */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                {t('showingItems')} <strong className="text-[#1A1C1C] dark:text-white">{filteredItems.length}</strong> {t('itemsInCatalog')}
              </span>
              {(searchTerm || selectedCategory !== "all" || activeTab !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setActiveTab("all");
                  }}
                  className="text-xs font-bold text-[#FF97A4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} /> {t('clearFilters')}
                </button>
              )}
            </div>

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item) => {
                  if (item.itemType === "product") {
                    return (
                      <ProductCard
                        key={item._id}
                        id={item._id}
                        name={item.name}
                        slug={item.slug}
                        price={item.price}
                        category={item.category}
                        badge={item.badge}
                        image={item.images[0] || "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&q=80&w=800"}
                      />
                    );
                  }

                  // TARJETA DE ADICIONAL
                  const isAdded = addedAddonId === item._id;

                  return (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-[#12131A] rounded-3xl p-5 border border-purple-100 dark:border-purple-900/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/20">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Sparkles size={11} /> {t('addonBadge')}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                            {item.category || t('addonBadge')}
                          </span>
                          <h3 className="font-bold text-lg text-[#1A1C1C] dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-gray-400 dark:text-stone-400 line-clamp-2 mt-1 font-medium">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-gray-100 dark:border-stone-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-stone-400 font-bold block uppercase">{isSpanish ? "Precio" : "Price"}</span>
                          <span className="text-xl font-black text-[#1A1C1C] dark:text-white">
                            ${item.price.toFixed(2)} <span className="text-xs font-bold text-gray-500 dark:text-stone-400">USD</span>
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddAddonToCart(item)}
                          className={`px-4 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            isAdded
                              ? "bg-green-600 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} /> {t('added')}
                            </>
                          ) : (
                            <>
                              <Gift size={14} /> {t('addToCart')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#12131A] p-12 rounded-3xl border border-gray-100 dark:border-stone-800 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                <Flower2 size={48} className="mx-auto text-pink-200 dark:text-pink-400/40" />
                <h3 className="text-xl font-bold text-[#1A1C1C] dark:text-white">{t('noResultsTitle')}</h3>
                <p className="text-xs text-gray-400 dark:text-stone-400">
                  {t('noResultsDesc')}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setActiveTab("all");
                  }}
                  className="bg-[#FF97A4] text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-[#B0004A] transition-colors cursor-pointer"
                >
                  {t('viewAllBtn')}
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      <WhatsAppButton phoneNumber="13467392730" />
      <Footer />
    </div>
  );
}
