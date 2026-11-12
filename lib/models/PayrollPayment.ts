import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethodType = 'efectivo' | 'transferencia' | 'cheque';

export interface IPayrollPayment extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  periodStart: Date;
  periodEnd: Date;
  paymentDate: Date;
  salaryType: string;
  baseSalary: number;
  workedUnits: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  netAmount: number;
  paymentMethod: PaymentMethodType;
  receiptNumber: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollPaymentSchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    employeeName: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    paymentDate: { type: Date, default: Date.now },
    salaryType: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    workedUnits: { type: Number, default: 0 },
    overtimeAmount: { type: Number, default: 0 },
    bonusAmount: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'transferencia', 'cheque'],
      default: 'efectivo',
    },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

PayrollPaymentSchema.index({ employeeId: 1, paymentDate: -1 });

export const PayrollPayment =
  mongoose.models.PayrollPayment ||
  mongoose.model<IPayrollPayment>('PayrollPayment', PayrollPaymentSchema);
