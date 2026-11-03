"use server";

import dbConnect from "@/lib/db";
import { AbandonedCart, IAbandonedCartItem } from "@/lib/models/AbandonedCart";
import { EmailMessage } from "@/lib/models/EmailMessage";
import {
  sendEmail,
  getCorporateEmailConfig,
  wrapInBonbonEmailTemplate,
} from "@/lib/email";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { escapeRegex } from "@/lib/utils/sanitize";

export async function saveAbandonedCartAction(data: {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  items: IAbandonedCartItem[];
  subtotal: number;
  stepReached?: "customer_info" | "delivery_selected" | "payment_method";
}) {
  try {
    const email = data.customerEmail?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return { success: false, error: "Correo electrónico no válido." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "El carrito está vacío." };
    }

    await dbConnect();

    // Buscar si ya existe un carrito no recuperado de las últimas 24 horas para este correo
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cart = await AbandonedCart.findOne({
      customerEmail: email,
      recoveryStatus: { $in: ["abandoned", "reminder_1_sent"] },
      createdAt: { $gte: oneDayAgo },
    });

    if (cart) {
      cart.items = data.items;
      cart.subtotal = data.subtotal;
      if (data.customerName) cart.customerName = data.customerName.trim();
      if (data.customerPhone) cart.customerPhone = data.customerPhone.trim();
      if (data.stepReached) cart.stepReached = data.stepReached;
      cart.lastActivityAt = new Date();
      await cart.save();
    } else {
      const cartToken = crypto.randomUUID();
      cart = await AbandonedCart.create({
        cartToken,
        customerEmail: email,
        customerName: data.customerName?.trim() || "",
        customerPhone: data.customerPhone?.trim() || "",
        items: data.items,
        subtotal: data.subtotal,
        stepReached: data.stepReached || "customer_info",
        recoveryStatus: "abandoned",
        lastActivityAt: new Date(),
      });
    }

    return {
      success: true,
      cartToken: cart.cartToken,
    };
  } catch (error: any) {
    console.error("Error al registrar carrito abandonado:", error);
    return { success: false, error: error?.message || "Error al registrar carrito." };
  }
}

export async function getAbandonedCartsAction(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  try {
    await dbConnect();
    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const query: any = {};

    if (params?.status && params.status !== "all") {
      query.recoveryStatus = params.status;
    }

    if (params?.search?.trim()) {
      const regex = new RegExp(escapeRegex(params.search.trim()), "i");
      query.$or = [
        { customerEmail: regex },
        { customerName: regex },
        { customerPhone: regex },
      ];
    }

    const total = await AbandonedCart.countDocuments(query);
    const carts = await AbandonedCart.find(query)
      .sort({ lastActivityAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Estadísticas
    const totalAbandonedSum = await AbandonedCart.aggregate([
      { $match: { recoveryStatus: { $in: ["abandoned", "reminder_1_sent", "reminder_2_sent"] } } },
      { $group: { _id: null, totalValue: { $sum: "$subtotal" }, count: { $sum: 1 } } },
    ]);

    const totalRecoveredSum = await AbandonedCart.aggregate([
      { $match: { recoveryStatus: "recovered" } },
      { $group: { _id: null, totalValue: { $sum: "$subtotal" }, count: { $sum: 1 } } },
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(carts)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        activeCount: totalAbandonedSum[0]?.count || 0,
        activeValue: totalAbandonedSum[0]?.totalValue || 0,
        recoveredCount: totalRecoveredSum[0]?.count || 0,
        recoveredValue: totalRecoveredSum[0]?.totalValue || 0,
      },
    };
  } catch (error: any) {
    console.error("Error al obtener carritos abandonados:", error);
    return { success: false, error: error?.message || "Error al cargar carritos." };
  }
}

export async function sendAbandonedCartRecoveryAction(data: {
  cartId: string;
  customCoupon?: string;
  customMessage?: string;
}) {
  try {
    await dbConnect();
    const cart = await AbandonedCart.findById(data.cartId);
    if (!cart) {
      return { success: false, error: "Carrito no encontrado." };
    }

    if (!cart.customerEmail) {
      return { success: false, error: "El carrito no tiene correo electrónico asociado." };
    }

    const emailCfg = await getCorporateEmailConfig();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://bonbonflowerhouston.com").replace(/\/$/, "");
    const recoveryUrl = `${siteUrl}/checkout?recover=${cart.cartToken}`;

    const itemsListHtml = cart.items
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #EAEAEA;">
          <td style="padding: 12px 8px; width: 64px;">
            <img src="${item.image || `${siteUrl}/logo.png`}" alt="${item.name}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #E5E7EB; display: block;" />
          </td>
          <td style="padding: 12px 10px; text-align: left;">
            <strong style="color: #163422; font-size: 14px; display: block;">${item.name}</strong>
            <span style="font-size: 12px; color: #64748B;">Cantidad: ${item.quantity}</span>
          </td>
          <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #163422; font-size: 14px;">
            $${(item.price * item.quantity).toFixed(2)} USD
          </td>
        </tr>
      `
      )
      .join("");

    const couponHtml = data.customCoupon
      ? `
      <div style="margin: 20px 0; padding: 16px; background-color: #F0FDF4; border: 1px dashed #163422; border-radius: 12px; text-align: center;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #163422; font-weight: bold; display: block; margin-bottom: 4px;">Cortesía Exclusiva</span>
        <strong style="font-size: 18px; color: #163422; letter-spacing: 2px;">${data.customCoupon}</strong>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #4B5563;">Aplica este cupón al finalizar tu pedido para recibir tu beneficio especial.</p>
      </div>
    `
      : "";

    const customerGreeting = cart.customerName
      ? `Hola <strong>${cart.customerName}</strong>,`
      : "Hola,";

    const bodyHtml = `
      <p style="font-size: 16px; color: #163422; margin-bottom: 8px;">${customerGreeting}</p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; margin-top: 0;">
        Notamos que dejaste un arreglo floral exclusivo esperando en tu carrito. Cada uno de nuestros diseños florales y fragancias es confeccionado artesanalmente en Houston para garantizar máxima frescura y distinción.
      </p>

      ${data.customMessage ? `<div style="margin: 16px 0; padding: 14px; background: #FAF5FF; border-left: 3px solid #163422; font-size: 13px; color: #1F2937;">${data.customMessage}</div>` : ""}

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #163422;">
            <th colspan="2" style="text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #163422;">Arreglo Reservado</th>
            <th style="text-align: right; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #163422;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 14px 8px; text-align: right; font-weight: bold; font-size: 13px; color: #163422;">Total Estimado:</td>
            <td style="padding: 14px 8px; text-align: right; font-weight: 800; font-size: 17px; color: #163422;">$${cart.subtotal.toFixed(2)} USD</td>
          </tr>
        </tfoot>
      </table>

      ${couponHtml}

      <p style="font-size: 13px; color: #64748B; text-align: center; margin-top: 15px;">
        Haz clic en el botón de abajo para reabrir tu pedido al instante con todos tus ramos y datos ya precargados:
      </p>
    `;

    const subject = `🌸 Tu arreglo exclusivo te espera en Bonbon Flowers (${cart.items[0]?.name || "Arreglo Floral"})`;

    const wrappedHtml = wrapInBonbonEmailTemplate({
      title: subject,
      preheader: `Completa tu pedido en Houston con un clic. Total: $${cart.subtotal.toFixed(2)} USD.`,
      bodyHtml,
      ctaText: "🌸 Completar mi Pedido en 1 Clic",
      ctaUrl: recoveryUrl,
      showContactFooter: true,
    });

    const sendRes = await sendEmail({
      to: cart.customerEmail,
      subject,
      html: wrappedHtml,
      replyTo: emailCfg.replyTo,
    });

    if (!sendRes.success) {
      return { success: false, error: sendRes.error || "No se pudo entregar el correo de recuperación." };
    }

    // Actualizar estado del carrito
    cart.recoveryStatus = cart.recoveryStatus === "abandoned" ? "reminder_1_sent" : "reminder_2_sent";
    cart.recoveryEmailSentAt = new Date();
    await cart.save();

    // Registrar en EmailMessage
    await EmailMessage.create({
      direction: "outbound",
      type: "abandoned_cart_recovery",
      from: sendRes.sender || emailCfg.senderFormatted,
      to: [cart.customerEmail],
      replyTo: emailCfg.replyTo,
      subject,
      bodyHtml: wrappedHtml,
      status: "sent",
      isRead: true,
      customerName: cart.customerName,
      customerPhone: cart.customerPhone,
      customerEmail: cart.customerEmail,
      resendMessageId: sendRes.messageId,
      metadata: { cartToken: cart.cartToken, subtotal: cart.subtotal },
      createdAt: new Date(),
    });

    revalidatePath("/admin/correos");
    return {
      success: true,
      message: `Correo de recuperación enviado exitosamente a ${cart.customerEmail}`,
    };
  } catch (error: any) {
    console.error("Error al enviar recordatorio de carrito:", error);
    return { success: false, error: error?.message || "Error al enviar recuperación." };
  }
}

export async function restoreAbandonedCartAction(cartToken: string) {
  try {
    if (!cartToken) return { success: false, error: "Token inválido" };
    await dbConnect();
    const cart = await AbandonedCart.findOne({ cartToken }).lean();
    if (!cart) {
      return { success: false, error: "Carrito no encontrado o ya expirado." };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(cart)),
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al restaurar carrito." };
  }
}

export async function markCartAsRecoveredAction(cartToken: string, orderId: string) {
  try {
    if (!cartToken) return { success: true };
    await dbConnect();
    await AbandonedCart.findOneAndUpdate(
      { cartToken },
      {
        $set: {
          recoveryStatus: "recovered",
          recoveredOrderId: orderId,
          updatedAt: new Date(),
        },
      }
    );
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
