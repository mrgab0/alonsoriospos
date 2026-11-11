"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { filterUniqueVariantProducts } from "@/lib/utils/variantFilter";
import {
  BookOpen,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  Layers,
  Phone,
  DollarSign,
  QrCode,
  Globe,
  Loader2,
  Package,
  Sliders,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

export default function AdminCatalogoPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda en la UI del configurador
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");

  // Selección de Productos (Set de IDs)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Opciones del Catálogo PDF
  const [includeAddons, setIncludeAddons] = useState(true);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [catalogTitle, setCatalogTitle] = useState("VKA POS — Catálogo General de Productos");
  const [catalogSubtitle, setCatalogSubtitle] = useState("Handcrafted Couture Arrangements & Concierge Gifts in Houston, TX");
  const [contactPhone, setContactPhone] = useState("(346) 739-2730");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [showPrices, setShowPrices] = useState(true);
  const [includeQr, setIncludeQr] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"editorial" | "compact">("editorial"); // 2 o 4 por página

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, addonRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/addons")
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const rawProds = prodData.products || [];
          // Filtrar variantes hijas: solo mostrar padres y productos únicos
          const cleanProds = filterUniqueVariantProducts(rawProds);
          setProducts(cleanProds);
          // Por defecto seleccionar todos los productos limpios activos
          const activeIds = new Set<string>(
            cleanProds.filter((p: any) => p.isActive !== false).map((p: any) => p._id.toString())
          );
          setSelectedProductIds(activeIds);
        }

        if (addonRes.ok) {
          const addonData = await addonRes.json();
          const cleanAddons = addonData.addons || [];
          setAddons(cleanAddons);
          // Por defecto seleccionar todos los adicionales activos
          const allAddonIds = new Set<string>(cleanAddons.map((a: any) => a._id.toString()));
          setSelectedAddonIds(allAddonIds);
        }
      } catch (err) {
        console.error("Error cargando datos para catálogo:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Categorías únicas de productos
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  // Productos filtrados para la lista de selección
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategoryTab === "all" || p.category === activeCategoryTab;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategoryTab]);

  // Manejo de selecciones
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(p._id.toString()));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.delete(p._id.toString()));
      return next;
    });
  };

  const toggleCategoryInBulk = (cat: string) => {
    const prodsInCat = products.filter((p) => p.category === cat);
    const allSelected = prodsInCat.every((p) => selectedProductIds.has(p._id.toString()));

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      prodsInCat.forEach((p) => {
        if (allSelected) {
          next.delete(p._id.toString());
        } else {
          next.add(p._id.toString());
        }
      });
      return next;
    });
  };

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Construir enlace de apertura del Catálogo
  const generateCatalogUrl = () => {
    const params = new URLSearchParams();
    if (selectedProductIds.size > 0 && selectedProductIds.size < products.length) {
      params.set("ids", Array.from(selectedProductIds).join(","));
    }
    if (includeAddons) {
      params.set("addons", "true");
      if (selectedAddonIds.size > 0 && selectedAddonIds.size < addons.length) {
        params.set("addonIds", Array.from(selectedAddonIds).join(","));
      }
    } else {
      params.set("addons", "false");
    }
    params.set("prices", showPrices ? "true" : "false");
    params.set("qr", includeQr ? "true" : "false");
    params.set("lang", language);
    params.set("layout", layoutMode);
    if (contactPhone) params.set("phone", contactPhone);
    if (catalogTitle) params.set("title", catalogTitle);
    if (catalogSubtitle) params.set("subtitle", catalogSubtitle);

    return `/productos/catalogo?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Superior */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/productos"
              className="text-xs font-bold text-gray-500 hover:text-[#163422] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Volver a Productos
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1">
              <Sparkles size={12} /> Alta Costura Floral
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1C1C]">
            Generador de Catálogo Editorial en PDF
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Configura el lookbook imprimible para la jefa. Filtra colecciones, selecciona qué arreglos y adicionales incluir, y exporta en PDF vectorial de alta calidad sin marcas de agua.
          </p>
        </div>

        {/* Botón Flotante de Generación Inmediata */}
        <a
          href={generateCatalogUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-8 py-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg flex items-center gap-2.5 shrink-0 ${
            selectedProductIds.size === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
              : "bg-[#163422] text-white hover:bg-[#1B2E22] hover:scale-105 active:scale-95 shadow-[#163422]/20"
          }`}
        >
          <BookOpen size={18} />
          <span>Abrir y Exportar Catálogo PDF</span>
          <ArrowRight size={16} />
        </a>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="animate-spin text-[#C5A059]" size={28} />
          <span className="text-sm font-semibold">Cargando productos limpios y adicionales...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA Y CENTRAL: SELECTOR DE PRODUCTOS (2 Columnas) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de Control de Selección */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Package size={18} className="text-[#163422]" />
                    Selección de Arreglos Florales
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedProductIds.size} de {products.length} productos seleccionados (las variantes hijas ya están excluidas automáticamente)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Buscador de Producto */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nombre o SKU..."
                  className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              {/* Selector de Categorías en Lote */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Filtrar por Colección:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryTab("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeCategoryTab === "all"
                        ? "bg-[#163422] text-white shadow-xs"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                    }`}
                  >
                    Todas ({products.length})
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    const inCategorySelected = products.filter((p) => p.category === cat && selectedProductIds.has(p._id.toString())).length;
                    const isActive = activeCategoryTab === cat;

                    return (
                      <div key={cat} className="inline-flex items-center rounded-full border border-stone-200 overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveCategoryTab(cat)}
                          className={`px-3 py-1.5 font-bold transition-colors ${
                            isActive ? "bg-[#163422] text-white" : "bg-stone-50 hover:bg-stone-100 text-stone-700"
                          }`}
                        >
                          {cat} ({inCategorySelected}/{count})
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCategoryInBulk(cat)}
                          className="px-2 py-1.5 bg-stone-200/60 hover:bg-stone-300 text-stone-600 transition-colors border-l border-stone-200"
                          title="Alternar selección completa de esta categoría"
                        >
                          {inCategorySelected === count ? "✓" : "+"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid de Productos Seleccionables */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product._id.toString());
                  const image = product.images?.[0] || "";

                  return (
                    <div
                      key={product._id}
                      onClick={() => toggleProduct(product._id.toString())}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                        isSelected
                          ? "bg-emerald-50/60 border-emerald-400 shadow-xs"
                          : "bg-white border-gray-200 hover:border-gray-300 opacity-60"
                      }`}
                    >
                      <div className="text-emerald-700">
                        {isSelected ? <CheckSquare size={20} className="text-[#163422]" /> : <Square size={20} className="text-gray-300" />}
                      </div>

                      <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center border border-stone-200/60">
                        {image ? (
                          <img src={image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block truncate">{product.category}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-[#C5A059]">${product.price.toFixed(2)}</span>
                          {product.flowerCount ? (
                            <span className="text-[10px] text-gray-400">• {product.flowerCount} Rosas</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selector de Adicionales Concierge */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="includeAddonsToggle"
                    checked={includeAddons}
                    onChange={(e) => setIncludeAddons(e.target.checked)}
                    className="w-4 h-4 rounded text-[#163422] focus:ring-[#C5A059]"
                  />
                  <label htmlFor="includeAddonsToggle" className="text-sm font-bold text-stone-900 cursor-pointer">
                    Incluir Sección de Adicionales & Regalos Concierge en el Catálogo
                  </label>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  {selectedAddonIds.size} de {addons.length}
                </span>
              </div>

              {includeAddons && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-h-56 overflow-y-auto">
                  {addons.map((addon) => {
                    const isSelected = selectedAddonIds.has(addon._id.toString());
                    return (
                      <div
                        key={addon._id}
                        onClick={() => toggleAddon(addon._id.toString())}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 select-none transition-all ${
                          isSelected
                            ? "bg-purple-50/70 border-purple-300 text-purple-900 font-bold"
                            : "bg-stone-50 border-stone-200 text-stone-600 opacity-60"
                        }`}
                      >
                        {isSelected ? <CheckSquare size={16} className="text-purple-700 shrink-0" /> : <Square size={16} className="text-gray-300 shrink-0" />}
                        <span className="truncate">{addon.name} (${addon.price})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: CONFIGURACIÓN EDITORIAL DEL CATÁLOGO (1 Columna) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 sticky top-24">
              <div className="border-b pb-4">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Sliders size={18} className="text-[#C5A059]" />
                  Ajustes Editoriales del PDF
                </h3>
                <p className="text-xs text-gray-500">Personaliza la portada y la información que verá el cliente</p>
              </div>

              {/* Idioma */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Globe size={14} className="text-gray-400" /> Idioma del Catálogo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      language === "en"
                        ? "bg-[#163422] text-white border-[#163422] shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    🇺🇸 English (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("es")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      language === "es"
                        ? "bg-[#163422] text-white border-[#163422] shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    🇪🇸 Español
                  </button>
                </div>
              </div>

              {/* Título de Portada */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">Título de la Portada</label>
                <input
                  type="text"
                  value={catalogTitle}
                  onChange={(e) => setCatalogTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">Subtítulo / Claim Editorial</label>
                <textarea
                  value={catalogSubtitle}
                  onChange={(e) => setCatalogSubtitle(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              {/* Teléfono Concierge */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Phone size={14} className="text-gray-400" /> Teléfono de Concierge
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                />
              </div>

              {/* Disposición de Página (Layout) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">Disposición de Fotos en Página</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutMode("editorial")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      layoutMode === "editorial"
                        ? "bg-[#C5A059] text-stone-950 border-[#C5A059] shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    📖 2 Arreglos / Pág (Editorial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("compact")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      layoutMode === "compact"
                        ? "bg-[#C5A059] text-stone-950 border-[#C5A059] shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    📑 4 Arreglos / Pág (Compacto)
                  </button>
                </div>
              </div>

              {/* Opciones booleanas */}
              <div className="space-y-2.5 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-gray-400" /> Mostrar Precios USD
                  </span>
                  <input
                    type="checkbox"
                    checked={showPrices}
                    onChange={(e) => setShowPrices(e.target.checked)}
                    className="w-4 h-4 rounded text-[#163422] focus:ring-[#C5A059]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <QrCode size={14} className="text-gray-400" /> Códigos QR de Pedido Rápido
                  </span>
                  <input
                    type="checkbox"
                    checked={includeQr}
                    onChange={(e) => setIncludeQr(e.target.checked)}
                    className="w-4 h-4 rounded text-[#163422] focus:ring-[#C5A059]"
                  />
                </div>
              </div>

              {/* Resumen & Botón de Lanzamiento */}
              <div className="pt-4 border-t space-y-3">
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Arreglos seleccionados:</span>
                    <strong className="text-stone-900">{selectedProductIds.size}</strong>
                  </div>
                  {includeAddons && (
                    <div className="flex justify-between">
                      <span>Adicionales incluidos:</span>
                      <strong className="text-purple-900">{selectedAddonIds.size}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Hijos duplicados excluidos:</span>
                    <strong className="text-emerald-700">0 (Filtrados)</strong>
                  </div>
                </div>

                <a
                  href={generateCatalogUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                    selectedProductIds.size === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                      : "bg-[#163422] hover:bg-[#1B2E22] text-white hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  <BookOpen size={18} />
                  <span>Ver y Guardar como PDF</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
