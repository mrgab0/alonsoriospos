"use client";

import React, { useState, useEffect } from "react";
import { getPosts, createPost, updatePost, deletePost } from "@/lib/actions/post";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  FileText,
  Image as ImageIcon,
  Bot,
  Send,
  X,
  Eye,
  RefreshCw,
  BookOpen
} from "lucide-react";
import Link from "next/link";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState<"all" | "es" | "en">("all");
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Estado del Formulario
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    mainImage: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200&auto=format&fit=crop&q=80",
    published: true,
    language: "es" as "es" | "en"
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Estado del Asistente IA
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiLanguage, setAiLanguage] = useState<"es" | "en">("es");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [autopilotPublishing, setAutopilotPublishing] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState("");

  // Cargar Posts al iniciar
  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const res = await getPosts();
    if (res.success && res.data) {
      setPosts(res.data);
    }
    setLoading(false);
  }

  function handleCreateNew() {
    setEditingId(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      mainImage: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200&auto=format&fit=crop&q=80",
      published: true,
      language: "es"
    });
    setIsEditing(true);
  }

  function handleEditPost(post: any) {
    setEditingId(post._id);
    setFormData({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      mainImage: post.mainImage || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200&auto=format&fit=crop&q=80",
      published: post.published !== false,
      language: post.language || "es"
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setNotification({ type: "error", message: "El título y el contenido son obligatorios." });
      return;
    }

    setSaving(true);
    let res;
    if (editingId) {
      res = await updatePost(editingId, formData);
    } else {
      res = await createPost(formData);
    }
    setSaving(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: editingId ? "¡Artículo actualizado con éxito!" : "¡Artículo creado y publicado con éxito!"
      });
      setIsEditing(false);
      setEditingId(null);
      loadPosts();
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({ type: "error", message: res.error || "Ocurrió un error al guardar el post." });
    }
  }

  async function handleDeletePost(id: string, title: string) {
    if (!confirm(`¿Estás seguro de eliminar el artículo "${title}"?`)) return;

    const res = await deletePost(id);
    if (res.success) {
      setNotification({ type: "success", message: "Artículo eliminado correctamente." });
      loadPosts();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "No se pudo eliminar el artículo." });
    }
  }

  // Generador IA con Gemini
  async function handleGenerateWithAi() {
    if (!aiPrompt.trim()) {
      setAiError("Por favor ingresa un tema, idea o producto.");
      return;
    }

    setGeneratingAi(true);
    setAiError("");
    setGeneratedResult(null);

    try {
      const response = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt.trim(),
          keywords: aiKeywords.trim(),
          language: aiLanguage
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.post) {
        setGeneratedResult(data.post);
      } else {
        setAiError(data.error || "Error al generar contenido con la IA.");
      }
    } catch (err: any) {
      setAiError("Error de conexión con el servidor. Intenta de nuevo.");
    } finally {
      setGeneratingAi(false);
    }
  }

  // Generador Autopilot 1-Clic: Redacta y publica directamente en la base de datos
  async function handleGenerateAndPublishAutopilot() {
    if (!aiPrompt.trim()) {
      setAiError("Por favor ingresa un tema, idea o producto.");
      return;
    }

    setAutopilotPublishing(true);
    setAiError("");
    setGeneratedResult(null);

    try {
      const response = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiPrompt.trim(),
          keywords: aiKeywords.trim(),
          language: aiLanguage
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.post) {
        const post = data.post;
        const res = await createPost({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          mainImage: post.suggestedImage || "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1200&auto=format&fit=crop&q=80",
          published: true,
          language: aiLanguage || "es"
        });

        if (res.success) {
          setIsAiModalOpen(false);
          setAiPrompt("");
          setAiKeywords("");
          setNotification({
            type: "success",
            message: `🚀 ¡Post Autopilot publicado con éxito! "${post.title}"`
          });
          loadPosts();
          setTimeout(() => setNotification(null), 5000);
        } else {
          setAiError(res.error || "Artículo generado pero ocurrió un error al guardarlo.");
        }
      } else {
        setAiError(data.error || "Error al generar contenido con la IA.");
      }
    } catch (err: any) {
      setAiError("Error de conexión al procesar el modo Autopilot.");
    } finally {
      setAutopilotPublishing(false);
    }
  }

  // Traducción 1-Clic con IA a Inglés o Español
  async function handleTranslatePost(post: any) {
    const targetLang = post.language === "en" ? "es" : "en";
    const targetLabel = targetLang === "en" ? "Inglés 🇺🇸" : "Español 🇲🇽";

    if (!confirm(`¿Deseas traducir el artículo "${post.title}" al ${targetLabel} con IA y publicarlo automáticamente en el blog?`)) {
      return;
    }

    setTranslatingId(post._id);
    setNotification(null);

    try {
      const response = await fetch("/api/admin/blog/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          targetLanguage: targetLang
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNotification({
          type: "success",
          message: `✨ ¡Artículo traducido al ${targetLabel} con éxito! "${data.post?.title}"`
        });
        loadPosts();
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: "error",
          message: data.error || "Ocurrió un error al traducir el artículo."
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: "Error de conexión al procesar la traducción con IA."
      });
    } finally {
      setTranslatingId(null);
    }
  }

  // Aplicar borrador de la IA al formulario
  function handleApplyAiResult() {
    if (!generatedResult) return;

    setFormData({
      title: generatedResult.title || formData.title,
      slug: generatedResult.slug || formData.slug,
      excerpt: generatedResult.excerpt || formData.excerpt,
      content: generatedResult.content || formData.content,
      mainImage: generatedResult.suggestedImage || formData.mainImage,
      published: true,
      language: aiLanguage || "es"
    });

    setIsAiModalOpen(false);
    setIsEditing(true);
    setNotification({
      type: "success",
      message: "¡Artículo generado por IA transferido al editor! Puedes revisarlo y guardarlo."
    });
    setTimeout(() => setNotification(null), 4000);
  }

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (languageFilter === "all") return true;
    if (languageFilter === "en") return p.language === "en";
    return p.language !== "en";
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-950/80 text-[#8B0024] dark:text-pink-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <BookOpen size={14} />
            <span>SEO & Marketing de Contenidos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 dark:!text-white">
            Blogger & Redacción de Artículos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mt-1 font-medium">
            Crea y administra publicaciones para la sección <span className="font-bold text-[#8B0024] dark:text-pink-300">/nosotros</span>. Estos artículos impulsan el posicionamiento de VKA POS en Google.
          </p>
        </div>

        {/* Botones de Acción Superior */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95"
          >
            <Sparkles size={16} />
            <span>Asistente IA VKA ✨</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[#1A1C1C] dark:bg-gray-800 hover:bg-[#8B0024] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Nuevo Artículo</span>
          </button>

          <Link
            href="/nosotros"
            target="_blank"
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 px-3.5 py-2.5 rounded-xl font-bold text-xs border border-gray-300 dark:border-gray-700 transition-all"
          >
            <span>Ver Blog Online</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Notificaciones */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
      {isEditing && (
        <div className="bg-white dark:bg-[#181922] p-6 sm:p-8 rounded-3xl border border-pink-200 dark:border-gray-800 shadow-lg space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-xl font-serif font-black text-gray-900 dark:!text-white flex items-center gap-2">
              <Edit3 size={20} className="text-[#FF97A4]" />
              <span>{editingId ? "Editar Artículo" : "Redactar Nuevo Artículo"}</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSavePost} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Título del Artículo (SEO H1) *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    setFormData({ ...formData, title, slug: editingId ? formData.slug : slug });
                  }}
                  placeholder="Ej: Los Mejores Arreglos Florales para Aniversario en Houston"
                  className="w-full p-3.5 border rounded-2xl text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  URL Amigable (Slug) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ej: mejores-arreglos-aniversario-houston"
                  className="w-full p-3.5 border rounded-2xl text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                  required
                />
              </div>

              {/* Imagen Principal */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  URL de Imagen Principal
                </label>
                <input
                  type="text"
                  value={formData.mainImage}
                  onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3.5 border rounded-2xl text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                />
              </div>

              {/* Idioma de Publicación */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Idioma de Publicación *
                </label>
                <select
                  value={formData.language}
                  onChange={(e: any) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full p-3.5 border rounded-2xl text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                >
                  <option value="es">Español 🇲🇽 (Se publicará en /nosotros)</option>
                  <option value="en">Inglés 🇺🇸 (Se publicará en /en/nosotros)</option>
                </select>
              </div>
            </div>

            {/* Resumen / Meta Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Resumen del Post (Meta Descripción para Google - máx 160 caracteres)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                maxLength={200}
                placeholder="Breve resumen persuasivo que aparecerá en Google y en la tarjeta del blog..."
                className="w-full p-3.5 border rounded-2xl text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
              />
              <span className="text-[11px] text-gray-500 font-medium">
                {formData.excerpt.length}/160 caracteres recomendados
              </span>
            </div>

            {/* Contenido Completo en Markdown */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Contenido del Artículo (Formato Markdown) *
                </label>
                <span className="text-[11px] text-gray-500 font-medium">
                  Usa ## para subtítulos, - para viñetas y **texto** para negritas
                </span>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                placeholder="Escribe el artículo aquí..."
                className="w-full p-4 border rounded-2xl text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
                required
              />
            </div>

            {/* Estado Publicado y Botones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 text-[#FF97A4] rounded border-gray-300 focus:ring-[#FF97A4]"
                />
                <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Publicar de inmediato en la tienda online
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#8B0024] hover:bg-[#B0004A] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar Post" : "Publicar Artículo"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y FILTROS POR IDIOMA */}
      <div className="bg-white dark:bg-[#181922] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, contenido o slug..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF97A4]"
          />
        </div>

        {/* Pestañas de Filtro por Idioma */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setLanguageFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
              languageFilter === "all"
                ? "bg-[#163422] text-white border-[#163422] shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200"
            }`}
          >
            Todos ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setLanguageFilter("es")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
              languageFilter === "es"
                ? "bg-[#163422] text-white border-[#163422] shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200"
            }`}
          >
            Español 🇲🇽 ({posts.filter((p) => p.language !== "en").length})
          </button>
          <button
            type="button"
            onClick={() => setLanguageFilter("en")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
              languageFilter === "en"
                ? "bg-[#163422] text-white border-[#163422] shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200"
            }`}
          >
            English 🇺🇸 ({posts.filter((p) => p.language === "en").length})
          </button>
        </div>
      </div>

      {/* LISTADO DE ARTÍCULOS */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-2 text-[#FF97A4]" size={28} />
          <p className="text-sm font-bold">Cargando publicaciones del blog...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#181922] rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
          <FileText className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No hay artículos que coincidan</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Puedes redactar un nuevo artículo o usar el Asistente IA para generar uno en segundos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post._id || post.slug}
              className="bg-white dark:bg-[#181922] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
            >
              {/* Imagen del Post */}
              <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={post.mainImage || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600"}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm bg-black/80 backdrop-blur-md text-white border border-white/20">
                    {post.language === "en" ? "EN 🇺🇸" : "ES 🇲🇽"}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                      post.published
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : "bg-gray-700 text-gray-200 border-gray-600"
                    }`}
                  >
                    {post.published ? "Publicado" : "Borrador"}
                  </span>
                </div>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-gray-400 block">
                    /{post.language === "en" ? "en/nosotros/" : "nosotros/"}{post.slug}
                  </span>
                  <h3 className="font-serif font-black text-base text-gray-900 dark:!text-white line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed font-medium">
                    {post.excerpt || post.content?.slice(0, 120)}
                  </p>
                </div>

                {/* Acciones */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={post.language === "en" ? `/en/nosotros/${post.slug}` : `/nosotros/${post.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-[#8B0024] dark:text-pink-300 hover:underline flex items-center gap-1"
                    >
                      <Eye size={14} />
                      <span>Ver Post</span>
                    </Link>

                    {/* Botón Traducción 1-Clic con IA */}
                    <button
                      onClick={() => handleTranslatePost(post)}
                      disabled={translatingId === post._id}
                      className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-all text-[11px] font-black flex items-center gap-1 border border-purple-200 dark:border-purple-800 disabled:opacity-50"
                      title={post.language === "en" ? "Traducir a Español con IA" : "Traducir a Inglés con IA"}
                    >
                      {translatingId === post._id ? (
                        <RefreshCw className="animate-spin" size={12} />
                      ) : (
                        <Globe size={12} />
                      )}
                      <span>{post.language === "en" ? "A Español" : "Traducir EN ✨"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-pink-100 hover:text-[#8B0024] transition-all"
                      title="Editar artículo"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id, post.title)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-700 transition-all"
                      title="Eliminar artículo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DEL ASISTENTE IA VKA */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181922] w-full max-w-2xl rounded-3xl border border-purple-200 dark:border-gray-800 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-gray-900 dark:!text-white">
                    Asistente IA VKA ✨
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Generador automático de artículos informativos y comerciales con Google Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inputs del Asistente */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  ¿De qué tema, arreglo o producto deseas el post? *
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder="Ej: Ramos de 100 rosas rojas para aniversario de bodas en Houston, Cómo cuidar tulipanes en casa, Tendencias florales para cumpleaños..."
                  className="w-full p-3.5 border rounded-2xl text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Palabras Clave SEO (Opcional)
                  </label>
                  <input
                    type="text"
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="ej: rosas de lujo, delivery houston tx"
                    className="w-full p-3 border rounded-xl text-xs font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Idioma del Artículo
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e: any) => setAiLanguage(e.target.value)}
                    className="w-full p-3 border rounded-xl text-xs font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="es">Español 🇲🇽</option>
                    <option value="en">Inglés (English) 🇺🇸</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold rounded-2xl border border-red-200 dark:border-red-800 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-relaxed">{aiError}</span>
                  </div>
                  {aiError.includes("/admin/configuracion") && (
                    <div className="pt-1">
                      <Link
                        href="/admin/configuracion"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90 text-white text-[11px] font-black shadow-sm"
                      >
                        <span>Configurar Gemini API Key en Panel ⚙️</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones de Generación: Autopilot 1-Clic o Borrador Manual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Botón 1: Autopilot 100% Automático */}
                <button
                  type="button"
                  onClick={handleGenerateAndPublishAutopilot}
                  disabled={autopilotPublishing || generatingAi || !aiPrompt.trim()}
                  className="py-3.5 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white rounded-2xl font-black text-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {autopilotPublishing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Autopilot redactando y publicando...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Autopilot: Generar y Publicar</span>
                    </>
                  )}
                </button>

                {/* Botón 2: Generar solo Borrador para Revisar */}
                <button
                  type="button"
                  onClick={handleGenerateWithAi}
                  disabled={autopilotPublishing || generatingAi || !aiPrompt.trim()}
                  className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl font-black text-xs transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingAi ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Generando borrador...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-purple-500" />
                      <span>Solo Generar Borrador</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resultado Generado con Gemini */}
            {generatedResult && (
              <div className="p-5 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-500" /> ¡Artículo Generado con Éxito!
                  </span>
                  <button
                    onClick={handleApplyAiResult}
                    className="px-4 py-1.5 bg-[#8B0024] hover:bg-[#B0004A] text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95"
                  >
                    ✨ Aplicar al Formulario
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 block">Título Propuesto:</span>
                    <h4 className="font-serif font-black text-sm text-gray-900 dark:!text-white">
                      {generatedResult.title}
                    </h4>
                  </div>

                  <div>
                    <span className="font-bold text-gray-500 block">Slug:</span>
                    <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                      /{generatedResult.slug}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-gray-500 block">Resumen Meta:</span>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {generatedResult.excerpt}
                    </p>
                  </div>

                  {generatedResult.tags && (
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {generatedResult.tags.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg text-[10px] font-bold border border-purple-200 dark:border-gray-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
