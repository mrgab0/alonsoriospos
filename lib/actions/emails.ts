"use server";

import dbConnect from "@/lib/db";
import { EmailMessage } from "@/lib/models/EmailMessage";
import { SiteConfig, ICorporateAccount } from "@/lib/models/SiteConfig";
import {
  sendEmail,
  getCorporateEmailConfig,
  wrapInBonbonEmailTemplate,
} from "@/lib/email";
import { revalidatePath } from "next/cache";
import { escapeRegex } from "@/lib/utils/sanitize";

const DEFAULT_CORPORATE_ACCOUNTS: ICorporateAccount[] = [
  {
    id: "contacto",
    email: "contacto@bonbonflowershouston.com",
    name: "Bonbon Flowers Houston",
    role: "Atención al Cliente",
    color: "#163422",
    isDefault: true,
    signature: "Bonbon Flowers Houston • Boutique Digital de Flores de Lujo",
  },
  {
    id: "sales",
    email: "sales@bonbonflowershouston.com",
    name: "Ventas & Pedidos VIP",
    role: "Ventas y Cotizaciones",
    color: "#C5A059",
    isDefault: false,
    signature: "Equipo de Ventas • Bonbon Flowers Houston",
  },
  {
    id: "ceo",
    email: "ceo@bonbonflowershouston.com",
    name: "Dirección Ejecutiva",
    role: "Gerencia General",
    color: "#0F1210",
    isDefault: false,
    signature: "Dirección Ejecutiva • Bonbon Flowers Houston",
  },
];

export async function getEmailsAction(params?: {
  folder?: "inbox" | "sent" | "all";
  type?: string;
  search?: string;
  accountEmail?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await dbConnect();
    const folder = params?.folder || "inbox";
    const search = params?.search?.trim() || "";
    const accountEmail = params?.accountEmail?.trim()?.toLowerCase() || "";
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const andConditions: any[] = [{ isDeleted: { $ne: true } }];

    if (folder === "inbox") {
      andConditions.push({ direction: "inbound" });
    } else if (folder === "sent") {
      andConditions.push({ direction: "outbound" });
    }

    if (params?.type && params.type !== "all") {
      andConditions.push({ type: params.type });
    }

    if (accountEmail && accountEmail !== "all") {
      const emailRegex = new RegExp(escapeRegex(accountEmail), "i");
      andConditions.push({
        $or: [
          { mailboxEmail: emailRegex },
          { from: emailRegex },
          { to: emailRegex },
        ],
      });
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      andConditions.push({
        $or: [
          { subject: regex },
          { customerName: regex },
          { customerEmail: regex },
          { customerPhone: regex },
          { from: regex },
          { to: regex },
          { orderId: regex },
        ],
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const total = await EmailMessage.countDocuments(query);

    let unreadQuery: any = { direction: "inbound", isRead: false, isDeleted: { $ne: true } };
    if (accountEmail && accountEmail !== "all") {
      const emailRegex = new RegExp(escapeRegex(accountEmail), "i");
      unreadQuery.$or = [
        { mailboxEmail: emailRegex },
        { to: emailRegex },
      ];
    }
    const unreadCount = await EmailMessage.countDocuments(unreadQuery);

    const messages = await EmailMessage.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(messages)),
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error: any) {
    console.error("Error al obtener correos:", error);
    return { success: false, error: error?.message || "Error al cargar correos." };
  }
}

export async function sendCustomEmailAction(data: {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  from?: string;
  type?:
    | "direct_email"
    | "quote"
    | "delivery_update"
    | "abandoned_cart_recovery"
    | "general";
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderId?: string;
  bccAdmins?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;
}) {
  try {
    await dbConnect();
    const emailCfg = await getCorporateEmailConfig();
    const toRecipients = Array.isArray(data.to)
      ? data.to.map((e) => e.trim()).filter(Boolean)
      : data.to.split(",").map((e) => e.trim()).filter(Boolean);

    if (toRecipients.length === 0) {
      return { success: false, error: "Debes ingresar al menos un correo de destino válido." };
    }

    if (!data.subject.trim()) {
      return { success: false, error: "El asunto del correo no puede estar vacío." };
    }

    if (!data.bodyHtml.trim()) {
      return { success: false, error: "El contenido del mensaje no puede estar vacío." };
    }

    // Lista final de destinatarios con copia oculta a administradores si está activado
    const bccList: string[] = [];
    if (data.bccAdmins !== false) {
      for (const adm of emailCfg.adminEmails) {
        if (!toRecipients.includes(adm)) {
          bccList.push(adm);
        }
      }
    }

    // Renderizado de adjuntos en HTML elegante si existen
    const attachmentsHtml =
      data.attachments && data.attachments.length > 0
        ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #F8FAF9; border: 1px solid rgba(22, 52, 34, 0.12); border-radius: 12px;">
          <strong style="color: #163422; font-size: 13px;">📎 Archivos y Fotos Adjuntas (${data.attachments.length}):</strong>
          <div style="margin-top: 10px;">
            ${data.attachments
              .map((att) => {
                const isImg =
                  att.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
                  att.mimeType?.startsWith("image/");
                if (isImg) {
                  return `
                  <div style="margin-bottom: 12px;">
                    <a href="${att.url}" target="_blank" style="text-decoration: none;">
                      <img src="${att.url}" alt="${att.filename}" style="max-width: 100%; max-height: 280px; border-radius: 10px; border: 1px solid #E5E7EB; display: block; object-fit: cover;" />
                      <span style="font-size: 11px; color: #163422; font-weight: bold; display: block; margin-top: 6px;">🔍 Clic para ampliar: ${att.filename}</span>
                    </a>
                  </div>
                `;
                }
                return `
                <div style="margin-bottom: 6px;">
                  <a href="${att.url}" target="_blank" style="color: #163422; font-size: 12px; font-weight: bold; text-decoration: underline;">
                    📄 Descargar: ${att.filename}
                  </a>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `
        : "";

    const wrappedHtml = wrapInBonbonEmailTemplate({
      title: data.subject.trim(),
      preheader: data.subject.trim(),
      bodyHtml: `
        <div>
          ${data.customerName ? `<p style="font-size: 15px; font-weight: bold; color: #163422; margin-bottom: 16px;">Estimado/a ${data.customerName},</p>` : ""}
          <div style="font-size: 14px; line-height: 1.7; color: #2D3748;">
            ${data.bodyHtml}
          </div>
          ${attachmentsHtml}
        </div>
      `,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      showContactFooter: true,
    });

    const resendAttachments = data.attachments?.map((att) => ({
      filename: att.filename,
      path: att.url,
    }));

    const sendRes = await sendEmail({
      to: toRecipients,
      bcc: bccList.length > 0 ? bccList : undefined,
      from: data.from || emailCfg.senderFormatted,
      subject: data.subject.trim(),
      html: wrappedHtml,
      replyTo: emailCfg.replyTo,
      attachments: resendAttachments,
    });

    if (!sendRes.success) {
      return { success: false, error: sendRes.error || "No se pudo entregar el correo." };
    }

    // Determinar remitente final y mailboxEmail
    const fromStr = data.from || sendRes.sender || emailCfg.senderFormatted;
    const emailMatch = fromStr.match(/<([^>]+)>/);
    const mailboxEmail = (emailMatch ? emailMatch[1] : fromStr).trim().toLowerCase();

    // Registrar en MongoDB
    const logged = await EmailMessage.create({
      direction: "outbound",
      type: data.type || "direct_email",
      from: fromStr,
      mailboxEmail,
      to: toRecipients,
      replyTo: emailCfg.replyTo,
      subject: data.subject.trim(),
      bodyHtml: wrappedHtml,
      bodyText: data.bodyText || "",
      status: "sent",
      isRead: true,
      customerName: data.customerName || "",
      customerPhone: data.customerPhone || "",
      customerEmail: data.customerEmail || toRecipients[0],
      orderId: data.orderId || "",
      resendMessageId: sendRes.messageId || "",
      bccAdmins: data.bccAdmins !== false,
      attachments: data.attachments || [],
      createdAt: new Date(),
    });

    revalidatePath("/admin/correos");
    return {
      success: true,
      message: `Correo enviado exitosamente a ${toRecipients.join(", ")}`,
      data: JSON.parse(JSON.stringify(logged)),
    };
  } catch (error: any) {
    console.error("Error al enviar correo desde el panel:", error);
    return { success: false, error: error?.message || "Error al enviar correo." };
  }
}

export async function markEmailAsReadAction(id: string, isRead: boolean = true) {
  try {
    await dbConnect();
    await EmailMessage.findByIdAndUpdate(id, { isRead });
    revalidatePath("/admin/correos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al actualizar estado." };
  }
}

export async function bulkMarkEmailsAsReadAction(ids: string[], isRead: boolean = true) {
  try {
    await dbConnect();
    if (!ids || ids.length === 0) return { success: true };
    await EmailMessage.updateMany({ _id: { $in: ids } }, { isRead });
    revalidatePath("/admin/correos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al actualizar correos en lote." };
  }
}

export async function deleteEmailAction(id: string) {
  try {
    await dbConnect();
    await EmailMessage.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    revalidatePath("/admin/correos");
    revalidatePath("/admin/papelera");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al mover correo a la papelera." };
  }
}

export async function bulkDeleteEmailsAction(ids: string[]) {
  try {
    await dbConnect();
    if (!ids || ids.length === 0) return { success: true };
    await EmailMessage.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    revalidatePath("/admin/correos");
    revalidatePath("/admin/papelera");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al mover correos a la papelera." };
  }
}

export async function getEmailStatsAction() {
  try {
    await dbConnect();
    const unreadInbox = await EmailMessage.countDocuments({ direction: "inbound", isRead: false, isDeleted: { $ne: true } });
    const totalInbox = await EmailMessage.countDocuments({ direction: "inbound", isDeleted: { $ne: true } });
    const totalSent = await EmailMessage.countDocuments({ direction: "outbound", isDeleted: { $ne: true } });
    return { success: true, unreadInbox, totalInbox, totalSent };
  } catch (error: any) {
    return { success: false, unreadInbox: 0, totalInbox: 0, totalSent: 0 };
  }
}

export async function saveEmailSettingsAction(settings: {
  corporateSenderEmail: string;
  corporateSenderName: string;
  corporateReplyToEmail: string;
  resendApiKey?: string;
  adminNotifyEmails: string[];
}) {
  try {
    await dbConnect();
    await SiteConfig.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          corporateSenderEmail: settings.corporateSenderEmail.trim(),
          corporateSenderName: settings.corporateSenderName.trim(),
          corporateReplyToEmail: settings.corporateReplyToEmail.trim(),
          ...(settings.resendApiKey ? { resendApiKey: settings.resendApiKey.trim() } : {}),
          adminNotifyEmails: settings.adminNotifyEmails,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    revalidatePath("/admin/correos");
    return { success: true, message: "Configuración guardada correctamente." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al guardar configuración." };
  }
}

export async function getCorporateAccountsAction(): Promise<{
  success: boolean;
  accounts: (ICorporateAccount & { unreadCount?: number })[];
  defaultAccount?: ICorporateAccount;
  error?: string;
}> {
  try {
    await dbConnect();
    const cfg: any = await SiteConfig.findOne({ key: "global" }).lean();
    let accounts: (ICorporateAccount & { unreadCount?: number })[] = [];

    if (cfg?.corporateAccounts && Array.isArray(cfg.corporateAccounts) && cfg.corporateAccounts.length > 0) {
      accounts = JSON.parse(JSON.stringify(cfg.corporateAccounts));
    } else {
      accounts = JSON.parse(JSON.stringify(DEFAULT_CORPORATE_ACCOUNTS));
    }

    // Calcular no leídos por cada cuenta
    for (const acc of accounts) {
      const emailRegex = new RegExp(escapeRegex(acc.email), "i");
      acc.unreadCount = await EmailMessage.countDocuments({
        direction: "inbound",
        isRead: false,
        isDeleted: { $ne: true },
        $or: [
          { mailboxEmail: emailRegex },
          { to: emailRegex },
        ],
      });
    }

    const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];

    return {
      success: true,
      accounts,
      defaultAccount: defaultAcc,
    };
  } catch (error: any) {
    console.error("Error al obtener cuentas corporativas:", error);
    return {
      success: false,
      accounts: DEFAULT_CORPORATE_ACCOUNTS,
      defaultAccount: DEFAULT_CORPORATE_ACCOUNTS[0],
      error: error?.message,
    };
  }
}

export async function saveCorporateAccountsAction(accounts: ICorporateAccount[]) {
  try {
    if (!accounts || accounts.length === 0) {
      return { success: false, error: "Debe existir al menos una cuenta corporativa." };
    }
    const cleanAccounts = accounts.map((acc, index) => {
      const email = (acc.email || "").trim().toLowerCase();
      const name = (acc.name || "").trim() || email.split("@")[0] || "Cuenta";
      const id = acc.id || email.split("@")[0] || `acct-${index}`;
      return {
        ...acc,
        id,
        email,
        name,
        role: acc.role?.trim() || "General",
        color: acc.color || "#163422",
        isDefault: Boolean(acc.isDefault),
        signature: acc.signature || "",
      };
    });

    if (!cleanAccounts.some((a) => a.isDefault)) {
      cleanAccounts[0].isDefault = true;
    }

    await dbConnect();
    await SiteConfig.findOneAndUpdate(
      { key: "global" },
      { $set: { corporateAccounts: cleanAccounts, updatedAt: new Date() } },
      { upsert: true }
    );

    revalidatePath("/admin/correos");
    return { success: true, message: "Cuentas corporativas guardadas correctamente." };
  } catch (error: any) {
    console.error("Error guardando cuentas corporativas:", error);
    return { success: false, error: error?.message || "Error al guardar cuentas." };
  }
}
