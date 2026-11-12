'use server';

import dbConnect from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { EmployeeLoan, LoanFrequency } from '@/lib/models/EmployeeLoan';
import { revalidatePath } from 'next/cache';

export interface CreateEmployeeLoanPayload {
  employeeId: string;
  amount: number;
  installmentsCount: number;
  installmentFrequency: LoanFrequency;
  notes?: string;
}

export async function createEmployeeLoan(payload: CreateEmployeeLoanPayload) {
  try {
    await dbConnect();

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) {
      return { success: false, error: 'Empleado no encontrado' };
    }

    const amount = Number(payload.amount);
    const installments = Math.max(1, Number(payload.installmentsCount) || 1);

    if (!amount || amount <= 0) {
      return { success: false, error: 'El monto del préstamo debe ser mayor a 0' };
    }

    const installmentAmount = Number((amount / installments).toFixed(2));

    const loan = await EmployeeLoan.create({
      employeeId: employee._id,
      employeeName: employee.name,
      amount,
      installmentsCount: installments,
      installmentAmount,
      installmentFrequency: payload.installmentFrequency || 'quincenal',
      remainingBalance: amount,
      paidAmount: 0,
      disbursedDate: new Date(),
      status: 'activo',
      notes: payload.notes?.trim() || 'Préstamo / Adelanto a empleado',
      payments: [],
    });

    revalidatePath('/admin/nomina');
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (error: any) {
    console.error('Error al otorgar crédito a empleado:', error);
    return { success: false, error: error.message || 'Error al otorgar crédito' };
  }
}

export async function getEmployeeLoans(employeeId?: string) {
  try {
    await dbConnect();
    const query = employeeId ? { employeeId } : {};
    const loans = await EmployeeLoan.find(query).sort({ createdAt: -1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(loans)) };
  } catch (error: any) {
    console.error('Error al obtener préstamos de empleados:', error);
    return { success: false, error: error.message || 'Error al obtener préstamos' };
  }
}

export async function recordLoanPayment(
  loanId: string,
  amount: number,
  payrollReceiptId?: string,
  notes?: string
) {
  try {
    await dbConnect();

    const loan = await EmployeeLoan.findById(loanId);
    if (!loan || loan.status !== 'activo') {
      return { success: false, error: 'Préstamo no encontrado o ya liquidado' };
    }

    const payAmount = Math.min(loan.remainingBalance, Number(amount));
    loan.paidAmount = Number((loan.paidAmount + payAmount).toFixed(2));
    loan.remainingBalance = Number((loan.remainingBalance - payAmount).toFixed(2));

    loan.payments.push({
      paymentDate: new Date(),
      amount: payAmount,
      payrollReceiptId: payrollReceiptId || '',
      notes: notes || 'Descuento de cuota de nómina',
    });

    if (loan.remainingBalance <= 0) {
      loan.status = 'pagado';
    }

    await loan.save();

    revalidatePath('/admin/nomina');
    return { success: true, data: JSON.parse(JSON.stringify(loan)) };
  } catch (error: any) {
    console.error('Error al registrar abono al préstamo:', error);
    return { success: false, error: error.message || 'Error al registrar abono' };
  }
}
