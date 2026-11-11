import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  barcode?: string;
  sku?: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export type PurchaseStatus = 'pending' | 'partially_paid' | 'paid' | 'cancelled';

export interface IPurchaseInvoice extends Document {
  invoiceNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  issueDate: Date;
  dueDate?: Date;
  status: PurchaseStatus;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod?: string;
  notes?: string;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    barcode: { type: String, default: '' },
    sku: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseInvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'partially_paid', 'paid', 'cancelled'],
      default: 'paid',
      index: true,
    },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, default: 'efectivo' },
    notes: { type: String, default: '' },
    receivedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

PurchaseInvoiceSchema.index({ issueDate: -1 });

export const PurchaseInvoice =
  mongoose.models.PurchaseInvoice ||
  mongoose.model<IPurchaseInvoice>('PurchaseInvoice', PurchaseInvoiceSchema);
