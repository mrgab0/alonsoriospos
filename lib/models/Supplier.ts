import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditTermsDays: number;
  balancePending: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    taxId: { type: String, default: '', trim: true },
    contactName: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    creditTermsDays: { type: Number, default: 0 },
    balancePending: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ name: 'text', taxId: 'text', contactName: 'text' });

export const Supplier =
  mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
