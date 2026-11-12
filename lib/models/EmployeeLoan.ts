import mongoose, { Schema, Document } from 'mongoose';

export type LoanStatus = 'activo' | 'pagado' | 'cancelado';
export type LoanFrequency = 'semanal' | 'quincenal' | 'mensual';

export interface ILoanPayment {
  paymentDate: Date;
  amount: number;
  payrollReceiptId?: string;
  notes?: string;
}

export interface IEmployeeLoan extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  amount: number;
  installmentsCount: number;
  installmentAmount: number;
  installmentFrequency: LoanFrequency;
  remainingBalance: number;
  paidAmount: number;
  disbursedDate: Date;
  status: LoanStatus;
  notes?: string;
  payments: ILoanPayment[];
  createdAt: Date;
  updatedAt: Date;
}

const LoanPaymentSchema = new Schema(
  {
    paymentDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    payrollReceiptId: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const EmployeeLoanSchema: Schema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    employeeName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    installmentsCount: { type: Number, required: true, min: 1, default: 2 },
    installmentAmount: { type: Number, required: true },
    installmentFrequency: {
      type: String,
      enum: ['semanal', 'quincenal', 'mensual'],
      default: 'quincenal',
    },
    remainingBalance: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    disbursedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['activo', 'pagado', 'cancelado'],
      default: 'activo',
      index: true,
    },
    notes: { type: String, default: '', trim: true },
    payments: [LoanPaymentSchema],
  },
  { timestamps: true }
);

export const EmployeeLoan =
  mongoose.models.EmployeeLoan ||
  mongoose.model<IEmployeeLoan>('EmployeeLoan', EmployeeLoanSchema);
