import mongoose, { Schema, Document } from 'mongoose';

export type CreditEventType = 'charge' | 'payment';

export interface ICustomerCredit extends Document {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  type: CreditEventType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  orderId?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

const CustomerCreditSchema: Schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    type: {
      type: String,
      enum: ['charge', 'payment'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    previousBalance: { type: Number, required: true, default: 0 },
    newBalance: { type: Number, required: true, default: 0 },
    orderId: { type: String, default: '' },
    paymentMethod: { type: String, default: 'efectivo' },
    referenceNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: 'cajero' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CustomerCreditSchema.index({ createdAt: -1 });

export const CustomerCredit =
  mongoose.models.CustomerCredit ||
  mongoose.model<ICustomerCredit>('CustomerCredit', CustomerCreditSchema);
