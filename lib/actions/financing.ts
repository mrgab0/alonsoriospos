'use server';

import dbConnect from '@/lib/db';
import { Customer } from '@/lib/models/Customer';
import { CustomerCredit } from '@/lib/models/CustomerCredit';
import {
  CustomerFinancing,
  FinancingFrequency,
  IFinancingInstallment,
} from '@/lib/models/CustomerFinancing';
import { revalidatePath } from 'next/cache';

export interface CreateFinancingPayload {
  customerId: string;
  orderId?: string;
  principalAmount: number;
  interestRate?: number; // e.g. 0, 5, 10
  installmentsCount: number; // e.g. 2, 3, 4, 6
  frequency: FinancingFrequency;
  startDate?: string;
  notes?: string;
}

export async function createCustomerFinancing(payload: CreateFinancingPayload) {
  try {
    await dbConnect();

    const customer = await Customer.findById(payload.customerId);
    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    const principal = Number(payload.principalAmount);
    if (!principal || principal <= 0) {
      return { success: false, error: 'El monto principal debe ser mayor a 0' };
    }

    const interestRate = Number(payload.interestRate || 0);
    const totalAmount = Number((principal * (1 + interestRate / 100)).toFixed(2));
    const installmentsCount = Math.max(1, Number(payload.installmentsCount) || 1);
    const installmentAmount = Number((totalAmount / installmentsCount).toFixed(2));

    // Validar límite de crédito del cliente
    const currentBalance = customer.creditBalance || 0;
    const creditLimit = customer.creditLimit || 0;

    if (creditLimit > 0 && currentBalance + totalAmount > creditLimit) {
      return {
        success: false,
        error: `El financiamiento de $${totalAmount} excede el límite de crédito disponible ($${(creditLimit - currentBalance).toFixed(2)}) del cliente.`,
      };
    }

    // Calcular cronograma de cuotas
    const start = payload.startDate ? new Date(payload.startDate) : new Date();
    const installments: IFinancingInstallment[] = [];

    const daysInterval =
      payload.frequency === 'semanal' ? 7 : payload.frequency === 'quincenal' ? 15 : 30;

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + i * daysInterval);

      installments.push({
        installmentNumber: i,
        dueDate,
        amount: installmentAmount,
        paidAmount: 0,
        status: 'pendiente',
      });
    }

    const financing = await CustomerFinancing.create({
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      orderId: payload.orderId || '',
      principalAmount: principal,
      interestRate,
      totalAmount,
      installmentsCount,
      frequency: payload.frequency || 'quincenal',
      installmentAmount,
      remainingBalance: totalAmount,
      paidAmount: 0,
      startDate: start,
      status: 'activo',
      notes: payload.notes?.trim() || `Plan de financiamiento a ${installmentsCount} cuotas`,
      installments,
    });

    // Actualizar saldo de crédito en ficha del cliente
    customer.creditBalance = Number((currentBalance + totalAmount).toFixed(2));
    customer.creditStatus = 'active';
    await customer.save();

    // Registrar cargo en el libro de crédito (CustomerCredit ledger)
    await CustomerCredit.create({
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      type: 'charge',
      amount: totalAmount,
      previousBalance: currentBalance,
      newBalance: customer.creditBalance,
      orderId: payload.orderId || '',
      notes: `Financiamiento #${financing._id} (${installmentsCount} cuotas ${payload.frequency})`,
      createdBy: 'administrador',
    });

    revalidatePath('/admin/cuentas-por-cobrar');
    revalidatePath('/admin/pos');
    return { success: true, data: JSON.parse(JSON.stringify(financing)) };
  } catch (error: any) {
    console.error('Error al crear plan de financiamiento:', error);
    return { success: false, error: error.message || 'Error al crear financiamiento' };
  }
}

export async function payFinancingInstallment(
  financingId: string,
  installmentNumber: number,
  amount: number,
  paymentMethod: string = 'efectivo',
  referenceNumber: string = '',
  notes: string = ''
) {
  try {
    await dbConnect();

    const financing = await CustomerFinancing.findById(financingId);
    if (!financing || financing.status === 'pagado') {
      return { success: false, error: 'Plan de financiamiento no encontrado o ya liquidado' };
    }

    const installment = financing.installments.find(
      (inst: any) => inst.installmentNumber === installmentNumber
    );

    if (!installment) {
      return { success: false, error: `Cuota #${installmentNumber} no encontrada` };
    }

    const payAmount = Math.min(
      Number(amount),
      Number((installment.amount - installment.paidAmount).toFixed(2))
    );

    if (payAmount <= 0) {
      return { success: false, error: 'La cuota ya está completamente pagada' };
    }

    installment.paidAmount = Number((installment.paidAmount + payAmount).toFixed(2));
    if (installment.paidAmount >= installment.amount) {
      installment.status = 'pagada';
      installment.paidDate = new Date();
    } else {
      installment.status = 'parcial';
    }

    financing.paidAmount = Number((financing.paidAmount + payAmount).toFixed(2));
    financing.remainingBalance = Number((financing.remainingBalance - payAmount).toFixed(2));

    if (financing.remainingBalance <= 0) {
      financing.status = 'pagado';
    }

    await financing.save();

    // Actualizar saldo de deuda en el cliente
    const customer = await Customer.findById(financing.customerId);
    if (customer) {
      const prevBal = customer.creditBalance || 0;
      customer.creditBalance = Math.max(0, Number((prevBal - payAmount).toFixed(2)));
      await customer.save();

      // Registrar en el libro de créditos (CustomerCredit)
      await CustomerCredit.create({
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        type: 'payment',
        amount: payAmount,
        previousBalance: prevBal,
        newBalance: customer.creditBalance,
        orderId: financing.orderId || '',
        paymentMethod,
        referenceNumber,
        notes: notes || `Abono Cuota #${installmentNumber} de financiamiento`,
        createdBy: 'cajero',
      });
    }

    revalidatePath('/admin/cuentas-por-cobrar');
    return { success: true, data: JSON.parse(JSON.stringify(financing)) };
  } catch (error: any) {
    console.error('Error al pagar cuota de financiamiento:', error);
    return { success: false, error: error.message || 'Error al procesar pago de cuota' };
  }
}

export async function getFinancingDashboard() {
  try {
    await dbConnect();

    const plans = await CustomerFinancing.find().sort({ createdAt: -1 }).lean();
    const now = new Date();

    let totalPrincipal = 0;
    let totalFinanced = 0;
    let totalAmortized = 0;
    let totalPending = 0;
    let overdueCount = 0;

    const formattedPlans = plans.map((p) => {
      totalPrincipal += p.principalAmount || 0;
      totalFinanced += p.totalAmount || 0;
      totalAmortized += p.paidAmount || 0;
      totalPending += p.remainingBalance || 0;

      // Calcular si tiene cuotas vencidas
      let hasOverdue = false;
      let nextDue: Date | null = null;

      p.installments.forEach((inst: any) => {
        if (inst.status !== 'pagada') {
          if (!nextDue || new Date(inst.dueDate) < nextDue) {
            nextDue = new Date(inst.dueDate);
          }
          if (new Date(inst.dueDate) < now) {
            hasOverdue = true;
          }
        }
      });

      if (hasOverdue && p.status !== 'pagado') {
        overdueCount++;
      }

      return {
        ...p,
        hasOverdue,
        nextDueDate: nextDue ? nextDue.toISOString() : null,
      };
    });

    return {
      success: true,
      data: {
        metrics: {
          totalPlans: plans.length,
          totalPrincipal: Number(totalPrincipal.toFixed(2)),
          totalFinanced: Number(totalFinanced.toFixed(2)),
          totalAmortized: Number(totalAmortized.toFixed(2)),
          totalPending: Number(totalPending.toFixed(2)),
          overdueCount,
        },
        plans: JSON.parse(JSON.stringify(formattedPlans)),
      },
    };
  } catch (error: any) {
    console.error('Error al obtener dashboard de financiamiento:', error);
    return { success: false, error: error.message || 'Error al obtener financiamiento' };
  }
}

export async function getFinancingPlanDetails(id: string) {
  try {
    await dbConnect();
    const plan = await CustomerFinancing.findById(id).lean();
    if (!plan) return { success: false, error: 'Plan no encontrado' };
    return { success: true, data: JSON.parse(JSON.stringify(plan)) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al consultar plan' };
  }
}
