"use server";

import dbConnect from "@/lib/db";
import { NewsletterLead } from "@/lib/models/NewsletterLead";
import { SiteConfig } from "@/lib/models/SiteConfig";
import { EmailMessage } from "@/lib/models/EmailMessage";
import {
  sendEmail,
  getCorporateEmailConfig,
  wrapInBonbonEmailTemplate,
} from "@/lib/email";
import { revalidatePath } from "next/cache";
import { escapeRegex } from "@/lib/utils/sanitize";

export async function captureLeadAction(data: {
  email: string;
  name?: string;
  phone?: string;
  source?: "floating_popup" | "footer_form" | "checkout_optin";
  templateId?: string;
}) {
  try {
    const email = data.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    await dbConnect();
    const config: any = await SiteConfig.findOne({ key: "global" }).lean();
    const couponCode = config?.leadCaptureCouponCode?.trim() || "BIENVENIDO10";

    // Verificar si ya existe
    let lead = await NewsletterLead.findOne({ email });
    const isNew = !lead;

    if (!lead) {
      lead = await NewsletterLead.create({
        email,
        name: data.name?.trim() || "",
        phone: data.phone?.trim() || "",
        source: data.source || "floating_popup",
        appliedTemplateId: data.templateId || config?.leadCaptureTemplate || "champagne_pill",
        couponGiven: couponCode,
        status: "subscribed",
      });
    }

    // Enviar correo de bienvenida con el cupón solo si es nuevo
    if (isNew) {
      try {
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://bonbonflowerhouston.com").replace(/\/$/, "");
        const emailCfg = await getCorporateEmailConfig();

        const greeting = data.name?.trim() ? `¡Bienvenido/a, <strong>${data.name.trim()}</strong>!` : "¡Bienvenido/a a Bonbon Flowers!";

        const bodyHtml = `
          <p style="font-size: 16px; color: #163422; margin-bottom: 8px;">${greeting}</p>
          <p style="font-size: 14px; line-height: 1.6; color: #374151;">
            Es un placer darte la bienvenida al selecto círculo de <strong>Bonbon Flowers Houston</strong>. Como muestra de agradecimiento por unirte a nuestra comunidad floral, te obsequiamos este beneficio exclusivo para tu primera orden:
          </p>

          <div style="margin: 24px 0; padding: 20px; background-color: #F8FAF9; border: 2px dashed #C5A059; border-radius: 14px; text-align: center;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #163422; font-weight: bold; display: block; margin-bottom: 6px;">
              Tu Cupón de Cortesía (10% OFF)
            </span>
            <strong style="font-size: 24px; color: #163422; letter-spacing: 3px; font-family: monospace;">
              ${couponCode}
            </strong>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #4B5563;">
              Válido en toda nuestra colección de rosas premium, orquídeas y arreglos de alta costura con entrega en Houston.
            </p>
          </div>

          <p style="font-size: 13px; color: #64748B; text-align: center;">
            Haz clic en el botón de abajo para explorar la colección y aplicar tu cupón:
          </p>
        `;

        const subject = `🌸 ¡Tu regalo de bienvenida de Bonbon Flowers! (Cupón: ${couponCode})`;
        const wrappedHtml = wrapInBonbonEmailTemplate({
          title: subject,
          preheader: `Recibe 10% de descuento en tu primer arreglo floral. Código: ${couponCode}.`,
          bodyHtml,
          ctaText: "✨ Explorar Colección Floral",
          ctaUrl: `${siteUrl}/productos?coupon=${couponCode}`,
          showContactFooter: true,
        });

        const sendRes = await sendEmail({
          to: email,
          subject,
          html: wrappedHtml,
          replyTo: emailCfg.replyTo,
        });

        if (sendRes.success) {
          await EmailMessage.create({
            direction: "outbound",
            type: "newsletter_welcome",
            from: sendRes.sender || emailCfg.senderFormatted,
            to: [email],
            replyTo: emailCfg.replyTo,
            subject,
            bodyHtml: wrappedHtml,
            status: "sent",
            isRead: true,
            customerName: data.name || "",
            customerEmail: email,
            resendMessageId: sendRes.messageId,
            metadata: { couponGiven: couponCode },
            createdAt: new Date(),
          });
        }
      } catch (emailErr) {
        console.error("Error al despachar correo de bienvenida:", emailErr);
      }
    }

    revalidatePath("/admin/correos");
    return {
      success: true,
      couponCode,
      message: isNew
        ? `¡Gracias por suscribirte! Te hemos enviado tu cupón ${couponCode} al correo.`
        : `Ya estás registrado en nuestro club. Tu cupón activo es ${couponCode}.`,
    };
  } catch (error: any) {
    console.error("Error al registrar lead:", error);
    return { success: false, error: error?.message || "Error al procesar suscripción." };
  }
}

export async function getNewsletterLeadsAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    await dbConnect();
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const query: any = {};

    if (params?.search?.trim()) {
      const regex = new RegExp(escapeRegex(params.search.trim()), "i");
      query.$or = [{ email: regex }, { name: regex }, { phone: regex }];
    }

    const total = await NewsletterLead.countDocuments(query);
    const leads = await NewsletterLead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(leads)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al cargar leads." };
  }
}

export async function updateLeadCaptureConfigAction(data: {
  leadCaptureActive: boolean;
  leadCaptureTemplate: "champagne_pill" | "velvet_modal" | "corner_toast";
  leadCaptureTitle: string;
  leadCaptureSubtitle: string;
  leadCaptureCouponCode: string;
  leadCaptureDelaySeconds: number;
}) {
  try {
    await dbConnect();
    await SiteConfig.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          leadCaptureActive: data.leadCaptureActive,
          leadCaptureTemplate: data.leadCaptureTemplate,
          leadCaptureTitle: data.leadCaptureTitle.trim(),
          leadCaptureSubtitle: data.leadCaptureSubtitle.trim(),
          leadCaptureCouponCode: data.leadCaptureCouponCode.trim().toUpperCase(),
          leadCaptureDelaySeconds: data.leadCaptureDelaySeconds,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    revalidatePath("/admin/correos");
    revalidatePath("/");
    return { success: true, message: "Configuración del captador flotante guardada." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al guardar configuración." };
  }
}

export async function getLeadCaptureConfigAction() {
  try {
    await dbConnect();
    const config: any = await SiteConfig.findOne({ key: "global" }).lean();
    return {
      success: true,
      data: {
        leadCaptureActive: config?.leadCaptureActive ?? true,
        leadCaptureTemplate: config?.leadCaptureTemplate || "champagne_pill",
        leadCaptureTitle: config?.leadCaptureTitle || "Recibe 10% de Regalo en tu Primera Compra",
        leadCaptureSubtitle:
          config?.leadCaptureSubtitle ||
          "Suscríbete a nuestro club exclusivo y recibe un cupón de cortesía para tu próximo arreglo floral.",
        leadCaptureCouponCode: config?.leadCaptureCouponCode || "BIENVENIDO10",
        leadCaptureDelaySeconds: config?.leadCaptureDelaySeconds ?? 7,
      },
    };
  } catch (e: any) {
    return {
      success: true,
      data: {
        leadCaptureActive: true,
        leadCaptureTemplate: "champagne_pill",
        leadCaptureTitle: "Recibe 10% de Regalo en tu Primera Compra",
        leadCaptureSubtitle: "Suscríbete a nuestro club exclusivo y recibe un cupón de cortesía.",
        leadCaptureCouponCode: "BIENVENIDO10",
        leadCaptureDelaySeconds: 7,
      },
    };
  }
}
