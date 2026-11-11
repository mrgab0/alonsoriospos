'use server';

import dbConnect from '@/lib/db';
import { PurchaseInvoice, IPurchaseItem, PurchaseStatus } from '@/lib/models/PurchaseInvoice';
import { Product } from '@/lib/models/Product';
import { Supplier } from '@/lib/models/Supplier';
import { StockMovement } from '@/lib/models/StockMovement';
import { revalidatePath } from 'next/cache';

export async function getPurchases() {
  try {
    await dbConnect();
    const purchases = await PurchaseInvoice.find()
      .sort({ issueDate: -1, createdAt: -1 })
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(purchases)) };
  } catch (error: any) {
    console.error('Error al obtener compras:', error);
    return { success: false, error: error.message || 'Error al obtener compras' };
  }
}

export async function getPurchaseById(id: string) {
  try {
    await dbConnect();
    const purchase = await PurchaseInvoice.findById(id).lean();
    if (!purchase) {
      return { success: false, error: 'Factura de compra no encontrada' };
    }
    return { success: true, data: JSON.parse(JSON.stringify(purchase)) };
  } catch (error: any) {
    console.error('Error al obtener compra:', error);
    return { success: false, error: error.message || 'Error al obtener compra' };
  }
}

export interface CreatePurchasePayload {
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  issueDate?: string;
  dueDate?: string;
  status: PurchaseStatus;
  items: Array<{
    productId: string;
    productName: string;
    barcode?: string;
    sku?: string;
    quantity: number;
    costPrice: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  amountPaid: number;
  paymentMethod?: string;
  notes?: string;
  receivedBy?: string;
}

export async function createPurchaseInvoice(payload: CreatePurchasePayload) {
  try {
    await dbConnect();

    if (!payload.invoiceNumber?.trim()) {
      return { success: false, error: 'El número de factura del proveedor es obligatorio' };
    }
    if (!payload.supplierId) {
      return { success: false, error: 'Debes seleccionar un proveedor' };
    }
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos un producto a la recepción' };
    }

    const calculatedItems: IPurchaseItem[] = [];
    let runningSubtotal = 0;

    for (const item of payload.items) {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.costPrice) || 0;
      if (qty <= 0) {
        return { success: false, error: `Cantidad inválida para ${item.productName}` };
      }
      const itemSubtotal = Math.round(qty * cost * 100) / 100;
      runningSubtotal += itemSubtotal;

      calculatedItems.push({
        productId: item.productId as any,
        productName: item.productName,
        barcode: item.barcode || '',
        sku: item.sku || '',
        quantity: qty,
        costPrice: cost,
        subtotal: itemSubtotal,
      });
    }

    const subtotal = payload.subtotal || runningSubtotal;
    const tax = Number(payload.tax) || 0;
    const total = payload.total || Math.round((subtotal + tax) * 100) / 100;
    const amountPaid = Number(payload.amountPaid) || 0;
    const balanceDue = Math.max(0, Math.round((total - amountPaid) * 100) / 100);

    let status: PurchaseStatus = payload.status;
    if (balanceDue <= 0) {
      status = 'paid';
    } else if (amountPaid > 0 && balanceDue > 0) {
      status = 'partially_paid';
    } else {
      status = 'pending';
    }

    // 1. Crear la Factura de Compra
    const purchase = await PurchaseInvoice.create({
      invoiceNumber: payload.invoiceNumber.trim(),
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      status,
      items: calculatedItems,
      subtotal,
      tax,
      total,
      amountPaid,
      balanceDue,
      paymentMethod: payload.paymentMethod || 'efectivo',
      notes: payload.notes?.trim() || '',
      receivedBy: payload.receivedBy || 'admin',
    });

    // 2. Aumentar Stock y actualizar costo de cada producto + Registro en Kardex
    for (const item of calculatedItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const previousStock = product.stock || 0;
        const newStock = previousStock + item.quantity;

        product.stock = newStock;
        if (item.costPrice > 0) {
          product.costPrice = item.costPrice;
        }
        await product.save();

        await StockMovement.create({
          productId: product._id,
          productName: product.name,
          type: 'purchase_in',
          quantity: item.quantity,
          previousStock,
          newStock,
          costPrice: item.costPrice,
          salePrice: product.price || 0,
          referenceType: 'purchase_invoice',
          referenceId: purchase._id.toString(),
          notes: `Recepción de mercancía - Factura Prov. #${payload.invoiceNumber}`,
          createdBy: payload.receivedBy || 'admin',
        });
      }
    }

    // 3. Si quedó saldo pendiente por pagar, aumentar deuda del proveedor
    if (balanceDue > 0) {
      await Supplier.findByIdAndUpdate(payload.supplierId, {
        $inc: { balancePending: balanceDue },
      });
    }

    revalidatePath('/admin/compras');
    revalidatePath('/admin/proveedores');
    revalidatePath('/admin/productos');
    revalidatePath('/admin');

    return { success: true, data: JSON.parse(JSON.stringify(purchase)) };
  } catch (error: any) {
    console.error('Error al registrar recepción de mercancía:', error);
    return { success: false, error: error.message || 'Error al registrar compra' };
  }
}
