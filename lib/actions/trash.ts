"use server";

import dbConnect from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Addon } from "@/lib/models/Addon";
import { EmailMessage } from "@/lib/models/EmailMessage";
import { revalidatePath } from "next/cache";
import { escapeRegex } from "@/lib/utils/sanitize";

export type TrashItemType = "product" | "addon" | "email";

export interface ITrashItem {
  id: string;
  type: TrashItemType;
  title: string;
  subtitle?: string;
  details?: string;
  image?: string;
  badge?: string;
  price?: number;
  deletedAt: string;
  createdAt?: string;
}

export interface TrashStats {
  total: number;
  products: number;
  addons: number;
  emails: number;
}

export async function getTrashStatsAction(): Promise<{
  success: boolean;
  data: TrashStats;
  error?: string;
}> {
  try {
    await dbConnect();
    const [products, addons, emails] = await Promise.all([
      Product.countDocuments({ isDeleted: true }),
      Addon.countDocuments({ isDeleted: true }),
      EmailMessage.countDocuments({ isDeleted: true }),
    ]);

    return {
      success: true,
      data: {
        total: products + addons + emails,
        products,
        addons,
        emails,
      },
    };
  } catch (error: any) {
    console.error("Error al obtener estadísticas de papelera:", error);
    return {
      success: false,
      data: { total: 0, products: 0, addons: 0, emails: 0 },
      error: error?.message || "Error al cargar conteos.",
    };
  }
}

export async function getTrashItemsAction(params?: {
  type?: "all" | "products" | "addons" | "emails";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: ITrashItem[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}> {
  try {
    await dbConnect();
    const filterType = params?.type || "all";
    const search = params?.search?.trim() || "";
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const items: ITrashItem[] = [];

    // 1. PRODUCTOS
    if (filterType === "all" || filterType === "products") {
      const prodQuery: any = { isDeleted: true };
      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        prodQuery.$or = [
          { name: regex },
          { category: regex },
          { sku: regex },
          { description: regex },
        ];
      }
      const rawProducts = await Product.find(prodQuery)
        .sort({ deletedAt: -1, updatedAt: -1 })
        .limit(limit * 2)
        .lean();

      for (const p of (rawProducts as any[])) {
        items.push({
          id: p._id.toString(),
          type: "product",
          title: p.name || "Producto sin nombre",
          subtitle: p.category ? `Categoría: ${p.category}` : undefined,
          details: p.sku ? `SKU: ${p.sku}` : undefined,
          image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (typeof p.images === "string" ? p.images : undefined),
          badge: p.category || "Floristería",
          price: typeof p.price === "number" ? p.price : undefined,
          deletedAt: p.deletedAt ? new Date(p.deletedAt).toISOString() : new Date().toISOString(),
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
        });
      }
    }

    // 2. ADICIONALES
    if (filterType === "all" || filterType === "addons") {
      const addonQuery: any = { isDeleted: true };
      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        addonQuery.$or = [
          { name: regex },
          { category: regex },
          { description: regex },
        ];
      }
      const rawAddons = await Addon.find(addonQuery)
        .sort({ deletedAt: -1, updatedAt: -1 })
        .limit(limit * 2)
        .lean();

      for (const a of (rawAddons as any[])) {
        items.push({
          id: a._id.toString(),
          type: "addon",
          title: a.name || "Adicional sin nombre",
          subtitle: a.category ? `Categoría: ${a.category}` : undefined,
          details: a.description ? a.description.slice(0, 80) : undefined,
          image: a.image || undefined,
          badge: a.category || "Adicional",
          price: typeof a.price === "number" ? a.price : undefined,
          deletedAt: a.deletedAt ? new Date(a.deletedAt).toISOString() : new Date().toISOString(),
          createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : undefined,
        });
      }
    }

    // 3. CORREOS Y MENSAJES
    if (filterType === "all" || filterType === "emails") {
      const emailQuery: any = { isDeleted: true };
      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        emailQuery.$or = [
          { subject: regex },
          { customerName: regex },
          { customerEmail: regex },
          { from: regex },
          { to: regex },
          { orderId: regex },
        ];
      }
      const rawEmails = await EmailMessage.find(emailQuery)
        .sort({ deletedAt: -1, updatedAt: -1 })
        .limit(limit * 2)
        .lean();

      for (const m of (rawEmails as any[])) {
        const sender = m.customerName || m.from || "Remitente Desconocido";
        items.push({
          id: m._id.toString(),
          type: "email",
          title: m.subject || "(Sin Asunto)",
          subtitle: `De: ${sender} • Hacia: ${Array.isArray(m.to) ? m.to.join(", ") : m.to}`,
          details: m.orderId ? `Orden #${m.orderId}` : (m.direction === "inbound" ? "Recibido" : "Enviado"),
          badge: m.type || (m.direction === "inbound" ? "Bandeja Entrada" : "Enviado"),
          deletedAt: m.deletedAt ? new Date(m.deletedAt).toISOString() : new Date().toISOString(),
          createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
        });
      }
    }

    // Ordenar de más recientemente eliminado a más antiguo
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(paginatedItems)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error: any) {
    console.error("Error al obtener elementos de papelera:", error);
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
      error: error?.message || "Error al cargar papelera.",
    };
  }
}

export async function restoreTrashItemAction(item: {
  id: string;
  type: TrashItemType;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    if (item.type === "product") {
      await Product.findByIdAndUpdate(item.id, {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
      });
      revalidatePath("/admin/productos");
      revalidatePath("/catalogo");
    } else if (item.type === "addon") {
      await Addon.findByIdAndUpdate(item.id, {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
      });
      revalidatePath("/admin/adicionales");
      revalidatePath("/admin/productos");
    } else if (item.type === "email") {
      await EmailMessage.findByIdAndUpdate(item.id, {
        isDeleted: false,
        deletedAt: null,
      });
      revalidatePath("/admin/correos");
    }

    revalidatePath("/admin/papelera");
    return { success: true };
  } catch (error: any) {
    console.error("Error al restaurar elemento:", error);
    return { success: false, error: error?.message || "Error al restaurar elemento." };
  }
}

export async function bulkRestoreTrashAction(
  items: Array<{ id: string; type: TrashItemType }>
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!items || items.length === 0) return { success: true, count: 0 };
    await dbConnect();

    const productIds = items.filter((i) => i.type === "product").map((i) => i.id);
    const addonIds = items.filter((i) => i.type === "addon").map((i) => i.id);
    const emailIds = items.filter((i) => i.type === "email").map((i) => i.id);

    if (productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { isDeleted: false, deletedAt: null, isActive: true } }
      );
      revalidatePath("/admin/productos");
      revalidatePath("/catalogo");
    }

    if (addonIds.length > 0) {
      await Addon.updateMany(
        { _id: { $in: addonIds } },
        { $set: { isDeleted: false, deletedAt: null, isActive: true } }
      );
      revalidatePath("/admin/adicionales");
      revalidatePath("/admin/productos");
    }

    if (emailIds.length > 0) {
      await EmailMessage.updateMany(
        { _id: { $in: emailIds } },
        { $set: { isDeleted: false, deletedAt: null } }
      );
      revalidatePath("/admin/correos");
    }

    revalidatePath("/admin/papelera");
    return { success: true, count: items.length };
  } catch (error: any) {
    console.error("Error en restauración masiva:", error);
    return { success: false, count: 0, error: error?.message || "Error al restaurar lote." };
  }
}

export async function permanentDeleteTrashItemAction(item: {
  id: string;
  type: TrashItemType;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    if (item.type === "product") {
      await Product.findByIdAndDelete(item.id);
      revalidatePath("/admin/productos");
    } else if (item.type === "addon") {
      await Addon.findByIdAndDelete(item.id);
      revalidatePath("/admin/adicionales");
    } else if (item.type === "email") {
      await EmailMessage.findByIdAndDelete(item.id);
      revalidatePath("/admin/correos");
    }

    revalidatePath("/admin/papelera");
    return { success: true };
  } catch (error: any) {
    console.error("Error al purgar elemento permanentemente:", error);
    return { success: false, error: error?.message || "Error al eliminar permanentemente." };
  }
}

export async function bulkPermanentDeleteTrashAction(
  items: Array<{ id: string; type: TrashItemType }>
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!items || items.length === 0) return { success: true, count: 0 };
    await dbConnect();

    const productIds = items.filter((i) => i.type === "product").map((i) => i.id);
    const addonIds = items.filter((i) => i.type === "addon").map((i) => i.id);
    const emailIds = items.filter((i) => i.type === "email").map((i) => i.id);

    if (productIds.length > 0) {
      await Product.deleteMany({ _id: { $in: productIds } });
      revalidatePath("/admin/productos");
    }

    if (addonIds.length > 0) {
      await Addon.deleteMany({ _id: { $in: addonIds } });
      revalidatePath("/admin/adicionales");
    }

    if (emailIds.length > 0) {
      await EmailMessage.deleteMany({ _id: { $in: emailIds } });
      revalidatePath("/admin/correos");
    }

    revalidatePath("/admin/papelera");
    return { success: true, count: items.length };
  } catch (error: any) {
    console.error("Error en purga masiva:", error);
    return { success: false, count: 0, error: error?.message || "Error al purgar lote." };
  }
}

export async function emptyTrashAction(
  typeFilter: "all" | "products" | "addons" | "emails" = "all"
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await dbConnect();
    let count = 0;

    if (typeFilter === "all" || typeFilter === "products") {
      const res = await Product.deleteMany({ isDeleted: true });
      count += res.deletedCount || 0;
      revalidatePath("/admin/productos");
    }

    if (typeFilter === "all" || typeFilter === "addons") {
      const res = await Addon.deleteMany({ isDeleted: true });
      count += res.deletedCount || 0;
      revalidatePath("/admin/adicionales");
    }

    if (typeFilter === "all" || typeFilter === "emails") {
      const res = await EmailMessage.deleteMany({ isDeleted: true });
      count += res.deletedCount || 0;
      revalidatePath("/admin/correos");
    }

    revalidatePath("/admin/papelera");
    return { success: true, count };
  } catch (error: any) {
    console.error("Error al vaciar papelera:", error);
    return { success: false, count: 0, error: error?.message || "Error al vaciar la papelera." };
  }
}
