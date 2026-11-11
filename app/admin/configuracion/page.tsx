"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSiteConfig, updateSiteConfig } from "@/lib/actions/siteConfig";
import { getAdminProductsList } from "@/lib/actions/product";
import { generateTotpSecretAction, getOrCreateTotpSecretAction, update2FASettingsAction, test2FACodeAction } from "@/lib/actions/admin2fa";
import { Sparkles, Save, CheckCircle2, ArrowLeft, Layout, AlignLeft, Type, Footprints, ShieldCheck, Key, Smartphone, QrCode, RefreshCw, Lock, AlertTriangle, Check, Grid, Image as ImageIcon, Menu, Share2, Globe, Eye, Palette, Sliders, Star, Bot, Search, CheckSquare, Square, Award, Truck, Flame } from "lucide-react";
import Link from "next/link";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"grid" | "branding" | "heroProduct" | "social" | "reviews" | "iframe" | "chatbot" | "security">("grid");
  const searchParams = useSearchParams();

  // Auto-slider continuo suave para que todos los botones del menú (incluyendo 2FA) sean visibles
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isTabsPaused, setIsTabsPaused] = useState(false);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    let direction = 1;
    let pauseUntil = 0;
    const speed = 0.6; // Desplazamiento continuo (~36px/s)
    let animId: number;

    const loop = (timestamp: number) => {
      if (!isTabsPaused && el) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 5) {
          if (timestamp > pauseUntil) {
            el.scrollLeft += direction * speed;

            // Al llegar al extremo derecho (muestra Seguridad 2FA), pausa 2s
            if (el.scrollLeft >= maxScroll - 2 && direction === 1) {
              direction = -1;
              pauseUntil = timestamp + 2000;
            }
            // Al volver al inicio, pausa 2s
            else if (el.scrollLeft <= 2 && direction === -1) {
              direction = 1;
              pauseUntil = timestamp + 2000;
            }
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isTabsPaused]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["grid", "branding", "heroProduct", "social", "reviews", "iframe", "chatbot", "security"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Estados para gestión de Producto Destacado Hero
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [heroProductMode, setHeroProductMode] = useState<"popular" | "single" | "custom_list">("popular");
  const [heroProductId, setHeroProductId] = useState<string>("");
  const [heroPopularCount, setHeroPopularCount] = useState<number>(10);
  const [heroCustomProductIds, setHeroCustomProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");

  useEffect(() => {
    loadConfig();
    getAdminProductsList().then(res => {
      if (res.success && res.products) {
        setAdminProducts(res.products);
      }
      setLoadingProducts(false);
    });
  }, []);

  async function loadConfig() {
    setLoading(true);
    const { data } = await getSiteConfig();
    if (data) {
      setConfig(data);
      if (data.heroProductMode) setHeroProductMode(data.heroProductMode);
      if (data.heroProductId) setHeroProductId(data.heroProductId);
      if (data.heroPopularCount) setHeroPopularCount(data.heroPopularCount);
      if (Array.isArray(data.heroCustomProductIds)) setHeroCustomProductIds(data.heroCustomProductIds);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSiteConfig(formData);
    setSaving(false);

    if (result.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      loadConfig();
    } else {
      alert("Error al guardar la configuración del sitio.");
    }
  }

  const toggleCustomProduct = (id: string) => {
    setHeroCustomProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllProducts = () => {
    setHeroCustomProductIds(adminProducts.map(p => String(p._id)));
  };

  const deselectAllProducts = () => {
    setHeroCustomProductIds([]);
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return adminProducts;
    const term = productSearch.toLowerCase();
    return adminProducts.filter(p =>
      p.name?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term)
    );
  }, [adminProducts, productSearch]);

  const previewProduct = useMemo(() => {
    if (heroProductMode === "single") {
      return adminProducts.find(p => String(p._id) === String(heroProductId)) || adminProducts[0];
    }
    if (heroProductMode === "custom_list" && heroCustomProductIds.length > 0) {
      return adminProducts.find(p => heroCustomProductIds.includes(String(p._id))) || adminProducts[0];
    }
    return adminProducts[0];
  }, [heroProductMode, heroProductId, heroCustomProductIds, adminProducts]);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-bold animate-pulse">
        Cargando Editor Global del Home & Tienda...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header del Editor Global */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#12131A] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-tr from-pink-500 to-[#FF97A4] text-white rounded-2xl shadow-md shadow-pink-500/20">
            <Sliders size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-black text-[#1A1C1C] dark:text-white">Editor Global del Home & Tienda</h1>
            <p className="text-xs text-gray-400">Personaliza columnas, logo, menú, reseñas, redes sociales e iFrames con interruptores ON/OFF</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="bg-pink-50 dark:bg-pink-950/60 text-[#FF97A4] border border-pink-200 dark:border-pink-900/50 px-4 py-2.5 rounded-full font-bold text-xs hover:bg-pink-100 transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} /> Vista Previa Tienda
          </Link>
          <Link
            href="/admin"
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-full font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Volver al Panel
          </Link>
        </div>
      </div>

      {/* Pestañas de Navegación del Editor */}
      <div
        ref={tabsRef}
        onMouseEnter={() => setIsTabsPaused(true)}
        onMouseLeave={() => setIsTabsPaused(false)}
        onTouchStart={() => setIsTabsPaused(true)}
        onTouchEnd={() => setIsTabsPaused(false)}
        className="flex overflow-x-auto gap-2 bg-white dark:bg-[#12131A] p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm [&::-webkit-scrollbar]:hidden select-none"
      >
        <button
          type="button"
          onClick={() => setActiveTab("grid")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "grid"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Grid size={16} /> Cuadrícula de Productos (3, 4, 5 Cols)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("heroProduct")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "heroProduct"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Sparkles size={16} /> Producto Hero Portada 🌹
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "branding"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <ImageIcon size={16} /> Logo, Lemas & Menú
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "reviews"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Star size={16} /> Reseñas ⭐ & Trustpilot
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("social")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "social"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Share2 size={16} /> Redes Sociales & Feed
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("iframe")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "iframe"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Globe size={16} /> Módulo iFrames / Widgets
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chatbot")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "chatbot"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Bot size={16} /> Chatbot Dialogflow CX 🤖
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
            activeTab === "security"
              ? "bg-[#FF97A4] text-white shadow-md shadow-pink-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <ShieldCheck size={16} /> Seguridad 2FA
        </button>
      </div>

      {/* Formulario Principal de Configuración */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden inputs para sincronizar Hero Product en cualquier pestaña */}
        <input type="hidden" name="heroProductMode" value={heroProductMode} />
        <input type="hidden" name="heroProductId" value={heroProductId} />
        <input type="hidden" name="heroPopularCount" value={heroPopularCount.toString()} />
        <input type="hidden" name="heroCustomProductIds" value={JSON.stringify(heroCustomProductIds)} />

        {/* PESTAÑA 1: Cuadrícula de Productos */}
        {activeTab === "grid" && (
          <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <Grid size={22} className="text-[#FF97A4]" />
                <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                  Distribución de Productos en Escritorio
                </h2>
              </div>
              <span className="text-[11px] font-bold text-gray-400">Por defecto: 3 Columnas</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Elige cómo deseas que se organicen las tarjetas de flores en la portada. Puedes mantener la vista estándar de 3 columnas o ampliarla a 4 o 5 columnas para abarcar todo el ancho de pantalla.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Opción 3 Columnas */}
              <label
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  (config.productColumnsDesktop || 3) === 3
                    ? "border-[#FF97A4] bg-pink-50/30 dark:bg-pink-950/30 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#1A1C1C] dark:text-white">3 Columnas (Estándar)</span>
                  <input
                    type="radio"
                    name="productColumnsDesktop"
                    value="3"
                    defaultChecked={(config.productColumnsDesktop || 3) === 3}
                    onChange={() => setConfig({ ...config, productColumnsDesktop: 3 })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-12 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">Diseño tradicional amplio. Recomiendo para fotos grandes.</span>
              </label>

              {/* Opción 4 Columnas */}
              <label
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  config.productColumnsDesktop === 4
                    ? "border-[#FF97A4] bg-pink-50/30 dark:bg-pink-950/30 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#1A1C1C] dark:text-white">4 Columnas (Compacto)</span>
                  <input
                    type="radio"
                    name="productColumnsDesktop"
                    value="4"
                    defaultChecked={config.productColumnsDesktop === 4}
                    onChange={() => setConfig({ ...config, productColumnsDesktop: 4 })}
                  />
                </div>
                <div className="grid grid-cols-4 gap-1 h-12 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">Permite mostrar más productos por fila en pantallas de laptop.</span>
              </label>

              {/* Opción 5 Columnas */}
              <label
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  config.productColumnsDesktop === 5
                    ? "border-[#FF97A4] bg-pink-50/30 dark:bg-pink-950/30 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 hover:border-pink-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#1A1C1C] dark:text-white">5 Columnas (Panorámico)</span>
                  <input
                    type="radio"
                    name="productColumnsDesktop"
                    value="5"
                    defaultChecked={config.productColumnsDesktop === 5}
                    onChange={() => setConfig({ ...config, productColumnsDesktop: 5 })}
                  />
                </div>
                <div className="grid grid-cols-5 gap-1 h-12 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                  <div className="bg-[#FF97A4]/60 rounded-lg"></div>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">Abarca todo el ancho de pantalla para catálogos muy extensos.</span>
              </label>
            </div>
          </div>
        )}

        {/* PESTAÑA: Producto Hero Showcase */}
        {activeTab === "heroProduct" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Cabecera de la sección */}
            <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={22} className="text-[#FF97A4]" />
                  <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                    Producto Destacado en Hero Showcase
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-[#FF97A4] bg-pink-50 dark:bg-pink-950/50 px-3 py-1 rounded-full border border-pink-200 dark:border-pink-900/40">
                  Círculo Principal Portada
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Elige qué arreglo floral real se exhibe dentro del marco circular de la portada (&ldquo;Flowers that make them feel loved ♡&rdquo;). Puedes configurarlo para rotar aleatoriamente entre los más populares, fijar un producto específico, o seleccionar a mano qué productos rotan mediante palomitas selectoras.
              </p>
            </div>

            {/* Grid Principal: Modos de Selección a la Izquierda, Preview a la Derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Columna Izquierda: Modos de Selección */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Opción 1: Top Populares (Aleatorio) */}
                <div
                  onClick={() => setHeroProductMode("popular")}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all space-y-4 ${
                    heroProductMode === "popular"
                      ? "border-[#FF97A4] bg-pink-50/20 dark:bg-pink-950/20 shadow-md"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#12131A] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        <Flame size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1A1C1C] dark:text-white">
                          Top Populares (Rotación Aleatoria)
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Selecciona al azar un arreglo entre los más destacados en cada visita.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="heroModeRadio"
                      checked={heroProductMode === "popular"}
                      onChange={() => setHeroProductMode("popular")}
                      className="mt-1 text-[#FF97A4] focus:ring-[#FF97A4]"
                    />
                  </div>

                  {/* Selector de cantidad de populares */}
                  {heroProductMode === "popular" && (
                    <div className="pt-2 border-t border-pink-100 dark:border-gray-800 space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        Cantidad de Productos en Rotación:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 20, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHeroPopularCount(num);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
                              heroPopularCount === num
                                ? "bg-[#FF97A4] text-white shadow-sm"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-pink-300"
                            }`}
                          >
                            Top {num} Populares
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 block pt-1">
                        Cada visitante o recarga verá uno de los {heroPopularCount} productos más recientes y destacados.
                      </span>
                    </div>
                  )}
                </div>

                {/* Opción 2: Producto Específico Fijo */}
                <div
                  onClick={() => setHeroProductMode("single")}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all space-y-4 ${
                    heroProductMode === "single"
                      ? "border-[#FF97A4] bg-pink-50/20 dark:bg-pink-950/20 shadow-md"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#12131A] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                        <Award size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1A1C1C] dark:text-white">
                          Producto Específico Fijo
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Muestra siempre un producto exacto que tú elijas en la portada.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="heroModeRadio"
                      checked={heroProductMode === "single"}
                      onChange={() => setHeroProductMode("single")}
                      className="mt-1 text-[#FF97A4] focus:ring-[#FF97A4]"
                    />
                  </div>

                  {heroProductMode === "single" && (
                    <div className="pt-2 border-t border-purple-100 dark:border-gray-800 space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        Selecciona el Producto Fijo:
                      </label>
                      <select
                        value={heroProductId}
                        onChange={(e) => {
                          e.stopPropagation();
                          setHeroProductId(e.target.value);
                        }}
                        className="w-full p-3 border rounded-xl text-xs font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[#FF97A4]"
                      >
                        <option value="">-- Elige un producto del catálogo --</option>
                        {adminProducts.map((p) => (
                          <option key={String(p._id)} value={String(p._id)}>
                            {p.name} - ${Number(p.price || 0).toFixed(2)} USD
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Opción 3: Selección Manual con Palomitas Selectoras */}
                <div
                  onClick={() => setHeroProductMode("custom_list")}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all space-y-4 ${
                    heroProductMode === "custom_list"
                      ? "border-[#FF97A4] bg-pink-50/20 dark:bg-pink-950/20 shadow-md"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#12131A] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        <CheckSquare size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1A1C1C] dark:text-white">
                          Selección Manual con Palomitas Selectoras
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Marca con palomita exactamente cuáles productos deseas que roten en la portada.
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="heroModeRadio"
                      checked={heroProductMode === "custom_list"}
                      onChange={() => setHeroProductMode("custom_list")}
                      className="mt-1 text-[#FF97A4] focus:ring-[#FF97A4]"
                    />
                  </div>

                  {heroProductMode === "custom_list" && (
                    <div className="pt-3 border-t border-emerald-100 dark:border-gray-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {/* Barra de Filtro y Acciones Rápidas */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="relative flex-1">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Buscar producto por nombre..."
                            className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[#FF97A4]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 self-end">
                          <button
                            type="button"
                            onClick={selectAllProducts}
                            className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold rounded-lg text-gray-700 dark:text-gray-300"
                          >
                            Marcar Todos
                          </button>
                          <button
                            type="button"
                            onClick={deselectAllProducts}
                            className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-bold rounded-lg text-gray-700 dark:text-gray-300"
                          >
                            Desmarcar Todos
                          </button>
                        </div>
                      </div>

                      {/* Contador de seleccionados */}
                      <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                        <span>{heroCustomProductIds.length} producto(s) seleccionado(s) con palomita</span>
                        {heroCustomProductIds.length === 0 && (
                          <span className="text-amber-500 text-[11px]">⚠️ Sin selección (se usarán los más populares)</span>
                        )}
                      </div>

                      {/* Lista con scroll de productos y checkboxes */}
                      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 dark:border-gray-800 rounded-2xl p-2 bg-gray-50/50 dark:bg-gray-900/40">
                        {filteredProducts.map((p) => {
                          const id = String(p._id);
                          const isChecked = heroCustomProductIds.includes(id);
                          return (
                            <div
                              key={id}
                              onClick={() => toggleCustomProduct(id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700"
                                  : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                  isChecked ? "bg-emerald-600 text-white" : "border border-gray-300 dark:border-gray-600"
                                }`}>
                                  {isChecked && <Check size={14} />}
                                </div>
                                <img
                                  src={p.images?.[0] || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=100"}
                                  alt={p.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-stone-200 dark:border-gray-700"
                                />
                                <div>
                                  <span className="text-xs font-bold text-stone-900 dark:text-white block line-clamp-1">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    ${Number(p.price || 0).toFixed(2)} USD • {p.category || "General"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-[#FF97A4]">
                                {isChecked ? "Activo" : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Columna Derecha: Vista Previa en Vivo de Portada */}
              <div className="lg:col-span-5 bg-white dark:bg-[#12131A] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 lg:sticky lg:top-24">
                <div className="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-[#FF97A4]" />
                    <h3 className="font-serif font-black text-sm text-[#1A1C1C] dark:text-white">
                      Vista Previa Portada
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    En Vivo
                  </span>
                </div>

                <p className="text-[11px] text-gray-400">
                  Así se visualiza el círculo asimétrico con el producto actualmente configurado:
                </p>

                {/* Contenedor Mockup Círculo Hero */}
                <div className="relative flex justify-center items-center py-6">
                  <div className="relative w-full max-w-[280px] aspect-square rounded-full bg-gradient-to-tr from-[#FAF7F5] via-white to-pink-50 dark:from-[#12131A] dark:via-[#181922] dark:to-[#12131A] p-3 shadow-2xl border border-stone-200/80 dark:border-gray-800 group">
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                      <img
                        alt={previewProduct?.name || "Preview"}
                        className="w-full h-full object-cover"
                        src={previewProduct?.images?.[0] || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80&auto=format"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Badge 1 Preview */}
                    <div className="absolute -bottom-2 left-2 bg-white dark:bg-[#181922] px-3 py-2 rounded-xl shadow-lg border border-stone-200/80 dark:border-gray-700 flex items-center gap-2 max-w-[170px]">
                      <div className="w-7 h-7 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-[#FF97A4]/30 flex items-center justify-center text-[#B0004A] dark:text-[#FF97A4]">
                        <Award size={14} />
                      </div>
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-[8px] uppercase tracking-wider text-[#C5A059] font-extrabold truncate">
                          {previewProduct?.badge || "Haute Handcrafted"}
                        </span>
                        <span className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                          {previewProduct?.price ? `Desde $${Number(previewProduct.price).toFixed(2)} USD` : "Desde $99.99 USD"}
                        </span>
                      </div>
                    </div>

                    {/* Badge 2 Preview */}
                    <div className="absolute top-2 -right-1 bg-[#163422] text-white px-2.5 py-1 rounded-full shadow-md border border-[#C5A059]/40 flex items-center gap-1 text-[9px] font-bold">
                      <Truck size={10} className="text-[#C5A059]" />
                      <span>River Oaks</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-100 dark:border-gray-800 text-center">
                  <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 block truncate">
                    {previewProduct?.name || "Arreglo Floral"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                    Modo: {heroProductMode === "popular" ? `Top ${heroPopularCount} Populares` : heroProductMode === "single" ? "Producto Fijo" : `Personalizado (${heroCustomProductIds.length} seleccionados)`}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PESTAÑA 2: Logo, Lemas & Menú */}
        {activeTab === "branding" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Sección Logo & Subida de Imagen */}
            <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b pb-3 border-gray-100 dark:border-gray-800">
                <ImageIcon size={20} className="text-[#FF97A4]" />
                <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">Imagen del Logo Principal</h2>
              </div>
              <SingleImageUploader
                currentImage={config.logoUrl || "/logo.png"}
                label="Logo Principal VKA POS"
              />
              <input type="hidden" name="logoUrl" value={config.logoUrl || "/logo.png"} />
            </div>

            {/* Sección Lemas del Home & Footer */}
            <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b pb-3 border-gray-100 dark:border-gray-800">
                <Type size={20} className="text-[#FF97A4]" />
                <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">Lemas y Encabezados del Sistema</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Título Principal en Portada</label>
                  <input
                    name="heroTitle"
                    defaultValue={config.heroTitle || "VKA POS"}
                    className="p-3.5 border rounded-2xl text-sm font-bold dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Lema Secundario de Cabecera</label>
                  <input
                    name="brandSlogan"
                    defaultValue={config.brandSlogan || "Punto de Venta & Retail Omnicanal"}
                    className="p-3.5 border rounded-2xl text-sm font-medium dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Eslogan del Home (Párrafo Hero)</label>
                <textarea
                  name="heroSlogan"
                  defaultValue={config.heroSlogan || "Sistema integral de punto de venta, facturación rápida, inventario y retail con despacho local."}
                  className="p-3.5 border rounded-2xl text-xs h-20 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Texto del Botón Hero (CTA)</label>
                  <input
                    name="heroButtonText"
                    defaultValue={config.heroButtonText || "Explorar Productos"}
                    className="p-3.5 border rounded-2xl text-xs font-bold dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nombre en Pie de Página (Footer)</label>
                  <input
                    name="footerTitle"
                    defaultValue={config.footerTitle || "VKA POS"}
                    className="p-3.5 border rounded-2xl text-xs font-bold dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Lema del Footer</label>
                <input
                  name="footerSlogan"
                  defaultValue={config.footerSlogan || "Punto de Venta, Facturación & Retail"}
                  className="p-3.5 border rounded-2xl text-xs font-medium dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Texto de Derechos Reservados (Copyright)</label>
                <input
                  name="footerCopyright"
                  defaultValue={config.footerCopyright || "© 2026 VKA POS. Todos los derechos reservados."}
                  className="p-3.5 border rounded-2xl text-xs font-medium dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF97A4]"
                  required
                />
              </div>
            </div>

            {/* Sección Etiquetas de Menú de Navegación */}
            <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b pb-3 border-gray-100 dark:border-gray-800">
                <Menu size={20} className="text-[#FF97A4]" />
                <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">Nombres del Menú de Navegación</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500">Menú 1</label>
                  <input
                    name="menuHomeLabel"
                    defaultValue={config.menuHomeLabel || "Inicio"}
                    className="p-3 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500">Menú 2</label>
                  <input
                    name="menuCatalogLabel"
                    defaultValue={config.menuCatalogLabel || "Colección"}
                    className="p-3 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500">Menú 3</label>
                  <input
                    name="menuTrackingLabel"
                    defaultValue={config.menuTrackingLabel || "📦 Rastreo"}
                    className="p-3 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500">Menú 4</label>
                  <input
                    name="menuAboutLabel"
                    defaultValue={config.menuAboutLabel || "Nosotros"}
                    className="p-3 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-500">Menú 5</label>
                  <input
                    name="menuContactLabel"
                    defaultValue={config.menuContactLabel || "Contacto"}
                    className="p-3 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: Reseñas & Trustpilot */}
        {activeTab === "reviews" && (
          <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <Star size={22} className="text-amber-400 fill-amber-400" />
                <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                  Módulo de Reseñas, Calificaciones & Trustpilot
                </h2>
              </div>

              {/* Interruptor Toggle ON/OFF */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
                  {config.enableReviewsSection !== false ? "ACTIVADO [ON]" : "DESACTIVADO [OFF]"}
                </span>
                <input
                  type="checkbox"
                  checked={config.enableReviewsSection !== false}
                  onChange={(e) => setConfig({ ...config, enableReviewsSection: e.target.checked })}
                  className="w-5 h-5 accent-[#FF97A4] rounded cursor-pointer"
                />
                <input type="hidden" name="enableReviewsSection" value={config.enableReviewsSection !== false ? "true" : "false"} />
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Muestra opiniones reales ⭐⭐⭐⭐⭐ de clientes satisfechos con insignia de "Compra Verificada". Además, si cuentas con un widget incrustado de <strong>Trustpilot</strong> o <strong>Google Reviews</strong>, puedes pegar el código abajo sin costo adicional.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Título del Bloque de Reseñas</label>
                <input
                  name="reviewsTitle"
                  defaultValue={config.reviewsTitle || "Lo que dicen nuestros clientes en Houston ⭐⭐⭐⭐⭐"}
                  className="p-3.5 border rounded-2xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Puntuación Destacada (Estrellas)</label>
                  <input
                    name="reviewsRatingScore"
                    defaultValue={config.reviewsRatingScore || "4.9 / 5.0"}
                    placeholder="Ej: 4.9 / 5.0"
                    className="p-3.5 border rounded-2xl text-xs font-extrabold dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Texto de Total de Opiniones</label>
                  <input
                    name="reviewsCountText"
                    defaultValue={config.reviewsCountText || "+180 Opiniones Verificadas"}
                    placeholder="Ej: +180 Opiniones Verificadas"
                    className="p-3.5 border rounded-2xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Globe size={14} className="text-emerald-500" /> Código de Widget Opcional (Trustpilot / Google Reviews)
                </label>
                <textarea
                  name="trustpilotWidgetHtml"
                  defaultValue={config.trustpilotWidgetHtml || ""}
                  placeholder='Pega aquí el código HTML del Widget / Trustbox de Trustpilot o Google Reviews si dispones de él...'
                  className="p-3.5 border rounded-2xl text-xs font-mono h-28 dark:bg-gray-900 dark:text-white"
                />
                <span className="text-[11px] text-gray-400">
                  💡 Si lo dejas vacío, la tienda mostrará el elegante diseño nativo de reseñas verificadas con 5 estrellas sin costo.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: Redes Sociales & Feed Social */}
        {activeTab === "social" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Redes Sociales en la Cabecera (Toggle ON/OFF) */}
            <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Share2 size={20} className="text-[#FF97A4]" />
                  <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                    Íconos de Redes Sociales en Cabecera
                  </h2>
                </div>

                {/* Interruptor Toggle ON/OFF */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
                    {config.enableHeaderSocials !== false ? "ACTIVADO [ON]" : "DESACTIVADO [OFF]"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.enableHeaderSocials !== false}
                    onChange={(e) => setConfig({ ...config, enableHeaderSocials: e.target.checked })}
                    className="w-5 h-5 accent-[#FF97A4] rounded cursor-pointer"
                  />
                  <input type="hidden" name="enableHeaderSocials" value={config.enableHeaderSocials !== false ? "true" : "false"} />
                </label>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Al activar este módulo, se renderizarán los íconos directos de tus redes sociales a la izquierda del menú flotante.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">URL de Instagram</label>
                  <input
                    name="instagramUrl"
                    defaultValue={config.instagramUrl || "https://www.instagram.com/bonbonflowers__?stkn=MXBnc3hsbHVlM3psMQ=="}
                    placeholder="https://www.instagram.com/bonbonflowers__?stkn=MXBnc3hsbHVlM3psMQ=="
                    className="p-3 border rounded-xl text-xs font-medium dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">URL de Facebook</label>
                  <input
                    name="facebookUrl"
                    defaultValue={config.facebookUrl || "https://www.facebook.com/bonbon.flowers.2025"}
                    placeholder="https://www.facebook.com/bonbon.flowers.2025"
                    className="p-3 border rounded-xl text-xs font-medium dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">URL de TikTok</label>
                  <input
                    name="tiktokUrl"
                    defaultValue={config.tiktokUrl || "https://tiktok.com"}
                    placeholder="https://tiktok.com/@bonbonflowers__"
                    className="p-3 border rounded-xl text-xs font-medium dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">WhatsApp Directo</label>
                  <input
                    name="whatsappUrl"
                    defaultValue={config.whatsappUrl || "https://wa.me/13467392730"}
                    placeholder="https://wa.me/13467392730"
                    className="p-3 border rounded-xl text-xs font-medium dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Módulo Social Pre-Footer Instagram / TikTok (Toggle ON/OFF) */}
            <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={20} className="text-[#FF97A4]" />
                  <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                    Publicaciones Incrustadas de Instagram / TikTok (Pre-Footer)
                  </h2>
                </div>

                {/* Interruptor Toggle ON/OFF */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
                    {config.enableSocialFeed ? "ACTIVADO [ON]" : "DESACTIVADO [OFF]"}
                  </span>
                  <input
                    type="checkbox"
                    checked={!!config.enableSocialFeed}
                    onChange={(e) => setConfig({ ...config, enableSocialFeed: e.target.checked })}
                    className="w-5 h-5 accent-[#FF97A4] rounded cursor-pointer"
                  />
                  <input type="hidden" name="enableSocialFeed" value={config.enableSocialFeed ? "true" : "false"} />
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Título de la Sección Social</label>
                  <input
                    name="socialFeedTitle"
                    defaultValue={config.socialFeedTitle || "Síguenos en Instagram & TikTok 📸"}
                    className="p-3.5 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Códigos Incrustados de Instagram (Multi-Embed Slider)
                  </label>
                  <textarea
                    name="socialEmbedHtml"
                    defaultValue={config.socialEmbedHtml || ""}
                    placeholder='Pega aquí 1 o varios códigos de Instagram (<blockquote class="instagram-media">...). Puedes pegar varios uno debajo del otro o separados por "---" para crear un Slider con múltiples publicaciones reales.'
                    className="p-3.5 border rounded-2xl text-xs font-mono h-36 dark:bg-gray-900 dark:text-white"
                  />
                  <span className="text-[11px] text-gray-400">
                    💡 Si pegas 2 o más códigos de incrustación de Instagram, la tienda generará automáticamente un Slider interactivo con flechas y puntos para recorrer todas tus publicaciones reales.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: Módulo de iFrames / Widgets */}
        {activeTab === "iframe" && (
          <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <Globe size={20} className="text-[#FF97A4]" />
                <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                  Módulo de iFrames / Widgets Externos
                </h2>
              </div>

              {/* Interruptor Toggle ON/OFF */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
                  {config.enableCustomIframe ? "ACTIVADO [ON]" : "DESACTIVADO [OFF]"}
                </span>
                <input
                  type="checkbox"
                  checked={!!config.enableCustomIframe}
                  onChange={(e) => setConfig({ ...config, enableCustomIframe: e.target.checked })}
                  className="w-5 h-5 accent-[#FF97A4] rounded cursor-pointer"
                />
                <input type="hidden" name="enableCustomIframe" value={config.enableCustomIframe ? "true" : "false"} />
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usa este módulo si el jefe o administrador desea integrar mapas interactivos de Google Maps, sistemas de reservación, videos promocionales de YouTube/Vimeo o widgets externos directamente en la portada.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Título de la Sección del Widget</label>
                <input
                  name="customIframeTitle"
                  defaultValue={config.customIframeTitle || "Ubicación & Promociones Destacadas"}
                  className="p-3.5 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Código HTML / iFrame del Widget
                </label>
                <textarea
                  name="customIframeHtml"
                  defaultValue={config.customIframeHtml || ""}
                  placeholder='Pega aquí el código <iframe src="https://www.google.com/maps/embed?..." width="100%" height="450"></iframe>'
                  className="p-3.5 border rounded-2xl text-xs font-mono h-36 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 6: Chatbot Inteligente Dialogflow CX */}
        {activeTab === "chatbot" && (
          <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-50 dark:bg-pink-950/60 rounded-2xl text-[#8B0024] dark:text-pink-300">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="font-serif font-black text-lg text-[#1A1C1C] dark:text-white">
                    Chatbot Inteligente con Dialogflow CX
                  </h2>
                  <span className="text-[11px] font-bold text-gray-400">Atención al Cliente Automatizada 24/7</span>
                </div>
              </div>

              {/* Interruptor Toggle ON/OFF */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
                  {config.enableChatbot !== false ? "ACTIVADO [ON]" : "DESACTIVADO [OFF]"}
                </span>
                <input
                  type="checkbox"
                  checked={config.enableChatbot !== false}
                  onChange={(e) => setConfig({ ...config, enableChatbot: e.target.checked })}
                  className="w-5 h-5 accent-[#FF97A4] rounded cursor-pointer"
                />
                <input type="hidden" name="enableChatbot" value={config.enableChatbot !== false ? "true" : "false"} />
              </label>
            </div>

            {/* SECCIÓN NUEVA: MODO VISUAL Y COMPORTAMIENTO MÓVIL */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181922] border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#FF97A4]" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Apariencia de la Burbuja Solapada (Colapsada)
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Draggable Activo Siempre
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opción 1: Modo Mini */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer">
                      <span>Modo Mini / Ultra-Discreto (Solo Avatar)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={config.chatbotMiniMode === true}
                      onChange={(e) => setConfig({ ...config, chatbotMiniMode: e.target.checked })}
                      className="w-4 h-4 accent-[#FF97A4] rounded cursor-pointer"
                    />
                    <input type="hidden" name="chatbotMiniMode" value={config.chatbotMiniMode ? "true" : "false"} />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Oculta las frases y tickers de texto cuando el chat está cerrado. Muestra únicamente una burbuja circular dorada compacta para no obstruir botones ni elementos de la tienda.
                  </p>
                </div>

                {/* Opción 2: Posición Inicial */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 space-y-2">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                    Posición Inicial por Defecto
                  </label>
                  <select
                    name="chatbotInitialPosition"
                    value={config.chatbotInitialPosition || "bottom-right"}
                    onChange={(e) => setConfig({ ...config, chatbotInitialPosition: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 font-semibold"
                  >
                    <option value="bottom-right">Esquina Inferior Derecha (Por defecto)</option>
                    <option value="bottom-left">Esquina Inferior Izquierda</option>
                  </select>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Lugar donde aparece la burbuja al cargar la página por primera vez.
                  </p>
                </div>
              </div>

              {/* Callout de Comportamiento Draggable */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2.5">
                <span className="text-base">🖐️</span>
                <div className="leading-relaxed">
                  <strong>Arrastre Libre (Draggable) en Móviles y Desktop:</strong> El cliente puede tocar y arrastrar la burbuja en cualquier momento a cualquier lado de la pantalla si se atraviesa con el botón de &quot;Añadir al carrito&quot; o el pop-up de bonus de $10. La posición se recuerda mientras navega la tienda.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 text-xs text-slate-700 dark:text-gray-300 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-[#8B0024] dark:text-pink-300">
                <Sparkles size={14} /> ¿Cómo conectar tu Agente de Dialogflow CX (Google Cloud)?
              </p>
              <p className="leading-relaxed">
                1. Ingresa a <strong>Google Cloud Console / Dialogflow CX Console</strong> y crea o selecciona tu agente.
                <br />
                2. En la pestaña <strong>Integrations</strong>, habilita <strong>Dialogflow CX Messenger</strong>.
                <br />
                3. Copia el <code>Agent ID</code> y <code>Project ID</code> y pégalos aquí abajo. Si dejas los campos vacíos, el sistema usará automáticamente el <strong>Asistente Boutique Nativo</strong> integrado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Agent ID (Dialogflow CX)
                </label>
                <input
                  name="dialogflowAgentId"
                  defaultValue={config.dialogflowAgentId || ""}
                  placeholder="ej. 8a3f6b92-4c12-4d89-98a2-..."
                  className="p-3.5 border rounded-xl text-xs font-mono dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Project ID (Google Cloud)
                </label>
                <input
                  name="dialogflowProjectId"
                  defaultValue={config.dialogflowProjectId || ""}
                  placeholder="ej. bonbon-flowers-bot-12345"
                  className="p-3.5 border rounded-xl text-xs font-mono dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Región / Location
                </label>
                <input
                  name="dialogflowLocation"
                  defaultValue={config.dialogflowLocation || "us-central1"}
                  placeholder="us-central1 o global"
                  className="p-3.5 border rounded-xl text-xs font-medium dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Idioma Predeterminado
                </label>
                <input
                  name="dialogflowLanguageCode"
                  defaultValue={config.dialogflowLanguageCode || "es"}
                  placeholder="es o en"
                  className="p-3.5 border rounded-xl text-xs font-medium dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Título de la Ventana del Chat
                </label>
                <input
                  name="dialogflowChatTitle"
                  defaultValue={config.dialogflowChatTitle || "Asistente Virtual • VKA POS 💼"}
                  placeholder="Asistente Virtual • VKA POS 💼"
                  className="p-3.5 border rounded-xl text-xs font-bold dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Clave de Google Gemini API */}
              <div className="flex flex-col gap-1.5 md:col-span-2 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
                <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-500" />
                  Google Gemini API Key (Motor de IA para Flor y Flor Co-Pilot)
                </label>
                <input
                  type="password"
                  name="geminiApiKey"
                  defaultValue={config.geminiApiKey || ""}
                  placeholder="Pega aquí tu clave de Google AI Studio (ej. AIzaSy...)"
                  className="p-3.5 border rounded-xl text-xs font-mono dark:bg-gray-900 dark:text-white"
                />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Permite que Flor responda con inteligencia artificial en tiempo real a clientes y administradores. Si no tienes una variable en Vercel, puedes configurarla directamente aquí.
                </span>
              </div>

              {/* Clave Pública de Mapbox para Checkout & GPS */}
              <div className="flex flex-col gap-1.5 md:col-span-2 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-500" />
                  Mapbox Public Access Token (Autocompletado y Mapas del Checkout)
                </label>
                <input
                  type="text"
                  name="mapboxToken"
                  defaultValue={config.mapboxToken || ""}
                  placeholder="pk.eyJ..."
                  className="p-3.5 border rounded-xl text-xs font-mono dark:bg-gray-900 dark:text-white"
                />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Token oficial de Mapbox para búsqueda de direcciones en Houston, pin interactivo arrastrable y cálculo exacto de millas por carretera (Directions API).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 7: Seguridad 2FA */}
        {activeTab === "security" && (
          <div className="animate-in fade-in duration-200">
            <TwoFactorConfigSection config={config} onSaveSuccess={loadConfig} />
          </div>
        )}

        {/* Botón Flotante para Guardar Cambios del Editor Global */}
        {activeTab !== "security" && (
          <div className="sticky bottom-4 z-30 flex justify-between items-center bg-white/95 dark:bg-[#12131A]/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={16} /> ¡Configuración del Home actualizada correctamente!
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-medium">Los cambios se aplican al instante en la tienda sin romper nada.</span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-[#FF97A4] text-white px-8 py-3.5 rounded-full text-xs font-black hover:bg-[#B0004A] transition-all shadow-lg shadow-pink-500/20 disabled:bg-gray-400 flex items-center gap-2 ml-auto hover:scale-105 active:scale-95"
            >
              <Save size={16} />
              {saving ? "Guardando Cambios..." : "Guardar Configuración del Home"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function TwoFactorConfigSection({ config, onSaveSuccess }: { config: any; onSaveSuccess: () => void }) {
  const [mode, setMode] = useState<"none" | "pin" | "totp">(config.twoFactorMode || "none");
  const [pin, setPin] = useState(config.twoFactorPin || "");
  const [secret, setSecret] = useState(config.twoFactorSecret || "");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const [saving2FA, setSaving2FA] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);

  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testSuccess, setTestSuccess] = useState(false);
  const [testingCode, setTestingCode] = useState(false);

  useEffect(() => {
    if (config?.twoFactorMode) setMode(config.twoFactorMode);
    if (config?.twoFactorPin) setPin(config.twoFactorPin);
    if (config?.twoFactorSecret) setSecret(config.twoFactorSecret);
  }, [config?.twoFactorMode, config?.twoFactorPin, config?.twoFactorSecret]);

  useEffect(() => {
    if ((config?.twoFactorMode === "totp" || mode === "totp") && !qrCodeUrl) {
      loadTotpData(false);
    }
  }, [config?.twoFactorMode, mode, qrCodeUrl]);

  async function loadTotpData(forceNew: boolean = false) {
    setGeneratingQR(true);
    setErrorMsg("");
    setTestResult("");
    const res = await getOrCreateTotpSecretAction(forceNew);
    setGeneratingQR(false);

    if (res.success && res.secret && res.qrCodeUrl) {
      setSecret(res.secret);
      setQrCodeUrl(res.qrCodeUrl);
    } else {
      setErrorMsg(res.error || "No se pudo cargar el Código QR.");
    }
  }

  async function handleTestCode() {
    if (!secret || !testCode) return;
    setTestingCode(true);
    setTestResult("");
    const res = await test2FACodeAction(secret, testCode);
    setTestingCode(false);

    if (res.success) {
      setTestSuccess(true);
      setTestResult(res.message || "¡Código verificado con éxito!");
    } else {
      setTestSuccess(false);
      setTestResult(res.error || "Código incorrecto.");
    }
  }

  async function handleSave2FA(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    setSaving2FA(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.set("twoFactorMode", mode);
    formData.set("twoFactorPin", pin);
    formData.set("twoFactorSecret", secret);

    const result = await update2FASettingsAction(formData);
    setSaving2FA(false);

    if (result.success) {
      setSuccessMsg("¡Configuración de seguridad 2FA actualizada correctamente!");
      setTimeout(() => setSuccessMsg(""), 3500);
      onSaveSuccess();
    } else {
      setErrorMsg(result.error || "Error al actualizar 2FA.");
    }
  }

  return (
    <div className="bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-3 border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} className="text-[#FF97A4]" />
          <h2 className="font-bold text-base text-[#1A1C1C] dark:text-white">Seguridad & Verificación en 2 Pasos (2FA)</h2>
        </div>
        <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
          100% Gratuito ($0 USD)
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Protege el acceso al Panel Administrador. En caso de emergencia o desincronización de hora, siempre dispones del botón de <strong>Recuperación por Correo Electronico</strong>.
      </p>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-green-50 text-green-700 text-xs font-bold rounded-2xl border border-green-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Selector de Modos 2FA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Opción 1: Desactivado */}
        <label
          onClick={() => setMode("none")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            mode === "none"
              ? "border-[#FF97A4] bg-pink-50/20 dark:bg-pink-950/20 shadow-sm"
              : "border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-gray-50/50 dark:bg-gray-900/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <Lock size={18} />
            </div>
            <input type="radio" name="modeSelect" checked={mode === "none"} onChange={() => setMode("none")} className="sr-only" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#1A1C1C] dark:text-white block">❌ Desactivado</span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">Acceso solo con contraseña principal</span>
          </div>
        </label>

        {/* Opción 2: PIN Secundario */}
        <label
          onClick={() => setMode("pin")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            mode === "pin"
              ? "border-[#FF97A4] bg-pink-50/20 dark:bg-pink-950/20 shadow-sm"
              : "border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-gray-50/50 dark:bg-gray-900/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
              <Key size={18} />
            </div>
            <input type="radio" name="modeSelect" checked={mode === "pin"} onChange={() => setMode("pin")} className="sr-only" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#1A1C1C] dark:text-white block">🔑 PIN Secundario</span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">Clave de 6 dígitos que defines aquí</span>
          </div>
        </label>

        {/* Opción 3: App Autenticadora */}
        <label
          onClick={() => {
            setMode("totp");
            if (!secret) loadTotpData(false);
          }}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            mode === "totp"
              ? "border-[#FF97A4] bg-pink-50/20 dark:bg-pink-950/20 shadow-sm"
              : "border-gray-100 dark:border-gray-800 hover:border-gray-200 bg-gray-50/50 dark:bg-gray-900/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
              <Smartphone size={18} />
            </div>
            <input type="radio" name="modeSelect" checked={mode === "totp"} onChange={() => setMode("totp")} className="sr-only" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#1A1C1C] dark:text-white block">📱 App Autenticadora</span>
            <span className="text-[11px] text-gray-400 font-medium block mt-0.5">Google Authenticator / Authy</span>
          </div>
        </label>
      </div>

      {/* Configuración según el modo seleccionado */}
      {mode === "pin" && (
        <div className="p-5 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-3 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
            <Key size={14} /> Define tu PIN de Seguridad Maestro (6 dígitos numéricos)
          </label>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej: 849204"
            className="p-3.5 border rounded-xl text-center font-mono font-extrabold tracking-widest text-lg w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#FF97A4] dark:bg-gray-900 dark:text-white"
          />
          <p className="text-[11px] text-purple-700 dark:text-purple-300">
            Al iniciar sesión, el sistema te solicitará tu contraseña principal y luego este PIN de 6 dígitos.
          </p>
        </div>
      )}

      {mode === "totp" && (
        <div className="p-5 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {qrCodeUrl ? (
              <div className="bg-white p-3 rounded-2xl border shadow-sm flex flex-col items-center flex-shrink-0">
                <img src={qrCodeUrl} alt="Código QR 2FA" className="w-40 h-40 object-contain rounded-xl" />
                <span className="text-[10px] text-gray-500 font-bold mt-1">Escanea con tu teléfono</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => loadTotpData(false)}
                disabled={generatingQR}
                className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <QrCode size={16} />
                {generatingQR ? "Cargando QR..." : "Cargar Código QR"}
              </button>
            )}

            <div className="space-y-2 text-xs text-blue-900 dark:text-blue-200 w-full">
              <span className="font-bold block text-sm">Pasos para vincular tu teléfono:</span>
              <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-300 font-medium">
                <li>Abre <strong>Google Authenticator</strong>, <strong>Authy</strong> o Contraseñas de Apple en tu celular.</li>
                <li>Toca el botón <strong>"+"</strong> y selecciona <strong>"Escanear código QR"</strong>.</li>
                <li>Apunta tu cámara al código QR de la izquierda.</li>
              </ol>
              {secret && (
                <div className="pt-2 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Clave Secreta Manual Permanente:</span>
                      <code className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg font-mono font-bold text-gray-800 dark:text-gray-100 border text-xs inline-block mt-1 tracking-wider select-all">
                        {secret}
                      </code>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadTotpData(true)}
                      disabled={generatingQR}
                      className="text-[11px] font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1 mt-3 sm:mt-4 transition-colors"
                    >
                      <RefreshCw size={12} className={generatingQR ? "animate-spin" : ""} />
                      Regenerar Nuevo QR
                    </button>
                  </div>

                  {/* Probador en Vivo del Código */}
                  <div className="pt-2 border-t border-blue-100 dark:border-blue-900/50 space-y-2">
                    <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                      Prueba los 6 dígitos que muestra tu app ahora mismo:
                    </span>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        maxLength={6}
                        value={testCode}
                        onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="0 0 0 0 0 0"
                        className="p-2.5 border rounded-xl text-center font-mono font-extrabold text-base tracking-widest bg-white dark:bg-gray-900 dark:text-white w-36 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                      />
                      <button
                        type="button"
                        onClick={handleTestCode}
                        disabled={testingCode || testCode.length < 6}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-1.5"
                      >
                        {testingCode ? "Probando..." : "Probar Código"}
                      </button>
                    </div>

                    {testResult && (
                      <p className={`text-xs font-bold mt-1 ${testSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {testSuccess ? "✓ " : "✗ "}{testResult}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón para Guardar Configuración de 2FA */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave2FA}
          disabled={saving2FA}
          className="bg-[#1A1C1C] dark:bg-white text-white dark:text-gray-900 px-7 py-3 rounded-full text-xs font-bold hover:bg-black dark:hover:bg-gray-100 transition-all shadow-sm flex items-center gap-2"
        >
          <ShieldCheck size={16} className="text-[#FF97A4]" />
          {saving2FA ? "Guardando 2FA..." : "Guardar Ajustes de Seguridad (2FA)"}
        </button>
      </div>
    </div>
  );
}
