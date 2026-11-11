import mongoose, { Schema, Document } from 'mongoose';

export type MovementType = 'purchase_in' | 'sale_out' | 'manual_adjustment' | 'return';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  costPrice?: number;
  salePrice?: number;
  referenceType?: 'purchase_invoice' | 'order' | 'manual';
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

const StockMovementSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ['purchase_in', 'sale_out', 'manual_adjustment', 'return'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    referenceType: {
      type: String,
      enum: ['purchase_invoice', 'order', 'manual'],
      default: 'manual',
    },
    referenceId: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ createdAt: -1 });

export const StockMovement =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
