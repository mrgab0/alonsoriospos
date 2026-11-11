'use server';

import dbConnect from '@/lib/db';
import { Customer } from '@/lib/models/Customer';
import { CustomerCredit } from '@/lib/models/CustomerCredit';
import { revalidatePath } from 'next/cache';

export async function getDebtorsSummary() {
  try {
    await dbConnect();

    // Clientes con saldo adeudado
    const debtors = await Customer.find({ creditBalance: { $gt: 0 } })
      .sort({ creditBalance: -1 })
      .lean();

    // Historial reciente de transacciones crediticias (cargos y abonos)
    const recentCreditHistory = await CustomerCredit.find()
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    let totalReceivable = 0;
    let overLimitCount = 0;

    const formattedDebtors = debtors.map((c: any) => {
      const balance = c.creditBalance || 0;
      const limit = c.creditLimit || 500;
      totalReceivable += balance;

      const isOverLimit = balance > limit;
      if (isOverLimit) overLimitCount++;

      const usagePercent = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 100;

      return {
        ...c,
        balance,
        limit,
        isOverLimit,
        usagePercent,
      };
    });

    return {
      success: true,
      data: {
        debtors: JSON.parse(JSON.stringify(formattedDebtors)),
        history: JSON.parse(JSON.stringify(recentCreditHistory)),
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        debtorsCount: debtors.length,
        overLimitCount,
      },
    };
  } catch (error: any) {
    console.error('Error al obtener cartera de deudores:', error);
    return { success: false, error: error.message || 'Error al obtener cartera de clientes' };
  }
}

export interface CustomerPaymentPayload {
  customerId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  receivedBy?: string;
}

export async function registerCustomerCreditPayment(payload: CustomerPaymentPayload) {
  try {
    await dbConnect();

    const payAmount = Number(payload.amount);
    if (!payload.customerId) {
      return { success: false, error: 'Cliente deudor no especificado' };
    }
    if (!payAmount || payAmount <= 0) {
      return { success: false, error: 'El monto del abono debe ser mayor a 0' };
    }

    const customer = await Customer.findById(payload.customerId);
    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    const currentBalance = customer.creditBalance || 0;
    if (currentBalance <= 0) {
      return { success: false, error: 'El cliente no tiene saldo deudor pendiente' };
    }

    if (payAmount > (currentBalance + 0.01)) {
      return {
        success: false,
        error: `El abono ($${payAmount.toFixed(2)}) supera la deuda actual ($${currentBalance.toFixed(2)})`,
      };
    }

    const newBalance = Math.max(0, Math.round((currentBalance - payAmount) * 100) / 100);

    // Si la deuda bajó por debajo del límite, reactivar cliente si estaba bloqueado
    if (newBalance <= (customer.creditLimit || 500) && customer.creditStatus === 'blocked') {
      customer.creditStatus = 'active';
    }

    customer.creditBalance = newBalance;
    await customer.save();

    // Registrar en Ledger de Cuentas por Cobrar
    const creditRecord = await CustomerCredit.create({
      customerId: customer._id,
      customerName: customer.name || 'Cliente Deudor',
      customerPhone: customer.phone || '',
      type: 'payment',
      amount: payAmount,
      previousBalance: currentBalance,
      newBalance,
      paymentMethod: payload.paymentMethod || 'efectivo',
      referenceNumber: payload.referenceNumber?.trim() || '',
      notes: payload.notes?.trim() || '',
      createdBy: payload.receivedBy || 'cajero',
    });

    revalidatePath('/admin/cuentas-por-cobrar');
    revalidatePath('/admin/pos');

    return {
      success: true,
      data: {
        record: JSON.parse(JSON.stringify(creditRecord)),
        newBalance,
      },
    };
  } catch (error: any) {
    console.error('Error al registrar abono del cliente:', error);
    return { success: false, error: error.message || 'Error al registrar abono' };
  }
}

export async function updateCustomerCreditSettings(
  customerId: string,
  creditLimit: number,
  creditStatus: 'active' | 'blocked'
) {
  try {
    await dbConnect();

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $set: {
          creditLimit: Math.max(0, Number(creditLimit) || 0),
          creditStatus,
        },
      },
      { new: true }
    );

    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    revalidatePath('/admin/cuentas-por-cobrar');
    return { success: true, data: JSON.parse(JSON.stringify(customer)) };
  } catch (error: any) {
    console.error('Error al actualizar límites de crédito:', error);
    return { success: false, error: error.message || 'Error al actualizar límites' };
  }
}
