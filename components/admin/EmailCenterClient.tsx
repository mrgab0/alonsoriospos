"use client";

import React, { useState, useTransition } from "react";
import {
  Mail,
  Inbox,
  Send,
  PenSquare,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Paperclip,
  ExternalLink,
  Loader2,
  ShoppingCart,
  Users,
  Megaphone,
  Settings,
  Sparkles,
  X,
  Reply,
  Copy,
  ChevronRight,
  Eye,
  Check,
  CheckSquare,
  Minimize2,
  Maximize2,
  Gift,
  ArrowRight,
  Tag,
  Phone,
  User,
  ShieldCheck,
  ChevronDown,
  Plus,
  Globe,
  AtSign,
} from "lucide-react";
import {
  getEmailsAction,
  sendCustomEmailAction,
  markEmailAsReadAction,
  bulkMarkEmailsAsReadAction,
  deleteEmailAction,
  bulkDeleteEmailsAction,
  saveEmailSettingsAction,
  saveCorporateAccountsAction,
} from "@/lib/actions/emails";
import { ICorporateAccount } from "@/lib/models/SiteConfig";
import {
  getAbandonedCartsAction,
  sendAbandonedCartRecoveryAction,
} from "@/lib/actions/abandonedCart";
import {
  getNewsletterLeadsAction,
  updateLeadCaptureConfigAction,
} from "@/lib/actions/leadCapture";
import {
  sendMarketingCampaignAction,
  MarketingAudience,
} from "@/lib/actions/marketing";

// Plantillas predeterminadas de redacción rápida
const EMAIL_TEMPLATES = [
  {
    id: "confirmacion_orden",
    name: "🌸 Confirmación de Orden & Factura",
    subject: "Confirmación de tu Pedido en Bonbon Flowers Houston",
    body: `<p>Nos complace confirmar que tu pedido ha sido recibido y nuestro equipo de floristas artesanos ya se encuentra preparando tu arreglo floral con la máxima frescura.</p>
<p>Te notificaremos en cuanto el bouquet esté listo y sea asignado a nuestro mensajero para entrega en el área metropolitana de Houston.</p>`,
  },
  {
    id: "actualizacion_entrega",
    name: "🚚 Pedido en Ruta de Entrega",
    subject: "¡Tu arreglo floral va en camino! 🚚 Bonbon Flowers",
    body: `<p>¡Buenas noticias! Tu arreglo floral exclusivo ha salido de nuestra boutique matriz y se encuentra en ruta de entrega en este momento.</p>
<p>Nuestro mensajero cuidará cada detalle para asegurar que llegue en condiciones impecables a la dirección indicada.</p>`,
  },
  {
    id: "agradecimiento_vip",
    name: "✨ Agradecimiento & Cupón VIP",
    subject: "Un detalle especial para ti de Bonbon Flowers",
    body: `<p>Queremos agradecerte por confiar en <strong>Bonbon Flowers</strong> para tus momentos más especiales.</p>
<p>Como cliente selecto, te obsequiamos este cupón de <strong>15% de descuento</strong> para tu próxima orden: <strong style="color: #163422; font-size: 16px;">VIP15</strong>.</p>`,
  },
  {
    id: "cotizacion_especial",
    name: "💼 Cotización para Eventos / Bodas",
    subject: "Propuesta de Diseño Floral Exclusivo • Bonbon Flowers",
    body: `<p>Adjuntamos la propuesta personalizada para tu evento especial, elaborada con nuestras especies florales más selectas y floreros de diseño.</p>
<p>Quedamos a tu completa disposición para afinar cualquier detalle que desees.</p>`,
  },
];

const COPILOT_LEAD_PRESETS = [
  {
    id: "welcome",
    name: "🌸 Bienvenida Signature",
    template: "champagne_pill" as const,
    title: "¡Bienvenido a Bonbon Flowers! 🌸",
    subtitle: "Suscríbete y disfruta un 10% de cortesía en tu primer arreglo floral de lujo.",
    coupon: "BIENVENIDO10",
    delay: 7,
  },
  {
    id: "romance",
    name: "🌹 San Valentín & Romance",
    template: "velvet_modal" as const,
    title: "Rosas de Alta Costura en Houston 🌹",
    subtitle: "Reserva hoy tu bouquet velvet exclusivo y asegura entrega express garantizada.",
    coupon: "VALENTINLOVE",
    delay: 5,
  },
  {
    id: "mothers",
    name: "💐 Día de las Madres",
    template: "corner_toast" as const,
    title: "El Regalo Perfecto para Mamá 💐",
    subtitle: "Únete a nuestro club exclusivo y recibe un lazo de satén con dedicatoria de regalo.",
    coupon: "PARAMAMA15",
    delay: 6,
  },
  {
    id: "flash",
    name: "⚡ Envío Prioritario Gratis",
    template: "champagne_pill" as const,
    title: "Envío Prioritario de Cortesía 🚚",
    subtitle: "Solo por hoy: entrega gratis en River Oaks, Galleria, Katy y The Woodlands.",
    coupon: "HOUSTONFREE",
    delay: 8,
  },
];

interface EmailCenterClientProps {
  initialAccounts?: (ICorporateAccount & { unreadCount?: number })[];
  initialEmails: any[];
  initialTotal: number;
  initialUnread: number;
  initialSentCount: number;
  initialInboxCount: number;
  initialCarts: any[];
  initialCartStats: any;
  initialLeads: any[];
  initialAudience: any;
  initialSettings: any;
}

export function EmailCenterClient({
  initialAccounts = [],
  initialEmails,
  initialTotal,
  initialUnread,
  initialSentCount,
  initialInboxCount,
  initialCarts,
  initialCartStats,
  initialLeads,
  initialAudience,
  initialSettings,
}: EmailCenterClientProps) {
  const [isPending, startTransition] = useTransition();

  // Estado de Cuentas Corporativas & Selector de Mailbox
  const [accounts, setAccounts] = useState<(ICorporateAccount & { unreadCount?: number })[]>(initialAccounts);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    name: "",
    email: "",
    role: "Ventas",
    color: "#163422",
    signature: "",
    isDefault: false,
  });

  const activeAccountObj = accounts.find(
    (a) => a.email.toLowerCase() === selectedAccount.toLowerCase()
  );

  // Navegación principal estilo Gmail
  const [activeTab, setActiveTab] = useState<
    "inbox" | "sent" | "abandoned" | "leads" | "campaigns" | "settings"
  >("inbox");

  // Estado de Correos (Inbox / Sent)
  const [emails, setEmails] = useState(initialEmails);
  const [totalEmails, setTotalEmails] = useState(initialTotal);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [viewingEmail, setViewingEmail] = useState<any | null>(null);

  // Estado del Redactor Flotante estilo Gmail (Composer)
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isComposerMinimized, setIsComposerMinimized] = useState(false);
  const [composerForm, setComposerForm] = useState({
    from: "",
    to: "",
    subject: "",
    bodyHtml: "",
    customerName: "",
    bccAdmins: true,
    ctaText: "",
    ctaUrl: "",
  });
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estado de Carritos Abandonados
  const [abandonedCarts, setAbandonedCarts] = useState(initialCarts);
  const [cartStats, setCartStats] = useState(initialCartStats);
  const [recoveringCartId, setRecoveringCartId] = useState<string | null>(null);

  // Estado de Leads Captados & Asistente Co-Pilot
  const [leads, setLeads] = useState(initialLeads);
  const [popupConfig, setPopupConfig] = useState(initialSettings.popup);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [showAiCustomBox, setShowAiCustomBox] = useState(false);

  // Estado de Campañas Masivas
  const [campaignForm, setCampaignForm] = useState({
    audience: "all_contacts" as MarketingAudience,
    subject: "✨ Colección Especial de Temporada • Bonbon Flowers Houston",
    preheader: "Descubre nuestros nuevos arreglos de lujo con entrega express en Houston.",
    bodyHtml: `<p>Te invitamos a descubrir los nuevos lanzamientos florales en <strong>Bonbon Flowers</strong>.</p>
<p>Arreglos exclusivos de rosas eternas, orquídeas importadas y detalles diseñados para enamorar.</p>`,
    ctaText: "Ver Colección Exclusiva",
    ctaUrl: "https://bonbonflowerhouston.com/productos",
  });
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // Estado de Configuración del Remitente
  const [senderConfig, setSenderConfig] = useState(initialSettings.sender);

  // ---------------------------------------------------------------------------
  // MANEJADORES DE CORREOS & CUENTAS CORPORATIVAS
  // ---------------------------------------------------------------------------
  const refreshEmails = (
    folder: "inbox" | "sent" = activeTab === "sent" ? "sent" : "inbox",
    query = searchQuery,
    account = selectedAccount
  ) => {
    startTransition(async () => {
      const res = await getEmailsAction({
        folder,
        search: query,
        accountEmail: account !== "all" ? account : undefined,
      });
      if (res.success && res.data) {
        setEmails(res.data);
        setTotalEmails(res.total || 0);
        if (res.unreadCount !== undefined) setUnreadCount(res.unreadCount);
      }
    });
  };

  const handleSelectAccount = (accountEmail: string) => {
    setSelectedAccount(accountEmail);
    setIsAccountDropdownOpen(false);
    refreshEmails(activeTab === "sent" ? "sent" : "inbox", searchQuery, accountEmail);
  };

  const handleOpenComposer = () => {
    let initialFrom = "";
    if (selectedAccount !== "all") {
      const matching = accounts.find((a) => a.email.toLowerCase() === selectedAccount.toLowerCase());
      if (matching) {
        initialFrom = `${matching.name} <${matching.email}>`;
      }
    }
    if (!initialFrom) {
      const def = accounts.find((a) => a.isDefault) || accounts[0];
      if (def) {
        initialFrom = `${def.name} <${def.email}>`;
      }
    }

    setComposerForm((prev) => ({
      ...prev,
      from: initialFrom,
    }));
    setIsComposerOpen(true);
    setIsComposerMinimized(false);
  };

  const handleCreateAccount = () => {
    if (!newAccountForm.email.trim() || !newAccountForm.email.includes("@")) {
      setFeedbackMsg({ type: "error", text: "Por favor ingresa un correo corporativo válido." });
      return;
    }
    const cleanEmail = newAccountForm.email.trim().toLowerCase();
    const existing = accounts.some((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      setFeedbackMsg({ type: "error", text: "Esta cuenta de correo ya se encuentra registrada." });
      return;
    }

    const newAcc: ICorporateAccount = {
      id: cleanEmail.split("@")[0] || `acc-${Date.now()}`,
      email: cleanEmail,
      name: newAccountForm.name.trim() || cleanEmail.split("@")[0],
      role: newAccountForm.role.trim() || "Ventas",
      color: newAccountForm.color || "#163422",
      signature: newAccountForm.signature.trim(),
      isDefault: newAccountForm.isDefault,
    };

    let updated = [...accounts];
    if (newAcc.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }));
    }
    updated.push(newAcc);

    startTransition(async () => {
      const res = await saveCorporateAccountsAction(updated);
      if (res.success) {
        setAccounts(updated);
        setSelectedAccount(cleanEmail);
        setIsAddAccountModalOpen(false);
        setNewAccountForm({
          name: "",
          email: "",
          role: "Ventas",
          color: "#163422",
          signature: "",
          isDefault: false,
        });
        setFeedbackMsg({
          type: "success",
          text: `✨ Cuenta ${cleanEmail} creada y seleccionada en el Webmail.`,
        });
        refreshEmails(activeTab === "sent" ? "sent" : "inbox", searchQuery, cleanEmail);
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error al crear cuenta corporativa." });
      }
    });
  };

  const handleDeleteAccount = (accountEmail: string) => {
    if (accounts.length <= 1) {
      setFeedbackMsg({ type: "error", text: "Debes conservar al menos una cuenta corporativa activa." });
      return;
    }
    const updated = accounts.filter((a) => a.email.toLowerCase() !== accountEmail.toLowerCase());
    if (!updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }

    startTransition(async () => {
      const res = await saveCorporateAccountsAction(updated);
      if (res.success) {
        setAccounts(updated);
        if (selectedAccount.toLowerCase() === accountEmail.toLowerCase()) {
          setSelectedAccount("all");
          refreshEmails(activeTab === "sent" ? "sent" : "inbox", searchQuery, "all");
        }
        setFeedbackMsg({ type: "success", text: `Cuenta ${accountEmail} eliminada.` });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error al eliminar cuenta." });
      }
    });
  };

  const handleSetDefaultAccount = (accountEmail: string) => {
    const updated = accounts.map((a) => ({
      ...a,
      isDefault: a.email.toLowerCase() === accountEmail.toLowerCase(),
    }));

    startTransition(async () => {
      const res = await saveCorporateAccountsAction(updated);
      if (res.success) {
        setAccounts(updated);
        setFeedbackMsg({
          type: "success",
          text: `Cuenta ${accountEmail} fijada como predeterminada.`,
        });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error al actualizar cuenta predeterminada." });
      }
    });
  };

  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setViewingEmail(null);
    setSelectedEmailIds([]);
    setFeedbackMsg(null);

    if (tab === "inbox") refreshEmails("inbox");
    if (tab === "sent") refreshEmails("sent");
    if (tab === "abandoned") {
      startTransition(async () => {
        const res = await getAbandonedCartsAction();
        if (res.success && res.data) {
          setAbandonedCarts(res.data);
          if (res.stats) setCartStats(res.stats);
        }
      });
    }
    if (tab === "leads") {
      startTransition(async () => {
        const res = await getNewsletterLeadsAction();
        if (res.success && res.data) setLeads(res.data);
      });
    }
  };

  const handleOpenEmail = async (email: any) => {
    setViewingEmail(email);
    if (!email.isRead && email.direction === "inbound") {
      email.isRead = true;
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markEmailAsReadAction(email._id, true);
    }
  };

  const handleToggleSelectEmail = (id: string) => {
    setSelectedEmailIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEmails = () => {
    if (selectedEmailIds.length === emails.length) {
      setSelectedEmailIds([]);
    } else {
      setSelectedEmailIds(emails.map((e) => e._id));
    }
  };

  const handleBulkMarkRead = async (isRead: boolean) => {
    if (selectedEmailIds.length === 0) return;
    startTransition(async () => {
      await bulkMarkEmailsAsReadAction(selectedEmailIds, isRead);
      setEmails((prev) =>
        prev.map((e) => (selectedEmailIds.includes(e._id) ? { ...e, isRead } : e))
      );
      setSelectedEmailIds([]);
      refreshEmails();
    });
  };

  const handleBulkDelete = async () => {
    if (selectedEmailIds.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedEmailIds.length} correos seleccionados?`)) return;
    startTransition(async () => {
      await bulkDeleteEmailsAction(selectedEmailIds);
      setEmails((prev) => prev.filter((e) => !selectedEmailIds.includes(e._id)));
      setSelectedEmailIds([]);
      if (viewingEmail && selectedEmailIds.includes(viewingEmail._id)) {
        setViewingEmail(null);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // REDACTOR FLOTANTE
  // ---------------------------------------------------------------------------
  const handleApplyTemplate = (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setComposerForm((prev) => ({
        ...prev,
        subject: tpl.subject,
        bodyHtml: tpl.body,
      }));
    }
  };

  const handleSendCustomEmail = () => {
    if (!composerForm.to.trim() || !composerForm.subject.trim() || !composerForm.bodyHtml.trim()) {
      setFeedbackMsg({ type: "error", text: "Destinatario, Asunto y Mensaje son obligatorios." });
      return;
    }

    startTransition(async () => {
      const res = await sendCustomEmailAction({
        to: composerForm.to,
        from: composerForm.from || undefined,
        subject: composerForm.subject,
        bodyHtml: composerForm.bodyHtml,
        customerName: composerForm.customerName,
        bccAdmins: composerForm.bccAdmins,
        ctaText: composerForm.ctaText || undefined,
        ctaUrl: composerForm.ctaUrl || undefined,
      });

      if (res.success) {
        setFeedbackMsg({ type: "success", text: res.message || "¡Correo enviado exitosamente!" });
        setIsComposerOpen(false);
        setComposerForm({
          from: "",
          to: "",
          subject: "",
          bodyHtml: "",
          customerName: "",
          bccAdmins: true,
          ctaText: "",
          ctaUrl: "",
        });
        if (activeTab === "sent" || activeTab === "inbox") refreshEmails(activeTab);
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error al enviar correo." });
      }
    });
  };

  const handleReplyToCurrentEmail = () => {
    if (!viewingEmail) return;

    // Detectar cuenta correspondiente para responder desde el mismo buzón
    let replyFrom = "";
    if (viewingEmail.mailboxEmail) {
      const matching = accounts.find((a) => a.email.toLowerCase() === viewingEmail.mailboxEmail.toLowerCase());
      if (matching) replyFrom = `${matching.name} <${matching.email}>`;
    }
    if (!replyFrom && Array.isArray(viewingEmail.to)) {
      for (const t of viewingEmail.to) {
        const match = accounts.find((a) => a.email.toLowerCase() === t.toLowerCase());
        if (match) {
          replyFrom = `${match.name} <${match.email}>`;
          break;
        }
      }
    }
    if (!replyFrom) {
      const def = accounts.find((a) => a.isDefault) || accounts[0];
      if (def) replyFrom = `${def.name} <${def.email}>`;
    }

    setComposerForm({
      from: replyFrom,
      to: viewingEmail.customerEmail || (Array.isArray(viewingEmail.to) ? viewingEmail.to[0] : viewingEmail.to) || viewingEmail.from,
      subject: viewingEmail.subject.startsWith("Re:") ? viewingEmail.subject : `Re: ${viewingEmail.subject}`,
      bodyHtml: `<br/><br/><blockquote style="border-left: 2px solid #C5A059; padding-left: 10px; color: #666; margin: 10px 0;">--- Mensaje original ---<br/>${viewingEmail.bodyHtml || ""}</blockquote>`,
      customerName: viewingEmail.customerName || "",
      bccAdmins: true,
      ctaText: "",
      ctaUrl: "",
    });
    setIsComposerOpen(true);
    setIsComposerMinimized(false);
  };

  // ---------------------------------------------------------------------------
  // CARROTS ABANDONADOS
  // ---------------------------------------------------------------------------
  const handleSendCartRecovery = (cartId: string, customerEmail: string) => {
    setRecoveringCartId(cartId);
    startTransition(async () => {
      const res = await sendAbandonedCartRecoveryAction({ cartId, customCoupon: "REGALOBONBON" });
      setRecoveringCartId(null);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: `Recordatorio enviado a ${customerEmail}` });
        setAbandonedCarts((prev) =>
          prev.map((c) => (c._id === cartId ? { ...c, recoveryStatus: "reminder_1_sent" } : c))
        );
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "No se pudo enviar el recordatorio." });
      }
    });
  };

  // ---------------------------------------------------------------------------
  // CONFIGURACIÓN DEL WIDGET FLOTANTE (POPUP)
  // ---------------------------------------------------------------------------
  const handleSavePopupConfig = () => {
    startTransition(async () => {
      const res = await updateLeadCaptureConfigAction(popupConfig);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: "¡Configuración del widget flotante guardada!" });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error al guardar." });
      }
    });
  };

  const handleApplyLeadPreset = (preset: typeof COPILOT_LEAD_PRESETS[0]) => {
    setPopupConfig({
      ...popupConfig,
      leadCaptureTemplate: preset.template,
      leadCaptureTitle: preset.title,
      leadCaptureSubtitle: preset.subtitle,
      leadCaptureCouponCode: preset.coupon,
      leadCaptureDelaySeconds: preset.delay,
    });
    setFeedbackMsg({
      type: "success",
      text: `✨ Estrategia "${preset.name}" aplicada por Flor Co-Pilot. Recuerda hacer clic en "Guardar Configuración" para activarla.`,
    });
  };

  const handleGenerateLeadWithAI = async (customTopic?: string) => {
    setIsGeneratingWithAI(true);
    try {
      const topicInstruction = customTopic && customTopic.trim()
        ? `Crea una propuesta creativa para el widget flotante de captación de clientes de Bonbon Flowers Houston sobre: "${customTopic.trim()}".`
        : `Crea una propuesta creativa de bienvenida de lujo para el widget flotante de captación de leads en Bonbon Flowers Houston.`;

      const promptText = `${topicInstruction}
IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON sin texto introductorio ni explicaciones, siguiendo exactamente esta estructura:
{
  "template": "champagne_pill" o "velvet_modal" o "corner_toast",
  "title": "título corto y persuasivo (máximo 40 caracteres)",
  "subtitle": "promesa atractiva del cupón o regalo (máximo 95 caracteres)",
  "coupon": "CUPONENMAYUSCULA",
  "delaySeconds": 6
}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", text: promptText }],
          locale: "es",
          clientContext: { isAdmin: true },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setPopupConfig({
            ...popupConfig,
            leadCaptureTemplate: (["champagne_pill", "velvet_modal", "corner_toast"].includes(parsed.template)
              ? parsed.template
              : "champagne_pill") as any,
            leadCaptureTitle: parsed.title || popupConfig.leadCaptureTitle,
            leadCaptureSubtitle: parsed.subtitle || popupConfig.leadCaptureSubtitle,
            leadCaptureCouponCode: (parsed.coupon || popupConfig.leadCaptureCouponCode).toUpperCase(),
            leadCaptureDelaySeconds: Number(parsed.delaySeconds) || 7,
          });
          setFeedbackMsg({
            type: "success",
            text: "✨ ¡Flor Co-Pilot ha redactado la plantilla y actualizado el formulario! Revisa la previsualización a la derecha y guarda.",
          });
          setShowAiCustomBox(false);
          setAiPromptInput("");
        } else {
          setFeedbackMsg({
            type: "error",
            text: "La IA respondió pero no en formato estructurado. Puedes usar los botones de acceso rápido.",
          });
        }
      } else {
        setFeedbackMsg({ type: "error", text: "No se pudo comunicar con Flor Co-Pilot." });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Error al generar con IA." });
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CAMPAÑAS MASIVAS
  // ---------------------------------------------------------------------------
  const handleSendCampaign = (isTest: boolean) => {
    startTransition(async () => {
      const res = await sendMarketingCampaignAction({
        ...campaignForm,
        isTest,
        testEmail: isTest ? testEmailAddress : undefined,
      });

      if (res.success) {
        setFeedbackMsg({ type: "success", text: res.message || "Campaña procesada exitosamente." });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error en la campaña." });
      }
    });
  };

  // ---------------------------------------------------------------------------
  // CONFIGURACIÓN DEL REMITENTE
  // ---------------------------------------------------------------------------
  const handleSaveSenderConfig = () => {
    startTransition(async () => {
      const res = await saveEmailSettingsAction(senderConfig);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: "Configuración guardada correctamente." });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Error al guardar." });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0C10] text-[#1A1A1A] dark:text-[#E6F7F0] -m-6 sm:-m-8 p-4 sm:p-8">
      {/* Notificación de Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-[999] max-w-md p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all animate-in slide-in-from-top-4 ${
            feedbackMsg.type === "success"
              ? "bg-[#163422] text-white border border-[#C5A059]"
              : "bg-red-900 text-white border border-red-500"
          }`}
        >
          {feedbackMsg.type === "success" ? <CheckCircle2 size={18} className="text-[#5EEAD4]" /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold flex-1">{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#163422] dark:bg-[#5EEAD4] text-white dark:text-stone-950 flex items-center justify-center shadow-md">
              <Mail size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#163422] dark:text-[#E6F7F0]">
                Centro de Correos & Webmail
              </h1>
              <p style={{ margin: 0 }} className="text-xs text-[#92C21E] font-bold tracking-wider uppercase">
                Art Floral • Houston, Texas
              </p>
            </div>
          </div>
        </div>

        {/* Botón Principal "+ Redactar" */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleOpenComposer}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <PenSquare size={16} />
            <span>Redactar</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal Estilo Gmail (Layout 2 Columnas) */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Barra Lateral Izquierda (Tabs & Carpetas) */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {/* SELECTOR DE CUENTAS CORPORATIVAS (ACCOUNT SWITCHER) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="w-full bg-white dark:bg-[#12131A] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs hover:border-[#C5A059] transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedAccount === "all" ? (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#163422] to-[#1F452E] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                    <Globe size={18} className="text-[#E6C98B]" />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-serif font-black text-xs shadow-xs flex-shrink-0"
                    style={{ backgroundColor: activeAccountObj?.color || "#163422" }}
                  >
                    {activeAccountObj?.name?.charAt(0)?.toUpperCase() || "B"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-stone-900 dark:text-white truncate block">
                      {selectedAccount === "all" ? "Bandeja Unificada" : activeAccountObj?.name}
                    </span>
                    {activeAccountObj?.isDefault && selectedAccount !== "all" && (
                      <span className="text-[9px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.2 rounded font-bold">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 truncate block">
                    {selectedAccount === "all" ? "Todas las cuentas corporativas" : activeAccountObj?.email}
                  </span>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white transition-transform duration-200 flex-shrink-0 ml-1 ${
                  isAccountDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Menu Dropdown Flotante */}
            {isAccountDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAccountDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#181922] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] uppercase font-black tracking-wider text-stone-400 dark:text-[#76C7B2]">
                    Buzones Corporativos
                  </div>

                  <div className="py-1">
                    {/* Opción 1: Bandeja Unificada */}
                    <button
                      type="button"
                      onClick={() => handleSelectAccount("all")}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer ${
                        selectedAccount === "all" ? "bg-stone-100/90 dark:bg-gray-800/80 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-stone-800 text-white flex items-center justify-center text-xs flex-shrink-0">
                          <Globe size={14} className="text-[#C5A059]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block text-stone-900 dark:text-white">
                            Todas las Cuentas
                          </span>
                          <span className="text-[10px] text-stone-400 block truncate">
                            Bandeja unificada global
                          </span>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#163422] dark:bg-[#5EEAD4] text-white dark:text-stone-950">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Cuentas configuradas */}
                  <div className="py-1 max-h-56 overflow-y-auto">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id || acc.email}
                        type="button"
                        onClick={() => handleSelectAccount(acc.email)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer ${
                          selectedAccount.toLowerCase() === acc.email.toLowerCase()
                            ? "bg-stone-100/90 dark:bg-gray-800/80 font-bold"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs flex-shrink-0"
                            style={{ backgroundColor: acc.color || "#163422" }}
                          >
                            {acc.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block text-stone-900 dark:text-white truncate">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate font-mono">
                              {acc.email}
                            </span>
                          </div>
                        </div>
                        {acc.unreadCount && acc.unreadCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#C5A059] text-stone-950">
                            {acc.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {/* Botón rápido para agregar cuenta */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        setIsAddAccountModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>+ Crear Nueva Cuenta</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="bg-white dark:bg-[#12131A] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-1">
            <button
              onClick={() => handleSelectTab("inbox")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inbox"
                  ? "bg-[#163422] text-white shadow-md dark:bg-[#5EEAD4] dark:text-stone-950"
                  : "text-stone-700 dark:text-[#B9E6D3] hover:bg-stone-100 dark:hover:bg-gray-800/60"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Inbox size={16} />
                <span>Recibidos (Inbox)</span>
              </span>
              {unreadCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "inbox"
                      ? "bg-[#D4AF37] text-stone-950"
                      : "bg-[#163422] text-white dark:bg-[#5EEAD4] dark:text-stone-950"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectTab("sent")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "sent"
                  ? "bg-[#163422] text-white shadow-md dark:bg-[#5EEAD4] dark:text-stone-950"
                  : "text-stone-700 dark:text-[#B9E6D3] hover:bg-stone-100 dark:hover:bg-gray-800/60"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Send size={16} />
                <span>Enviados (Sent)</span>
              </span>
              <span className="text-[11px] opacity-75">{initialSentCount}</span>
            </button>

            <button
              onClick={() => handleSelectTab("abandoned")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "abandoned"
                  ? "bg-[#163422] text-white shadow-md dark:bg-[#5EEAD4] dark:text-stone-950"
                  : "text-stone-700 dark:text-[#B9E6D3] hover:bg-stone-100 dark:hover:bg-gray-800/60"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingCart size={16} />
                <span>Carritos Abandonados</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {cartStats?.activeCount || 0}
              </span>
            </button>

            <button
              onClick={() => handleSelectTab("leads")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "leads"
                  ? "bg-[#163422] text-white shadow-md dark:bg-[#5EEAD4] dark:text-stone-950"
                  : "text-stone-700 dark:text-[#B9E6D3] hover:bg-stone-100 dark:hover:bg-gray-800/60"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gift size={16} />
                <span>Captador Flotante (Popup)</span>
              </span>
              <span className="text-[11px] opacity-75">{leads.length}</span>
            </button>

            <button
              onClick={() => handleSelectTab("campaigns")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "campaigns"
                  ? "bg-[#163422] text-white shadow-md dark:bg-[#5EEAD4] dark:text-stone-950"
                  : "text-stone-700 dark:text-[#B9E6D3] hover:bg-stone-100 dark:hover:bg-gray-800/60"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Megaphone size={16} />
                <span>Marketing & Difusión</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-[#C5A059]">Batch</span>
            </button>

            <button
              onClick={() => handleSelectTab("settings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-[#163422] text-white shadow-md dark:bg-[#5EEAD4] dark:text-stone-950"
                  : "text-stone-700 dark:text-[#B9E6D3] hover:bg-stone-100 dark:hover:bg-gray-800/60"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings size={16} />
                <span>Ajustes & Resend API</span>
              </span>
              <ShieldCheck size={14} className="text-emerald-500" />
            </button>
          </div>

          {/* Tarjeta de Resumen Rápido */}
          <div className="bg-white dark:bg-[#12131A] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs text-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-[#76C7B2] block">
              Infraestructura Resend
            </span>
            <div className="flex justify-between items-center">
              <span className="text-stone-600 dark:text-stone-400">Motor de Envío:</span>
              <span className="font-bold text-[#163422] dark:text-[#5EEAD4] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Resend API
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600 dark:text-stone-400">Total Contactos:</span>
              <span className="font-bold">{initialAudience?.all_contacts || 0}</span>
            </div>
          </div>
        </div>

        {/* Panel Central de Contenido Dinámico */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* TAB 1 & 2: INBOX & SENT (WEBMAIL) */}
          {(activeTab === "inbox" || activeTab === "sent") && (
            <div className="bg-white dark:bg-[#12131A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden flex flex-col min-h-[580px]">
              {/* Barra Superior de Herramientas y Búsqueda */}
              <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllEmails}
                    className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors"
                    title="Seleccionar todos"
                  >
                    <CheckSquare size={16} />
                  </button>

                  <button
                    onClick={() => refreshEmails()}
                    disabled={isPending}
                    className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors"
                    title="Refrescar bandeja"
                  >
                    <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
                  </button>

                  {selectedEmailIds.length > 0 && (
                    <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-2">
                      <button
                        onClick={() => handleBulkMarkRead(true)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-stone-200 dark:hover:bg-gray-800"
                        title="Marcar como leídos"
                      >
                        Leído
                      </button>
                      <button
                        onClick={() => handleBulkMarkRead(false)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-stone-200 dark:hover:bg-gray-800"
                        title="Marcar como no leído"
                      >
                        No leído
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="p-1.5 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Eliminar seleccionados"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Buscador */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && refreshEmails()}
                    placeholder="Buscar por cliente, correo o asunto..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#163422] dark:focus:ring-[#5EEAD4]"
                  />
                </div>
              </div>

              {/* Vista dividida: Lista de Correos o Visor de Correo Detallado */}
              {viewingEmail ? (
                <div className="flex-1 flex flex-col p-6 space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => setViewingEmail(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-[#76C7B2] hover:text-[#163422] dark:hover:text-[#5EEAD4]"
                    >
                      ← Volver a la lista
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReplyToCurrentEmail}
                        className="inline-flex items-center gap-1.5 bg-[#163422] dark:bg-[#5EEAD4] text-white dark:text-stone-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:scale-102"
                      >
                        <Reply size={14} /> Responder
                      </button>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold font-serif text-[#163422] dark:text-[#E6F7F0] mb-2">
                      {viewingEmail.subject}
                    </h2>
                    <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <strong>De:</strong> {viewingEmail.from} • <strong>Para:</strong> {Array.isArray(viewingEmail.to) ? viewingEmail.to.join(", ") : viewingEmail.to}
                        {viewingEmail.customerPhone && (
                          <span className="ml-2 text-stone-600 dark:text-stone-300">📞 {viewingEmail.customerPhone}</span>
                        )}
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(viewingEmail.createdAt).toLocaleString("es-US")}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo HTML del correo */}
                  <div className="flex-1 overflow-auto bg-stone-50/50 dark:bg-stone-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div
                      className="prose dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: viewingEmail.bodyHtml }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800/80">
                  {emails.length === 0 ? (
                    <div className="py-20 text-center text-stone-400 space-y-2">
                      <Inbox size={42} className="mx-auto opacity-30" />
                      <p className="text-sm font-medium">No se encontraron correos en esta bandeja.</p>
                    </div>
                  ) : (
                    emails.map((email: any) => (
                      <div
                        key={email._id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-900/50 cursor-pointer transition-colors ${
                          !email.isRead && email.direction === "inbound"
                            ? "bg-[#163422]/5 dark:bg-[#5EEAD4]/5 font-bold"
                            : "font-normal text-stone-600 dark:text-stone-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmailIds.includes(email._id)}
                          onChange={() => handleToggleSelectEmail(email._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 dark:border-gray-700 text-[#163422] focus:ring-0"
                        />

                        {/* Remitente / Destinatario */}
                        <div
                          onClick={() => handleOpenEmail(email)}
                          className="w-40 sm:w-48 truncate text-xs text-[#163422] dark:text-[#E6F7F0] font-bold"
                        >
                          {email.customerName || (email.direction === "inbound" ? email.from : email.to[0])}
                        </div>

                        {/* Asunto & Snippet */}
                        <div onClick={() => handleOpenEmail(email)} className="flex-1 min-w-0 truncate text-xs">
                          <span className="text-stone-900 dark:text-white font-semibold">{email.subject}</span>
                          <span className="text-stone-400 ml-2">— {email.bodyText || "Haz clic para ver el contenido..."}</span>
                        </div>

                        {/* Tipo / Badge */}
                        <span className="hidden md:inline text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-[#76C7B2]">
                          {email.type.replace("_", " ")}
                        </span>

                        {/* Fecha */}
                        <div onClick={() => handleOpenEmail(email)} className="text-[10px] text-stone-400 whitespace-nowrap">
                          {new Date(email.createdAt).toLocaleDateString("es-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CARRITOS ABANDONADOS */}
          {activeTab === "abandoned" && (
            <div className="space-y-6">
              {/* Tarjetas de Métricas de Carritos */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#12131A] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-[#76C7B2] block">
                    Carritos en Riesgo
                  </span>
                  <span className="text-2xl font-black text-[#163422] dark:text-[#E6F7F0]">
                    {cartStats?.activeCount || 0}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#12131A] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-[#76C7B2] block">
                    Valor en Riesgo
                  </span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    ${(cartStats?.activeValue || 0).toFixed(2)} USD
                  </span>
                </div>
                <div className="bg-white dark:bg-[#12131A] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-[#76C7B2] block">
                    Ventas Recuperadas
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {cartStats?.recoveredCount || 0}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#12131A] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-[#76C7B2] block">
                    Ingresos Rescatados
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ${(cartStats?.recoveredValue || 0).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Tabla de Carritos Caídos */}
              <div className="bg-white dark:bg-[#12131A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-900/30">
                  <h3 className="font-bold text-sm text-[#163422] dark:text-[#E6F7F0]">
                    Clientes que dejaron su carrito pendiente
                  </h3>
                  <span className="text-xs text-stone-400 font-medium">
                    {abandonedCarts.length} carritos registrados
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {abandonedCarts.length === 0 ? (
                    <div className="py-16 text-center text-stone-400">
                      <CheckCircle2 size={36} className="mx-auto opacity-30 text-emerald-500 mb-2" />
                      <p className="text-sm font-medium">¡Excelente! No hay carritos abandonados pendientes.</p>
                    </div>
                  ) : (
                    abandonedCarts.map((cart: any) => (
                      <div key={cart._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-900/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#163422] dark:text-[#E6F7F0]">
                              {cart.customerName || "Cliente Anónimo"}
                            </span>
                            <span className="text-xs text-stone-500">({cart.customerEmail})</span>
                            {cart.customerPhone && (
                              <span className="text-xs text-stone-400">📞 {cart.customerPhone}</span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 flex items-center gap-3">
                            <span>📦 <strong>{cart.items?.length || 0} producto(s):</strong> {cart.items?.map((i: any) => i.name).join(", ")}</span>
                            <span>•</span>
                            <span className="font-bold text-stone-900 dark:text-white">${cart.subtotal?.toFixed(2)} USD</span>
                            <span>•</span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(cart.lastActivityAt).toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                              cart.recoveryStatus === "recovered"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : cart.recoveryStatus === "reminder_1_sent"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {cart.recoveryStatus === "reminder_1_sent" ? "Recordatorio Enviado" : cart.recoveryStatus}
                          </span>

                          <button
                            onClick={() => handleSendCartRecovery(cart._id, cart.customerEmail)}
                            disabled={recoveringCartId === cart._id || isPending}
                            className="inline-flex items-center gap-1.5 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-102 disabled:opacity-50"
                          >
                            {recoveringCartId === cart._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span>Enviar Recordatorio</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAPTADOR FLOTANTE DE LEADS (POPUP / NEWSLETTER) */}
          {activeTab === "leads" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Formulario de Configuración del Popup */}
              <div className="md:col-span-7 bg-white dark:bg-[#12131A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
                <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h3 className="font-bold text-base text-[#163422] dark:text-[#E6F7F0] flex items-center gap-2">
                    <Gift size={18} className="text-[#C5A059]" />
                    Configuración del Captador Flotante (Popup)
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Personaliza la notificación flotante que solicita el correo a los nuevos visitantes a cambio de un cupón de cortesía.
                  </p>
                </div>

                {/* Tarjeta de Co-Pilot: Estrategias & Generador Asistido por IA */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#163422] to-[#1F452E] text-white border border-[#C5A059]/40 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#C5A059] text-stone-950 flex items-center justify-center font-bold flex-shrink-0">
                        <Sparkles size={15} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#E6C98B] uppercase tracking-wider flex items-center gap-1.5">
                          Flor Co-Pilot • Generador de Plantillas IA
                        </h4>
                        <p className="text-[11px] text-[#E6F7F0] opacity-85">
                          Aplica una estrategia de temporada con 1 clic o genera un gancho exclusivo con IA.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiCustomBox(!showAiCustomBox)}
                      className="text-[11px] font-bold text-[#E6C98B] hover:text-white underline cursor-pointer flex-shrink-0 transition-colors"
                    >
                      {showAiCustomBox ? "Cerrar IA ✕" : "Pedir a la IA ✍️"}
                    </button>
                  </div>

                  {/* Acceso Rápido a Presets de Temporada */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                    {COPILOT_LEAD_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyLeadPreset(preset)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all text-[11px] leading-tight active:scale-95 group"
                      >
                        <span className="block font-bold text-white group-hover:text-[#E6C98B] transition-colors">
                          {preset.name}
                        </span>
                        <span className="block text-[10px] text-[#C5A059] font-mono mt-0.5 font-bold">
                          {preset.coupon}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Generador Asistido Libre */}
                  {showAiCustomBox && (
                    <div className="pt-2 border-t border-white/15 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPromptInput}
                          onChange={(e) => setAiPromptInput(e.target.value)}
                          placeholder="Ej: Aniversario de bodas con orquídeas en The Woodlands..."
                          className="flex-1 p-2 rounded-xl bg-black/30 border border-white/20 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          type="button"
                          disabled={isGeneratingWithAI}
                          onClick={() => handleGenerateLeadWithAI(aiPromptInput)}
                          className="px-3.5 py-2 bg-[#C5A059] text-stone-950 font-bold rounded-xl text-xs hover:bg-[#d6af66] transition-all flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                        >
                          {isGeneratingWithAI ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Creando...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} />
                              <span>Generar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-gray-200 dark:border-gray-800">
                    <div>
                      <strong className="text-stone-900 dark:text-white block font-bold">Estado del Captador</strong>
                      <span className="text-stone-400">Mostrar automáticamente a nuevos visitantes en la tienda.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={popupConfig.leadCaptureActive}
                      onChange={(e) => setPopupConfig({ ...popupConfig, leadCaptureActive: e.target.checked })}
                      className="w-5 h-5 rounded text-[#163422] focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {/* Selector de Plantilla */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">
                      Diseño Visual de la Notificación:
                    </label>
                    <select
                      value={popupConfig.leadCaptureTemplate}
                      onChange={(e: any) => setPopupConfig({ ...popupConfig, leadCaptureTemplate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium"
                    >
                      <option value="champagne_pill">1. Champagne Luxury Pill (Píldora Flotante Discreta)</option>
                      <option value="velvet_modal">2. Couture Velvet Modal (Ventana Emergente Centrada)</option>
                      <option value="corner_toast">3. Corner Toast Card (Tarjeta Flotante Inferior)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Título del Gancho:</label>
                    <input
                      type="text"
                      value={popupConfig.leadCaptureTitle}
                      onChange={(e) => setPopupConfig({ ...popupConfig, leadCaptureTitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Subtítulo / Promesa:</label>
                    <textarea
                      rows={2}
                      value={popupConfig.leadCaptureSubtitle}
                      onChange={(e) => setPopupConfig({ ...popupConfig, leadCaptureSubtitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700 dark:text-stone-300">Código de Cupón:</label>
                      <input
                        type="text"
                        value={popupConfig.leadCaptureCouponCode}
                        onChange={(e) => setPopupConfig({ ...popupConfig, leadCaptureCouponCode: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700 dark:text-stone-300">Tiempo de Espera (Segundos):</label>
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={popupConfig.leadCaptureDelaySeconds}
                        onChange={(e) => setPopupConfig({ ...popupConfig, leadCaptureDelaySeconds: parseInt(e.target.value) || 7 })}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSavePopupConfig}
                    disabled={isPending}
                    className="w-full py-3 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 rounded-xl font-bold transition-all shadow-md active:scale-98"
                  >
                    Guardar Configuración del Captador
                  </button>
                </div>
              </div>

              {/* Previsualización en Vivo de la Plantilla */}
              <div className="md:col-span-5 bg-white dark:bg-[#12131A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 dark:text-[#76C7B2] mb-4">
                    Previsualización en Vivo
                  </h4>

                  {/* Template 1: Champagne Pill */}
                  {popupConfig.leadCaptureTemplate === "champagne_pill" && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#163422] to-[#1B2E22] text-white border-2 border-[#C5A059] shadow-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Gift size={20} className="text-[#E6C98B] animate-bounce" />
                        <span className="text-xs font-bold font-serif">{popupConfig.leadCaptureTitle}</span>
                      </div>
                      <p className="text-[11px] text-[#E6F7F0] opacity-90 leading-tight">
                        {popupConfig.leadCaptureSubtitle}
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="email"
                          placeholder="tu@correo.com"
                          disabled
                          className="flex-1 p-2 rounded-lg text-xs bg-white/10 border border-white/20 text-white placeholder:text-white/60"
                        />
                        <button className="px-3 py-1.5 bg-[#C5A059] text-stone-950 font-bold text-xs rounded-lg">
                          Obtener
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Template 2: Velvet Modal */}
                  {popupConfig.leadCaptureTemplate === "velvet_modal" && (
                    <div className="p-5 rounded-3xl bg-[#0F1210] text-white border border-[#C5A059]/40 shadow-2xl text-center space-y-3">
                      <img src="https://bonbonflowershouston.com/logo.png" alt="Logo" className="w-12 h-12 rounded-full mx-auto border-2 border-[#C5A059]" />
                      <h4 className="font-serif font-black text-base text-[#E6C98B]">{popupConfig.leadCaptureTitle}</h4>
                      <p className="text-xs text-stone-300">{popupConfig.leadCaptureSubtitle}</p>
                      <button className="w-full py-2.5 bg-[#163422] text-white border border-[#C5A059] rounded-xl text-xs font-bold uppercase tracking-wider">
                        Reclamar Mi Cupón ({popupConfig.leadCaptureCouponCode})
                      </button>
                    </div>
                  )}

                  {/* Template 3: Corner Toast Card */}
                  {popupConfig.leadCaptureTemplate === "corner_toast" && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-700 shadow-xl space-y-2 text-stone-900 dark:text-white">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#163422] dark:text-[#5EEAD4]">
                          ✨ Regalo de Bienvenida
                        </span>
                        <X size={14} className="text-gray-400" />
                      </div>
                      <h5 className="font-bold text-xs">{popupConfig.leadCaptureTitle}</h5>
                      <p className="text-[11px] text-gray-500">{popupConfig.leadCaptureSubtitle}</p>
                      <button className="w-full py-2 bg-[#163422] text-white rounded-lg text-xs font-bold">
                        Suscribirme & Recibir Cupón
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 text-[11px] text-stone-400">
                  Total de prospectos suscritos: <strong>{leads.length}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CAMPAÑAS DE MARKETING MASIVO */}
          {activeTab === "campaigns" && (
            <div className="bg-white dark:bg-[#12131A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-base text-[#163422] dark:text-[#E6F7F0] flex items-center gap-2">
                  <Megaphone size={18} className="text-[#C5A059]" />
                  Despachador de Campañas Masivas (Batch Marketing)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Envía promociones y novedades a toda tu base de contactos para fechas cumbre (San Valentín, Día de las Madres, Navidad).
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Selector de Audiencia */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-stone-300">Audiencia Objetivo:</label>
                  <select
                    value={campaignForm.audience}
                    onChange={(e: any) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold"
                  >
                    <option value="all_contacts">Toda la Base de Contactos ({initialAudience?.all_contacts || 0} destinatarios)</option>
                    <option value="all_customers">Solo Clientes con Compras ({initialAudience?.all_customers || 0} destinatarios)</option>
                    <option value="newsletter_leads">Solo Suscriptores del Newsletter ({initialAudience?.newsletter_leads || 0} destinatarios)</option>
                    <option value="abandoned_carts">Solo Carritos Abandonados ({initialAudience?.abandoned_carts || 0} destinatarios)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-stone-300">Asunto del Correo:</label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-stone-300">Contenido HTML del Mensaje:</label>
                  <textarea
                    rows={6}
                    value={campaignForm.bodyHtml}
                    onChange={(e) => setCampaignForm({ ...campaignForm, bodyHtml: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Texto del Botón:</label>
                    <input
                      type="text"
                      value={campaignForm.ctaText}
                      onChange={(e) => setCampaignForm({ ...campaignForm, ctaText: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Enlace del Botón:</label>
                    <input
                      type="text"
                      value={campaignForm.ctaUrl}
                      onChange={(e) => setCampaignForm({ ...campaignForm, ctaUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                {/* Acciones de Envío */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="tu-correo@gmail.com"
                      className="p-2 rounded-xl border text-xs bg-white dark:bg-gray-900"
                    />
                    <button
                      onClick={() => handleSendCampaign(true)}
                      disabled={isPending}
                      className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl font-bold hover:bg-stone-200 transition-colors whitespace-nowrap"
                    >
                      Enviar Prueba
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de lanzar esta campaña a la audiencia seleccionada?`)) {
                        handleSendCampaign(false);
                      }
                    }}
                    disabled={isPending}
                    className="w-full sm:w-auto px-8 py-3 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 rounded-xl font-extrabold uppercase tracking-wider transition-all shadow-md"
                  >
                    🚀 Despachar Campaña Masiva
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AJUSTES Y CONFIGURACIÓN RESEND */}
          {activeTab === "settings" && (
            <div className="bg-white dark:bg-[#12131A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="font-bold text-base text-[#163422] dark:text-[#E6F7F0] flex items-center gap-2">
                  <Settings size={18} className="text-[#C5A059]" />
                  Ajustes de Remitente & Credenciales Resend
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Define el nombre y correo oficial desde el que se despachan las confirmaciones y notificaciones.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-stone-300">Nombre del Remitente:</label>
                  <input
                    type="text"
                    value={senderConfig.corporateSenderName}
                    onChange={(e) => setSenderConfig({ ...senderConfig, corporateSenderName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Correo Remitente Oficial:</label>
                    <input
                      type="email"
                      value={senderConfig.corporateSenderEmail}
                      onChange={(e) => setSenderConfig({ ...senderConfig, corporateSenderEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300">Correo de Respuesta (Reply-To):</label>
                    <input
                      type="email"
                      value={senderConfig.corporateReplyToEmail}
                      onChange={(e) => setSenderConfig({ ...senderConfig, corporateReplyToEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 dark:text-stone-300">API Key de Resend (Opcional):</label>
                  <input
                    type="password"
                    placeholder="re_..."
                    value={senderConfig.resendApiKey || ""}
                    onChange={(e) => setSenderConfig({ ...senderConfig, resendApiKey: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono"
                  />
                  <span className="text-[10px] text-stone-400">Si no se especifica, se toma el valor de la variable de entorno RESEND_API_KEY.</span>
                </div>

                <button
                  onClick={handleSaveSenderConfig}
                  disabled={isPending}
                  className="px-6 py-2.5 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Guardar Ajustes
                </button>
              </div>

              {/* GESTOR MULTI-MAILBOX: CUENTAS CORPORATIVAS */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#163422] dark:text-[#E6F7F0] flex items-center gap-2">
                      <AtSign size={16} className="text-[#C5A059]" />
                      Buzones & Cuentas Corporativas ({accounts.length})
                    </h4>
                    <p className="text-xs text-stone-500">
                      Administra todas las cuentas desde las que puedes recibir y emitir correos oficiales en Houston.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddAccountModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#163422] text-white dark:bg-[#5EEAD4] dark:text-stone-950 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Añadir Nueva Cuenta</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id || acc.email}
                      className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-stone-50/70 dark:bg-stone-900/50 space-y-3 relative group shadow-xs hover:border-[#C5A059]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-serif font-black text-xs shadow-xs flex-shrink-0"
                            style={{ backgroundColor: acc.color || "#163422" }}
                          >
                            {acc.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-stone-900 dark:text-white block truncate">
                              {acc.name}
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono block truncate">
                              {acc.email}
                            </span>
                          </div>
                        </div>

                        {acc.isDefault ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                            Default
                          </span>
                        ) : null}
                      </div>

                      {acc.signature && (
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 italic line-clamp-2 bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                          Firma: &ldquo;{acc.signature}&rdquo;
                        </p>
                      )}

                      <div className="text-[11px] text-stone-500 flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="font-medium text-stone-400 text-[10px]">Rol: {acc.role}</span>
                        <div className="flex items-center gap-2">
                          {!acc.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAccount(acc.email)}
                              className="text-[10px] text-[#163422] dark:text-[#5EEAD4] hover:underline font-bold cursor-pointer"
                            >
                              Hacer Default
                            </button>
                          )}
                          {accounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc.email)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="Eliminar cuenta"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL REDACTOR FLOTANTE ESTILO GMAIL (COMPOSER) */}
      {isComposerOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isComposerMinimized
              ? "bottom-0 right-6 w-72 h-12 bg-white dark:bg-[#181922] rounded-t-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between px-4"
              : "bottom-0 sm:bottom-6 right-0 sm:right-6 w-full sm:w-[580px] h-[580px] bg-white dark:bg-[#12131A] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8"
          }`}
        >
          {/* Cabecera del Redactor */}
          <div className="p-3 bg-[#163422] text-white flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold font-serif flex items-center gap-2">
              <PenSquare size={14} className="text-[#C5A059]" /> Mensaje Nuevo
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsComposerMinimized(!isComposerMinimized)}
                className="p-1 hover:bg-white/10 rounded"
              >
                {isComposerMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button onClick={() => setIsComposerOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>
          </div>

          {!isComposerMinimized && (
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto text-xs">
              {/* Selector de Plantilla Rápida */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Plantilla:</span>
                <select
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  defaultValue=""
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs bg-stone-50 dark:bg-stone-900 font-medium"
                >
                  <option value="" disabled>Seleccionar Plantilla Predefinida...</option>
                  {EMAIL_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Remitente "De:" */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 w-8 flex-shrink-0">De:</span>
                <select
                  value={composerForm.from}
                  onChange={(e) => setComposerForm({ ...composerForm, from: e.target.value })}
                  className="flex-1 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs bg-stone-50 dark:bg-stone-900 font-bold text-[#163422] dark:text-[#5EEAD4]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id || acc.email} value={`${acc.name} <${acc.email}>`}>
                      {acc.name} ({acc.email}) • {acc.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destinatario y Asunto */}
              <div className="space-y-2">
                <input
                  type="email"
                  value={composerForm.to}
                  onChange={(e) => setComposerForm({ ...composerForm, to: e.target.value })}
                  placeholder="Para: cliente@correo.com"
                  className="w-full p-2 border-b border-gray-200 dark:border-gray-800 bg-transparent focus:outline-none font-medium"
                />
                <input
                  type="text"
                  value={composerForm.subject}
                  onChange={(e) => setComposerForm({ ...composerForm, subject: e.target.value })}
                  placeholder="Asunto del correo..."
                  className="w-full p-2 border-b border-gray-200 dark:border-gray-800 bg-transparent focus:outline-none font-bold"
                />
              </div>

              {/* Cuerpo del Mensaje */}
              <textarea
                rows={10}
                value={composerForm.bodyHtml}
                onChange={(e) => setComposerForm({ ...composerForm, bodyHtml: e.target.value })}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-stone-50/50 dark:bg-stone-900/40 focus:outline-none text-xs leading-relaxed"
              />

              {/* Barra Inferior de Acciones */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <button
                  onClick={handleSendCustomEmail}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 px-6 py-2.5 rounded-full text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Enviar</span>
                </button>

                <div className="text-[10px] text-stone-400">
                  Despachado con Resend • Atajo: <strong>Ctrl + Enter</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA AGREGAR NUEVA CUENTA CORPORATIVA */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#163422] text-white flex items-center justify-center">
                  <AtSign size={16} className="text-[#C5A059]" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Nueva Cuenta de Correo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Correo Electrónico Corporativo:
                </label>
                <input
                  type="email"
                  value={newAccountForm.email}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, email: e.target.value.toLowerCase() })}
                  placeholder="ej: sales@bonbonflowershouston.com"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-stone-50 dark:bg-stone-900 font-mono text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Nombre Visible del Remitente:
                </label>
                <input
                  type="text"
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  placeholder="ej: Ventas & Pedidos VIP"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-stone-50 dark:bg-stone-900 font-medium text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Rol o Departamento:
                  </label>
                  <input
                    type="text"
                    value={newAccountForm.role}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, role: e.target.value })}
                    placeholder="ej: Ventas, Soporte, CEO"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Color Distintivo:
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {["#163422", "#C5A059", "#0F1210", "#2563EB", "#8B5CF6", "#FF97A4", "#0D9488"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewAccountForm({ ...newAccountForm, color: c })}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          newAccountForm.color === c ? "scale-125 ring-2 ring-offset-2 ring-stone-900 dark:ring-white" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Firma al Pie del Correo (Opcional):
                </label>
                <input
                  type="text"
                  value={newAccountForm.signature}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, signature: e.target.value })}
                  placeholder="ej: Equipo de Ventas VIP • Bonbon Flowers Houston"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAccountForm.isDefault}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-[#163422]"
                />
                <span className="font-medium text-stone-600 dark:text-stone-300">
                  Establecer como cuenta predeterminada para envíos
                </span>
              </label>

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#5EEAD4] dark:hover:bg-[#2DD4BF] text-white dark:text-stone-950 font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Crear Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
