import mongoose, { Schema, Document } from 'mongoose';

export type FinancingStatus = 'activo' | 'pagado' | 'en_mora' | 'cancelado';
export type FinancingFrequency = 'semanal' | 'quincenal' | 'mensual';
export type InstallmentStatus = 'pendiente' | 'parcial' | 'pagada' | 'vencida';

export interface IFinancingInstallment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
  paidDate?: Date;
  notes?: string;
}

export interface ICustomerFinancing extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  orderId?: string;
  principalAmount: number;
  interestRate: number; // Porcentaje ej: 0 o 5
  totalAmount: number;  // principal + interés
  installmentsCount: number;
  frequency: FinancingFrequency;
  installmentAmount: number;
  remainingBalance: number;
  paidAmount: number;
  startDate: Date;
  status: FinancingStatus;
  notes?: string;
  installments: IFinancingInstallment[];
  createdAt: Date;
  updatedAt: Date;
}

const FinancingInstallmentSchema = new Schema(
  {
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pendiente', 'parcial', 'pagada', 'vencida'],
      default: 'pendiente',
    },
    paidDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const CustomerFinancingSchema: Schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '' },
    orderId: { type: String, default: '', index: true },
    principalAmount: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    installmentsCount: { type: Number, required: true, min: 1 },
    frequency: {
      type: String,
      enum: ['semanal', 'quincenal', 'mensual'],
      default: 'quincenal',
    },
    installmentAmount: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['activo', 'pagado', 'en_mora', 'cancelado'],
      default: 'activo',
      index: true,
    },
    notes: { type: String, default: '', trim: true },
    installments: [FinancingInstallmentSchema],
  },
  { timestamps: true }
);

CustomerFinancingSchema.index({ customerId: 1, status: 1 });

export const CustomerFinancing =
  mongoose.models.CustomerFinancing ||
  mongoose.model<ICustomerFinancing>('CustomerFinancing', CustomerFinancingSchema);
