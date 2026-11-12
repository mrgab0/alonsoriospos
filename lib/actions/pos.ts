'use server';

import dbConnect from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { StockMovement } from '@/lib/models/StockMovement';
import { Customer } from '@/lib/models/Customer';
import { CustomerCredit } from '@/lib/models/CustomerCredit';
import { CustomerFinancing, FinancingFrequency, IFinancingInstallment } from '@/lib/models/CustomerFinancing';
import { revalidatePath } from 'next/cache';

export async function searchPOSProducts(query: string) {
  try {
    await dbConnect();
    const term = (query || '').trim();
    if (!term) {
      const topProducts = await Product.find({ isActive: { $ne: false }, isDeleted: { $ne: true } })
        .sort({ stock: -1, createdAt: -1 })
        .limit(30)
        .lean();
      return { success: true, data: JSON.parse(JSON.stringify(topProducts)) };
    }

    const regex = new RegExp(term, 'i');
    const products = await Product.find({
      isActive: { $ne: false },
      isDeleted: { $ne: true },
      $or: [{ name: regex }, { barcode: regex }, { sku: regex }, { category: regex }],
    })
      .limit(30)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(products)) };
  } catch (error: any) {
    console.error('Error al buscar productos en POS:', error);
    return { success: false, error: error.message || 'Error en búsqueda' };
  }
}

export interface POSSaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  sku?: string;
}

export interface POSSalePayload {
  items: POSSaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito_fiado';
  cashReceived?: number;
  changeDue?: number;
  paymentRef?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  cashierName?: string;
  financingPlan?: {
    installmentsCount: number;
    frequency: FinancingFrequency;
    interestRate?: number;
  };
}

export async function processPOSSale(payload: POSSalePayload) {
  try {
    await dbConnect();

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'El carrito de venta está vacío' };
    }
    if (payload.total < 0) {
      return { success: false, error: 'El total de la venta no puede ser negativo' };
    }

    const orderId = `POS-${Date.now().toString().slice(-6)}`;
    const isCredit = payload.paymentMethod === 'credito_fiado';
    const customerName = payload.customerName?.trim() || 'Cliente Mostrador';
    const customerPhone = payload.customerPhone?.trim() || 'N/A';
    const customerEmail = payload.customerEmail?.trim() || '';

    // 1. Guardar o actualizar datos de cliente deudor si es venta a crédito (Fiado)
    let customerDoc = null;
    if (isCredit) {
      if (!payload.customerName?.trim() || !payload.customerPhone?.trim()) {
        return {
          success: false,
          error: 'Para vender a crédito / fiado es obligatorio indicar Nombre y Teléfono del cliente',
        };
      }

      // Buscar cliente por teléfono o email
      customerDoc = await Customer.findOne({
        $or: [
          { phone: customerPhone },
          ...(customerEmail ? [{ email: customerEmail.toLowerCase() }] : []),
        ],
      });

      if (!customerDoc) {
        customerDoc = await Customer.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail || `cliente-${Date.now()}@vkapos.local`,
          creditLimit: 500, // Límite por defecto
          creditBalance: payload.total,
          creditStatus: 'active',
        });
      } else {
        if (customerDoc.creditStatus === 'blocked') {
          return {
            success: false,
            error: `El cliente ${customerName} se encuentra bloqueado para créditos`,
          };
        }
        customerDoc.creditBalance = (customerDoc.creditBalance || 0) + payload.total;
        await customerDoc.save();
      }
    }

    // 2. Crear Registro de Orden / Venta
    const orderItems = payload.items.map((it) => ({
      id: it.productId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      addons: it.barcode ? [{ barcode: it.barcode, sku: it.sku }] : [],
    }));

    const order = await Order.create({
      orderId,
      customerName,
      customerPhone,
      customerEmail,
      address: 'Venta Directa en Mostrador / POS',
      deliveryMethod: 'Mostrador / POS',
      deliveryFee: 0,
      discountAmount: payload.discount || 0,
      taxAmount: payload.tax || 0,
      items: orderItems,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      paymentRef: payload.paymentRef || (isCredit ? 'CREDITO_FIADO' : 'POS_CAJA'),
      status: isCredit ? 'Por Cobrar (Fiado)' : 'Completada',
      isPrintedToPOS: true,
      printedAtPOS: new Date(),
      createdAt: new Date(),
    });

    // 2.1 Si fue a crédito / fiado, registrar movimiento de cargo en el Ledger
    if (isCredit && customerDoc) {
      await CustomerCredit.create({
        customerId: customerDoc._id,
        customerName,
        customerPhone,
        type: 'charge',
        amount: payload.total,
        previousBalance: (customerDoc.creditBalance || 0) - payload.total,
        newBalance: customerDoc.creditBalance || 0,
        orderId,
        paymentMethod: 'credito_fiado',
        notes: payload.financingPlan
          ? `Venta Financiada POS #${orderId} (${payload.financingPlan.installmentsCount} cuotas ${payload.financingPlan.frequency})`
          : `Venta Fiada POS #${orderId}`,
        createdBy: payload.cashierName || 'cajero',
      });

      // Si se seleccionó plan de cuotas / financiamiento
      if (payload.financingPlan) {
        const count = Math.max(1, payload.financingPlan.installmentsCount || 1);
        const freq = payload.financingPlan.frequency || 'quincenal';
        const installmentAmount = Number((payload.total / count).toFixed(2));
        const intervalDays = freq === 'semanal' ? 7 : freq === 'quincenal' ? 15 : 30;
        const installments: IFinancingInstallment[] = [];
        const start = new Date();

        for (let i = 1; i <= count; i++) {
          const dueDate = new Date(start);
          dueDate.setDate(dueDate.getDate() + i * intervalDays);
          installments.push({
            installmentNumber: i,
            dueDate,
            amount: installmentAmount,
            paidAmount: 0,
            status: 'pendiente',
          });
        }

        await CustomerFinancing.create({
          customerId: customerDoc._id,
          customerName,
          customerPhone,
          orderId,
          principalAmount: payload.total,
          interestRate: payload.financingPlan.interestRate || 0,
          totalAmount: payload.total,
          installmentsCount: count,
          frequency: freq,
          installmentAmount,
          remainingBalance: payload.total,
          paidAmount: 0,
          startDate: start,
          status: 'activo',
          notes: `Financiamiento generado en caja POS para orden #${orderId}`,
          installments,
        });
      }
    }

    // 3. Descontar stock y registrar en Kardex para cada producto
    for (const item of payload.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const previousStock = product.stock || 0;
        const newStock = Math.max(0, previousStock - item.quantity);

        product.stock = newStock;
        await product.save();

        await StockMovement.create({
          productId: product._id,
          productName: product.name,
          type: 'sale_out',
          quantity: item.quantity,
          previousStock,
          newStock,
          costPrice: product.costPrice || 0,
          salePrice: item.price,
          referenceType: 'order',
          referenceId: orderId,
          notes: `Venta Mostrador POS #${orderId} (${payload.paymentMethod})`,
          createdBy: payload.cashierName || 'cajero',
        });
      }
    }

    revalidatePath('/admin/pos');
    revalidatePath('/admin/ordenes');
    revalidatePath('/admin/productos');
    revalidatePath('/admin/estadisticas');

    return {
      success: true,
      data: {
        order: JSON.parse(JSON.stringify(order)),
        orderId,
        items: payload.items,
        total: payload.total,
        discount: payload.discount,
        paymentMethod: payload.paymentMethod,
        cashReceived: payload.cashReceived,
        changeDue: payload.changeDue,
        customerName,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Error al procesar venta POS:', error);
    return { success: false, error: error.message || 'Error al procesar la venta en caja' };
  }
}
