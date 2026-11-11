import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierPayment extends Document {
  purchaseInvoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  paidAt: Date;
  createdBy: string;
  createdAt: Date;
}

const SupplierPaymentSchema: Schema = new Schema(
  {
    purchaseInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseInvoice',
      required: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      required: true,
      default: 'transferencia',
    },
    referenceNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SupplierPaymentSchema.index({ paidAt: -1 });

export const SupplierPayment =
  mongoose.models.SupplierPayment ||
  mongoose.model<ISupplierPayment>('SupplierPayment', SupplierPaymentSchema);
