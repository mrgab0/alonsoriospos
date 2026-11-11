'use server';

import dbConnect from '@/lib/db';
import { PurchaseInvoice } from '@/lib/models/PurchaseInvoice';
import { Supplier } from '@/lib/models/Supplier';
import { SupplierPayment } from '@/lib/models/SupplierPayment';
import { revalidatePath } from 'next/cache';

export async function getPayablesSummary() {
  try {
    await dbConnect();

    // Facturas con saldo pendiente
    const pendingInvoices = await PurchaseInvoice.find({
      balanceDue: { $gt: 0 },
      status: { $ne: 'cancelled' },
    })
      .sort({ dueDate: 1, issueDate: 1 })
      .lean();

    // Historial de pagos recientes a proveedores
    const recentPayments = await SupplierPayment.find()
      .sort({ paidAt: -1 })
      .limit(50)
      .lean();

    const now = new Date();
    let totalDue = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    const invoicesWithStatus = pendingInvoices.map((inv: any) => {
      totalDue += inv.balanceDue || 0;
      let urgency: 'ok' | 'soon' | 'overdue' = 'ok';
      let daysDiff = 0;

      if (inv.dueDate) {
        const due = new Date(inv.dueDate);
        daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 0) {
          urgency = 'overdue';
          overdueCount++;
        } else if (daysDiff <= 5) {
          urgency = 'soon';
          upcomingCount++;
        }
      }

      return {
        ...inv,
        daysDiff,
        urgency,
      };
    });

    return {
      success: true,
      data: {
        invoices: JSON.parse(JSON.stringify(invoicesWithStatus)),
        payments: JSON.parse(JSON.stringify(recentPayments)),
        totalDue: Math.round(totalDue * 100) / 100,
        pendingInvoicesCount: pendingInvoices.length,
        overdueCount,
        upcomingCount,
      },
    };
  } catch (error: any) {
    console.error('Error al obtener cuentas por pagar:', error);
    return { success: false, error: error.message || 'Error al obtener cuentas por pagar' };
  }
}

export interface RegisterPaymentPayload {
  purchaseInvoiceId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  paidAt?: string;
  createdBy?: string;
}

export async function registerSupplierPayment(payload: RegisterPaymentPayload) {
  try {
    await dbConnect();

    const payAmount = Number(payload.amount);
    if (!payload.purchaseInvoiceId) {
      return { success: false, error: 'Factura de compra no especificada' };
    }
    if (!payAmount || payAmount <= 0) {
      return { success: false, error: 'El monto a pagar debe ser mayor a 0' };
    }

    const invoice = await PurchaseInvoice.findById(payload.purchaseInvoiceId);
    if (!invoice) {
      return { success: false, error: 'Factura de compra no encontrada' };
    }

    if (payAmount > (invoice.balanceDue + 0.01)) {
      return {
        success: false,
        error: `El abono ($${payAmount.toFixed(2)}) supera el saldo pendiente ($${invoice.balanceDue.toFixed(2)})`,
      };
    }

    const newAmountPaid = Math.round((invoice.amountPaid + payAmount) * 100) / 100;
    const newBalanceDue = Math.max(0, Math.round((invoice.balanceDue - payAmount) * 100) / 100);
    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partially_paid';

    // 1. Crear el registro del pago/abono
    const payment = await SupplierPayment.create({
      purchaseInvoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplierName,
      amount: payAmount,
      paymentMethod: payload.paymentMethod || 'transferencia',
      referenceNumber: payload.referenceNumber?.trim() || '',
      notes: payload.notes?.trim() || '',
      paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
      createdBy: payload.createdBy || 'admin',
    });

    // 2. Actualizar la Factura de Compra
    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = newBalanceDue;
    invoice.status = newStatus;
    await invoice.save();

    // 3. Descontar la deuda en la ficha del Proveedor
    await Supplier.findByIdAndUpdate(invoice.supplierId, {
      $inc: { balancePending: -payAmount },
    });

    revalidatePath('/admin/cuentas-por-pagar');
    revalidatePath('/admin/proveedores');
    revalidatePath('/admin/compras');

    return {
      success: true,
      data: {
        payment: JSON.parse(JSON.stringify(payment)),
        newBalanceDue,
        newStatus,
      },
    };
  } catch (error: any) {
    console.error('Error al registrar pago a proveedor:', error);
    return { success: false, error: error.message || 'Error al registrar abono al proveedor' };
  }
}
