import mongoose, { Schema, Document } from 'mongoose';

export type VehicleType = 'bicicleta' | 'moto' | 'carro' | 'camioneta_camion';
export type DriverStatus = 'disponible' | 'en_ruta' | 'inactivo';

export interface IDriver extends Document {
  name: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleModel?: string;
  status: DriverStatus;
  capacityKg?: number;
  baseRate: number;
  ratePerMile: number;
  activeOrderId?: string;
  totalDeliveries: number;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    vehicleType: {
      type: String,
      enum: ['bicicleta', 'moto', 'carro', 'camioneta_camion'],
      required: true,
      default: 'moto',
      index: true,
    },
    vehiclePlate: { type: String, default: '', trim: true },
    vehicleModel: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['disponible', 'en_ruta', 'inactivo'],
      default: 'disponible',
      index: true,
    },
    capacityKg: { type: Number, default: 20 },
    baseRate: { type: Number, default: 5 },
    ratePerMile: { type: Number, default: 1.5 },
    activeOrderId: { type: String, default: '' },
    totalDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DriverSchema.index({ vehicleType: 1, status: 1 });

export const Driver =
  mongoose.models.Driver || mongoose.model<IDriver>('Driver', DriverSchema);
