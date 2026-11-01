"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, RefreshCw, PhoneCall, ExternalLink, Bot, ChevronRight, MessageSquare, ShoppingBag, Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCart } from '@/components/shop/Cart/CartContext';
import { getSiteConfig } from '@/lib/actions/siteConfig';

export interface SuggestedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  products?: SuggestedProduct[];
}

const I18N_CONTENT = {
  es: {
    quickQuestions: [
      "🌸 Ver arreglos de cumpleaños",
      "🌹 Ramos de rosas románticos",
      "🚚 ¿Cómo funciona el delivery en Houston?",
      "💍 Arreglos para aniversarios"
    ],
    previewTickers: [
      "¿Buscas flores hoy? Te ayudo a elegir 🌸",
      "🚚 Delivery el mismo día en Houston",
      "🌹 Rosas de lujo y arreglos exclusivos",
      "💬 Consulta precios y disponibilidad aquí"
    ],
    welcomeMessage: "¡Hola! 🌸 Soy **Flor**, tu asesora floral en **Bonbon Flowers Houston**.\n\n¿Para qué ocasión especial estás buscando flores hoy?",
    resetMessage: "¡Hola de nuevo! 🌸 Te saluda Flor, ¿en qué te puedo ayudar hoy?",
    errorMessage: "🌸 Hubo un pequeño inconveniente de conexión. Puedes escribirnos directo a nuestro WhatsApp [+1 346 739 2730](https://wa.me/13467392730) para asistirte de inmediato.",
    defaultErrorResponse: "Disculpa, no pude procesar tu solicitud. Por favor intenta nuevamente.",
    advisorRole: "FLOR • ASESORA FLORAL",
    liveBadge: "EN LÍNEA",
    headerStatus: "Asesora Floral • En línea 🌸",
    ariaOpen: "Abrir chat con Flor - Bonbon Flowers",
    ariaRestart: "Reiniciar chat",
    ariaClose: "Cerrar chat",
    ariaSend: "Enviar mensaje",
    searchingCatalog: "Escribiendo respuesta...",
    popularQuestions: "Consultas populares:",
    inputPlaceholder: "Escribe tu consulta aquí...",
    poweredBy: "Flor • Bonbon Flowers",
  },
  en: {
    quickQuestions: [
      "🌸 View birthday arrangements",
      "🌹 Romantic rose bouquets",
      "🚚 How does Houston delivery work?",
      "💍 Anniversary floral designs"
    ],
    previewTickers: [
      "Looking for flowers today? I'll help you choose 🌸",
      "🚚 Same-day delivery in Houston",
      "🌹 Luxury roses & exclusive arrangements",
      "💬 Check prices & availability here"
    ],
    welcomeMessage: "Hello! 🌸 I'm **Flor**, your floral advisor at **Bonbon Flowers Houston**.\n\nWhat special occasion are you looking for flowers for today?",
    resetMessage: "Hello again! 🌸 Flor here, how can I help you today?",
    errorMessage: "🌸 There was a brief connection issue. You can message us directly on WhatsApp [+1 346 739 2730](https://wa.me/13467392730) for instant assistance.",
    defaultErrorResponse: "Sorry, I couldn't process your request. Please try again.",
    advisorRole: "FLOR • FLORAL ADVISOR",
    liveBadge: "ONLINE",
    headerStatus: "Floral Advisor • Online 🌸",
    ariaOpen: "Chat with Flor - Bonbon Flowers",
    ariaRestart: "Restart chat",
    ariaClose: "Close chat",
    ariaSend: "Send message",
    searchingCatalog: "Typing a response...",
    popularQuestions: "Popular questions:",
    inputPlaceholder: "Type your message here...",
    poweredBy: "Flor • Bonbon Flowers",
  },
  admin: {
    quickQuestions: [
      "📦 ¿Cómo creo o edito un producto?",
      "🛍️ ¿Dónde reviso las órdenes de hoy?",
      "✨ ¿Cómo anidar y vincular variantes?",
      "🚚 Configurar zonas de entrega Houston",
      "📈 Consejos de SEO para floristería"
    ],
    previewTickers: [
      "🌸 Asistente de Gestión Bonbon Flowers",
      "📦 ¿Dudas con productos o variantes? Pregúntame",
      "🚚 Configuración de envíos y tarifas",
      "⚡ Co-Pilot en línea para ayudarte"
    ],
    welcomeMessage: "¡Hola, Administrador! 🌸 Soy **Flor Co-Pilot**, tu asistente inteligente del panel de administración de **Bonbon Flowers**.\n\nPuedo guiarte para crear arreglos, configurar opciones de entrega, vincular variantes o resolver dudas de gestión. ¿Qué deseas consultar hoy?",
    resetMessage: "¡Hola de nuevo! ⚡ Flor Co-Pilot lista. ¿Qué módulo o configuración deseas revisar?",
    errorMessage: "⚠️ Hubo un inconveniente temporal de conexión con el motor de IA. Por favor intenta de nuevo en unos segundos.",
    defaultErrorResponse: "Disculpa, no pude procesar tu consulta técnica. Por favor intenta de nuevo.",
    advisorRole: "AI CO-PILOT • ADMIN",
    liveBadge: "MODO GESTIÓN",
    headerStatus: "Co-Pilot Administrativo • En línea ⚡",
    ariaOpen: "Abrir Asistente Co-Pilot de Administración",
    ariaRestart: "Reiniciar chat de administración",
    ariaClose: "Cerrar asistente",
    ariaSend: "Enviar consulta",
    searchingCatalog: "Consultando sistema...",
    popularQuestions: "Consultas frecuentes de gestión:",
    inputPlaceholder: "Pregunta sobre productos, órdenes, entregas o SEO...",
    poweredBy: "Flor Co-Pilot • Admin Console",
  }
};

const CHAT_STORAGE_KEY = "bonbon_chat_history_v2";
const ADMIN_STORAGE_KEY = "bonbon_admin_chat_history_v1";
const LEGACY_STORAGE_KEYS = ["gf_chat_history_v1", "florist_chat_history", "chat_history"];
const CHAT_STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export const ChatbotModal = () => {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  let currentLocale = "en";
  try {
    const intlLocale = useLocale();
    if (intlLocale === "en" || intlLocale === "es") {
      currentLocale = intlLocale;
    }
  } catch (e) {}

  if (pathname?.startsWith("/es")) {
    currentLocale = "es";
  }

  const content = isAdmin
    ? I18N_CONTENT.admin
    : (currentLocale === "en" ? I18N_CONTENT.en : I18N_CONTENT.es);
  const activeStorageKey = isAdmin ? ADMIN_STORAGE_KEY : CHAT_STORAGE_KEY;

  const { addToCart } = useCart();
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const handleAddToCartFromChat = (prod: SuggestedProduct) => {
    addToCart({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image
    });
    setAddedItemIds((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [prod.id]: false }));
    }, 2200);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const isHydratedRef = useRef(false);

  // Estados de Configuración y Modo Mini
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [isMiniMode, setIsMiniMode] = useState<boolean>(true);
  // Del lado del cliente (!isAdmin), siempre activo en Modo Mini (burbuja circular compacta)
  const effectiveMiniMode = !isAdmin ? true : isMiniMode;

  // Estados del Motor Draggable (Móvil y Escritorio)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  // Cargar configuración de administración
  useEffect(() => {
    getSiteConfig().then((res) => {
      if (res?.success && res.data) {
        setSiteConfig(res.data);
        if (isAdmin && res.data.chatbotMiniMode !== undefined) {
          setIsMiniMode(Boolean(res.data.chatbotMiniMode));
        }
      }
    });
  }, [isAdmin]);

  // Restaurar posición previamente arrastrada en la sesión
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("bonbon_chatbot_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const maxX = window.innerWidth - 65;
          const maxY = window.innerHeight - 65;
          setPosition({
            x: Math.min(Math.max(10, parsed.x), maxX),
            y: Math.min(Math.max(10, parsed.y), maxY),
          });
        }
      }
    } catch (e) {}

    // Ajustar si cambia el tamaño de pantalla
    const handleResize = () => {
      setPosition((pos) => {
        if (!pos || !bubbleRef.current) return pos;
        const width = bubbleRef.current.offsetWidth || 56;
        const height = bubbleRef.current.offsetHeight || 56;
        const maxX = window.innerWidth - width - 8;
        const maxY = window.innerHeight - height - 8;
        return {
          x: Math.min(Math.max(8, pos.x), maxX),
          y: Math.min(Math.max(8, pos.y), maxY),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handlers de Arrastre Táctil y Ratón
  const startDrag = (clientX: number, clientY: number) => {
    const el = bubbleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragDataRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: rect.left,
      initialY: rect.top,
      hasMoved: false,
    };

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      let currX = 0;
      let currY = 0;
      if ("touches" in moveEvent) {
        if (!moveEvent.touches || moveEvent.touches.length === 0) return;
        currX = moveEvent.touches[0].clientX;
        currY = moveEvent.touches[0].clientY;
      } else {
        currX = (moveEvent as MouseEvent).clientX;
        currY = (moveEvent as MouseEvent).clientY;
      }

      const dx = currX - dragDataRef.current.startX;
      const dy = currY - dragDataRef.current.startY;

      if (!dragDataRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
        dragDataRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragDataRef.current.hasMoved && bubbleRef.current) {
        const width = bubbleRef.current.offsetWidth || 56;
        const height = bubbleRef.current.offsetHeight || 56;
        const maxX = window.innerWidth - width - 8;
        const maxY = window.innerHeight - height - 8;

        const newX = Math.min(Math.max(8, dragDataRef.current.initialX + dx), maxX);
        const newY = Math.min(Math.max(8, dragDataRef.current.initialY + dy), maxY);

        setPosition({ x: newX, y: newY });
      }
    };

    const onEnd = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);

      if (dragDataRef.current.hasMoved) {
        setIsDragging(false);
        setPosition((currentPos) => {
          if (currentPos) {
            try {
              sessionStorage.setItem("bonbon_chatbot_pos", JSON.stringify(currentPos));
            } catch (e) {}
          }
          return currentPos;
        });
      } else {
        // Tap / Click directo sin arrastre -> Abrir modal
        setIsOpen(true);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Solo botón primario
    startDrag(e.clientX, e.clientY);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "model",
      text: content.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

  ]);

  // Cargar historial persistido al montar en el navegador y purgar cachés antiguos con "Sofia" o "Flowers For You"
  useEffect(() => {
    try {
      // Limpiar claves de almacenamiento heredadas
      LEGACY_STORAGE_KEYS.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      const saved = localStorage.getItem(activeStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          const isExpired = Date.now() - (parsed.savedAt || 0) > CHAT_STORAGE_TTL;
          const hasLegacyNames = parsed.messages.some((m: Message) => 
            /sofia|flowers for you|gabriela/i.test(m.text || "")
          );

          if (!isExpired && !hasLegacyNames) {
            setMessages(parsed.messages);
          } else {
            localStorage.removeItem(activeStorageKey);
          }
        }
      }
    } catch (e) {
      console.warn("Error cargando historial de chat:", e);
    } finally {
      isHydratedRef.current = true;
    }
  }, [activeStorageKey]);

  // Guardar historial en localStorage ante cualquier cambio
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      if (messages.length === 1 && messages[0].id === "welcome-msg") {
        return;
      }
      localStorage.setItem(activeStorageKey, JSON.stringify({
        savedAt: Date.now(),
        messages
      }));
    } catch (e) {
      console.warn("Error guardando historial de chat:", e);
    }
  }, [messages, activeStorageKey]);

  // Sincronizar mensaje de bienvenida si cambia el idioma o modo y no hay historial previo
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome-msg") {
        return [{
          id: "welcome-msg",
          role: "model",
          text: content.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      }
      return prev;
    });
  }, [currentLocale, isAdmin, content.welcomeMessage]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotador automático de mensajes en el mini-reproductor
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % content.previewTickers.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [content.previewTickers.length]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-bonbon-chat", handleOpenChat);
    return () => window.removeEventListener("open-bonbon-chat", handleOpenChat);
  }, []);

  // Escuchar alertas de nuevas ventas en vivo para que Flor Co-Pilot registre el evento en el chat
  useEffect(() => {
    const handleSaleAlert = (e: Event) => {
      const custom = e as CustomEvent<any>;
      const order = custom.detail;
      if (!order) return;

      const saleMessage: Message = {
        id: `sale-alert-${order.orderId || Date.now()}`,
        role: "model",
        text: `🚨 **¡VENDISTE! NUEVA VENTA CONFIRMADA** 🎉\n\nAcabas de recibir una nueva orden en Bonbon Flowers:\n\n- 📦 **Orden:** \`#${order.orderId}\`\n- 👤 **Cliente:** ${order.customerName || "Cliente"}\n- 💵 **Total:** $${Number(order.total || 0).toFixed(2)} USD\n- 📍 **Entrega:** ${order.address || "Por coordinar"}\n\n👉 [Ver todas las órdenes](/admin/ordenes)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, saleMessage]);
    };

    window.addEventListener("bonbon:new-sale-chatbot-alert", handleSaleAlert);
    return () => window.removeEventListener("bonbon:new-sale-chatbot-alert", handleSaleAlert);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const startTime = Date.now();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      let clientContext: Record<string, any> = {
        isAdmin,
        currentPath: pathname
      };
      try {
        const customerName = localStorage.getItem("customerName") || "";
        const lastOrderId = localStorage.getItem("lastOrderId") || "";
        if (customerName) clientContext.customerName = customerName;
        if (lastOrderId) clientContext.lastOrderId = lastOrderId;
      } catch (e) {}

      const apiHistory = newMessages.map(m => ({
        role: m.role,
        text: m.text
      })).slice(-16);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiHistory,
          locale: currentLocale,
          clientContext
        })
      });


      if (!res.ok) throw new Error("Error en la respuesta");
      const data = await res.json();

      // Simular delay humano de digitación (1.2s - 1.8s proporcional al texto)
      // mientras se mantiene visible la animación de "Flor está escribiendo..."
      const responseLen = (data.text || "").length || 60;
      const targetDelay = Math.min(2000, Math.max(1200, responseLen * 12));
      const elapsed = Date.now() - startTime;
      if (elapsed < targetDelay) {
        await new Promise(resolve => setTimeout(resolve, targetDelay - elapsed));
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || content.defaultErrorResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: (data.products && Array.isArray(data.products) && data.products.length > 0)
          ? data.products
          : undefined
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: content.errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(activeStorageKey);
    } catch (e) {}
    setMessages([
      {
        id: Date.now().toString(),
        role: "model",
        text: content.resetMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const renderFormattedText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const [, label, url] = match;
      parts.push(
        url.startsWith('/') ? (
          <Link
            key={match.index}
            href={url}
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1 font-bold text-[#163422] dark:text-emerald-400 underline hover:text-[#0f2417] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded transition-colors my-0.5"
          >
            {label} <ExternalLink size={12} />
          </Link>
        ) : (
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-[#25D366] underline hover:text-[#1da851] bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded transition-colors my-0.5"
          >
            {label} <ExternalLink size={12} />
          </a>
        )
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <>
      {/* Botón Flotante Draggable (Modo Mini Circular o Modo Píldora Completo) */}
      {!isOpen && (siteConfig?.enableChatbot !== false || isAdmin) && (
        <div
          ref={bubbleRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
          aria-label={content.ariaOpen}
          style={
            position
              ? {
                  position: "fixed",
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  touchAction: "none",
                  zIndex: 50,
                  userSelect: "none",
                }
              : {
                  position: "fixed",
                  bottom: "1.25rem",
                  right: siteConfig?.chatbotInitialPosition === "bottom-left" ? "auto" : "1rem",
                  left: siteConfig?.chatbotInitialPosition === "bottom-left" ? "1rem" : "auto",
                  touchAction: "none",
                  zIndex: 50,
                  userSelect: "none",
                }
          }
          className={`group select-none animate-in fade-in duration-200 ${
            isDragging ? "cursor-grabbing scale-105 transition-none" : "cursor-grab"
          }`}
        >
          {effectiveMiniMode ? (
            /* MODO MINI: Burbuja circular compacta solo avatar sin textos */
            <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-md shadow-[0px_10px_35px_rgba(22,52,34,0.35)] border-2 border-[#D4AF37] hover:border-[#FF97A4] p-1 transition-transform group-hover:scale-105 group-active:scale-95">
              <div className="relative w-full h-full rounded-full overflow-hidden border border-[#D4AF37]/50 bg-[#163422] pointer-events-none">
                <img
                  src="https://bonbonflowershouston.com/logo.png"
                  alt="Flor Asesora"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0.5 right-0.5">
                  <Sparkles size={10} className="text-[#D4AF37] animate-pulse" />
                </div>
              </div>

              {/* Indicador de Estado En Vivo con Ondas */}
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#25D366] border-2 border-white dark:border-[#12131a]"></span>
              </span>

              {/* Badge Ícono de Chat */}
              <div className="absolute -bottom-1 -left-1 bg-[#163422] text-white p-1 rounded-full shadow-md border border-[#D4AF37]/60 pointer-events-none">
                <MessageSquare size={12} className="text-white" />
              </div>
            </div>
          ) : (
            /* MODO COMPLETO: Píldora interactiva estilo Atelier */
            <div className="flex items-center gap-2.5 sm:gap-3.5 bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-md pl-2 pr-3.5 sm:pr-4 py-2 rounded-2xl shadow-[0px_10px_35px_rgba(22,52,34,0.25)] border-2 border-[#D4AF37]/80 hover:border-[#D4AF37] hover:shadow-[0px_12px_40px_rgba(22,52,34,0.35)] transition-all duration-300 max-w-[310px] sm:max-w-none pointer-events-auto">
              
              {/* Thumbnail / Portada estilo Mini-Player */}
              <div className="relative flex-shrink-0 pointer-events-none">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#D4AF37] shadow-sm relative bg-[#163422]">
                  <img
                    src="https://bonbonflowershouston.com/logo.png"
                    alt="Flor - Asesora Bonbon Flowers"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0.5 right-0.5">
                    <Sparkles size={11} className="text-[#D4AF37] animate-pulse" />
                  </div>
                </div>

                {/* Indicador de Estado En Vivo con Ondas */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#25D366] border-2 border-white dark:border-[#12131a]"></span>
                </span>
              </div>

              {/* Texto y Ticker Dinámico estilo Mini-Player */}
              <div className="flex flex-col text-left overflow-hidden min-w-[155px] sm:min-w-[200px] pointer-events-none">
                <div className="flex items-center gap-1.5 leading-none mb-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black dark:text-pink-400">
                    {content.advisorRole}
                  </span>
                  <span className="flex items-center gap-0.5 text-[8px] bg-green-100 dark:bg-green-950/60 text-green-900 dark:text-green-300 font-extrabold px-1.5 py-0.5 rounded-full">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                    {content.liveBadge}
                  </span>
                </div>

                {/* Ticker de mensaje animado */}
                <div className="h-4 overflow-hidden relative">
                  <p 
                    key={tickerIndex} 
                    className="text-[11px] sm:text-xs font-bold text-black dark:text-gray-200 truncate animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {content.previewTickers[tickerIndex]}
                  </p>
                </div>
              </div>

              {/* Botón Acción Mini-Player (Ícono de Chat / Play) */}
              <div className="flex-shrink-0 bg-[#163422] text-white p-2 rounded-xl shadow-md hover:bg-[#1B2E22] transition-colors flex items-center justify-center pointer-events-none">
                <MessageSquare size={16} className="text-white" />
              </div>

            </div>
          )}
        </div>
      )}

      {/* Ventana Modal del Chatbot */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-[60] w-[94vw] sm:w-[410px] h-[560px] max-h-[85vh] bg-white dark:bg-[#12131a] rounded-3xl shadow-[0px_20px_50px_rgba(0,0,0,0.35)] border-2 border-[#D4AF37]/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header del Chatbot */}
          <div className="bg-gradient-to-r from-[#163422] via-[#1B2E22] to-[#163422] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#D4AF37]/40 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://bonbonflowershouston.com/logo.png"
                  alt="Bonbon Flowers"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#163422]"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">Flor</span>
                  <span className="text-[9px] bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 px-1.5 py-0.2 rounded font-black tracking-wider">IA</span>
                </div>
                <span className="text-[11px] text-stone-200 font-medium flex items-center gap-1">
                  {content.headerStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsMiniMode((prev) => !prev)}
                  title={isMiniMode ? "Cambiar a modo extendido" : "Contraer a burbuja mini"}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-stone-200 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>{isMiniMode ? "Modo Completo" : "Modo Mini"}</span>
                </button>
              )}
              <button
                onClick={handleReset}
                title={content.ariaRestart}
                className="p-1.5 hover:bg-white/10 rounded-xl text-stone-200 hover:text-white transition-colors"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title={content.ariaClose}
                className="p-1.5 hover:bg-white/10 rounded-xl text-stone-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FDFCF8] dark:bg-[#0d0e14] text-sm leading-relaxed">
            
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`${(m.products && m.products.length > 0) ? 'max-w-[92%] sm:max-w-[340px] w-full' : 'max-w-[85%]'} rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-line shadow-sm ${
                      isUser
                        ? 'bg-[#163422] text-white rounded-br-none'
                        : 'bg-white dark:bg-[#1a1b24] text-gray-800 dark:text-gray-100 border border-gray-200/80 dark:border-gray-800 rounded-bl-none'
                    }`}
                  >
                    {renderFormattedText(m.text)}

                    {/* Tarjetas Interactivas de Productos Recomendados */}
                    {m.products && m.products.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200/80 dark:border-stone-800 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">
                          <Sparkles size={11} className="text-[#D4AF37]" />
                          <span>{currentLocale === 'en' ? 'Recommended Arrangements:' : 'Arreglos Recomendados:'}</span>
                        </div>
                        <div className="space-y-2">
                          {m.products.map((prod) => {
                            const isAdded = Boolean(addedItemIds[prod.id]);
                            const productUrl = (currentLocale === 'es' || pathname?.startsWith('/es'))
                              ? `/es/productos/${prod.slug}`
                              : `/productos/${prod.slug}`;
                            return (
                              <div
                                key={prod.id}
                                className="flex items-center gap-2.5 p-2 bg-stone-50 dark:bg-[#12131a] rounded-xl border border-stone-200 dark:border-stone-800 hover:border-[#D4AF37]/60 transition-all shadow-xs"
                              >
                                {/* Foto del producto con enlace */}
                                <Link
                                  href={productUrl}
                                  onClick={() => setIsOpen(false)}
                                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-200 dark:bg-stone-800 group"
                                  title={prod.name}
                                >
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </Link>

                                {/* Nombre y Precio con Enlace */}
                                <div className="flex-1 min-w-0 pr-1">
                                  <Link
                                    href={productUrl}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-xs font-bold text-gray-900 dark:text-white truncate hover:text-[#163422] dark:hover:text-emerald-400 hover:underline"
                                    title={prod.name}
                                  >
                                    {prod.name}
                                  </Link>
                                  <p className="text-[11px] font-extrabold text-[#163422] dark:text-emerald-400 mt-0.5">
                                    ${prod.price} USD
                                  </p>
                                </div>

                                {/* Botón Añadir al Carrito */}
                                <button
                                  type="button"
                                  onClick={() => handleAddToCartFromChat(prod)}
                                  disabled={isAdded}
                                  aria-label={`Añadir ${prod.name} al carrito`}
                                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs ${
                                    isAdded
                                      ? 'bg-emerald-600 text-white cursor-default'
                                      : 'bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 hover:scale-102 active:scale-98 cursor-pointer'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check size={12} className="stroke-[2.5]" />
                                      <span>{currentLocale === 'en' ? 'Added!' : '¡Añadido!'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag size={12} />
                                      <span>{currentLocale === 'en' ? 'Add' : 'Añadir'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {/* Animación de escribiendo... */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1b24] w-fit px-3.5 py-2 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <span className="w-1.5 h-1.5 bg-[#163422] dark:bg-emerald-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#163422] dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#163422] dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-[11px] font-medium">{content.searchingCatalog}</span>
              </div>
            )}

            {/* Preguntas Rápidas sugeridas si es el inicio */}
            {messages.length <= 2 && !isLoading && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  {content.popularQuestions}
                </span>
                {content.quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left text-xs bg-white dark:bg-[#181922] hover:bg-stone-100 dark:hover:bg-stone-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-xl transition-all font-medium hover:border-[#163422]/40 flex items-center justify-between group shadow-sm"
                  >
                    <span>{q}</span>
                    <span className="text-[#163422] dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer e Input de Mensaje */}
          <div className="p-3 bg-white dark:bg-[#12131a] border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={content.inputPlaceholder}
                disabled={isLoading}
                className="flex-1 text-xs sm:text-sm bg-gray-50 dark:bg-[#1c1d28] text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#163422] dark:focus:border-emerald-400 transition-colors placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                aria-label={content.ariaSend}
                className="bg-[#163422] hover:bg-[#1B2E22] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shadow-md hover:scale-105 active:scale-95 disabled:hover:scale-100"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1 pt-0.5">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-[#D4AF37]" />
                {content.poweredBy}
              </span>
              <a
                href="https://wa.me/13467392730"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:underline flex items-center gap-1 font-semibold"
              >
                <PhoneCall size={11} /> WhatsApp
              </a>
            </div>

          </div>

        </div>
      )}
    </>
  );
};
