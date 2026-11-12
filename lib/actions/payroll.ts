'use server';

import dbConnect from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { AttendanceRecord } from '@/lib/models/AttendanceRecord';
import { PayrollPayment, PaymentMethodType } from '@/lib/models/PayrollPayment';
import { revalidatePath } from 'next/cache';

export async function getPayrollDashboard(periodMonth?: string) {
  try {
    await dbConnect();

    // Mes en curso si no se provee (ej: "2026-11")
    const now = new Date();
    const currentMonth = periodMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [employees, records, payments] = await Promise.all([
      Employee.find({ isActive: true }).sort({ name: 1 }).lean(),
      AttendanceRecord.find({ date: { $regex: `^${currentMonth}` } }).lean(),
      PayrollPayment.find({
        paymentDate: {
          $gte: new Date(`${currentMonth}-01T00:00:00.000Z`),
          $lte: new Date(`${currentMonth}-31T23:59:59.999Z`),
        },
      }).lean(),
    ]);

    const dashboard = employees.map((emp) => {
      const empRecords = records.filter((r) => r.employeeId.toString() === emp._id.toString());
      const empPayments = payments.filter((p) => p.employeeId.toString() === emp._id.toString());

      const totalHours = empRecords.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
      const totalDaysPresent = empRecords.length;
      const totalTardanzas = empRecords.filter((r) => r.status === 'tardanza').length;

      let estimatedBasePay = 0;
      if (emp.salaryType === 'hora') {
        estimatedBasePay = totalHours * emp.baseSalary;
      } else if (emp.salaryType === 'diario') {
        estimatedBasePay = totalDaysPresent * emp.baseSalary;
      } else {
        // Quincenal o Mensual
        estimatedBasePay = emp.baseSalary;
      }

      const totalPaidThisMonth = empPayments.reduce((acc, p) => acc + (p.netAmount || 0), 0);
      const pendingPay = Math.max(0, estimatedBasePay - totalPaidThisMonth);

      return {
        employeeId: emp._id.toString(),
        name: emp.name,
        role: emp.role,
        salaryType: emp.salaryType,
        baseSalary: emp.baseSalary,
        totalHours: Number(totalHours.toFixed(1)),
        totalDaysPresent,
        totalTardanzas,
        estimatedBasePay: Number(estimatedBasePay.toFixed(2)),
        totalPaidThisMonth: Number(totalPaidThisMonth.toFixed(2)),
        pendingPay: Number(pendingPay.toFixed(2)),
        paymentsCount: empPayments.length,
      };
    });

    const totalEstimatedPayroll = dashboard.reduce((acc, d) => acc + d.estimatedBasePay, 0);
    const totalDisbursed = dashboard.reduce((acc, d) => acc + d.totalPaidThisMonth, 0);
    const totalPending = dashboard.reduce((acc, d) => acc + d.pendingPay, 0);

    return {
      success: true,
      data: {
        currentMonth,
        metrics: {
          totalEmployees: employees.length,
          totalEstimatedPayroll: Number(totalEstimatedPayroll.toFixed(2)),
          totalDisbursed: Number(totalDisbursed.toFixed(2)),
          totalPending: Number(totalPending.toFixed(2)),
        },
        employees: JSON.parse(JSON.stringify(dashboard)),
        recentPayments: JSON.parse(JSON.stringify(payments.slice(0, 20))),
      },
    };
  } catch (error: any) {
    console.error('Error al obtener dashboard de nómina:', error);
    return { success: false, error: error.message || 'Error al obtener nómina' };
  }
}

export interface RegisterPaymentPayload {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  workedUnits?: number;
  overtimeAmount?: number;
  bonusAmount?: number;
  deductionAmount?: number;
  netAmount: number;
  paymentMethod: PaymentMethodType;
  notes?: string;
}

export async function registerPayrollPayment(payload: RegisterPaymentPayload) {
  try {
    await dbConnect();

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) {
      return { success: false, error: 'Empleado no encontrado' };
    }

    if (!payload.netAmount || payload.netAmount <= 0) {
      return { success: false, error: 'El monto neto a pagar debe ser mayor a 0' };
    }

    const count = await PayrollPayment.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `NOM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}-${randomSuffix}`;

    const payment = await PayrollPayment.create({
      employeeId: employee._id,
      employeeName: employee.name,
      periodStart: new Date(payload.periodStart),
      periodEnd: new Date(payload.periodEnd),
      paymentDate: new Date(),
      salaryType: employee.salaryType,
      baseSalary: Number(payload.baseSalary),
      workedUnits: Number(payload.workedUnits || 0),
      overtimeAmount: Number(payload.overtimeAmount || 0),
      bonusAmount: Number(payload.bonusAmount || 0),
      deductionAmount: Number(payload.deductionAmount || 0),
      netAmount: Number(payload.netAmount),
      paymentMethod: payload.paymentMethod || 'efectivo',
      receiptNumber,
      notes: payload.notes?.trim() || '',
    });

    revalidatePath('/admin/nomina');
    return { success: true, data: JSON.parse(JSON.stringify(payment)) };
  } catch (error: any) {
    console.error('Error al registrar pago de nómina:', error);
    return { success: false, error: error.message || 'Error al registrar pago' };
  }
}

export async function getPayrollHistory(employeeId?: string) {
  try {
    await dbConnect();
    const query = employeeId ? { employeeId } : {};
    const payments = await PayrollPayment.find(query).sort({ paymentDate: -1 }).limit(100).lean();
    return { success: true, data: JSON.parse(JSON.stringify(payments)) };
  } catch (error: any) {
    console.error('Error al obtener historial de pagos:', error);
    return { success: false, error: error.message || 'Error al obtener historial' };
  }
}
