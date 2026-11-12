import mongoose, { Schema, Document } from 'mongoose';

export type EmployeeRole =
  | 'cajero'
  | 'almacen'
  | 'vendedor'
  | 'administrador'
  | 'repartidor'
  | 'limpieza'
  | 'otro';

export type SalaryType = 'hora' | 'diario' | 'semanal' | 'quincenal' | 'mensual';

export interface IEmployee extends Document {
  name: string;
  pinCode: string; // 4 a 6 dígitos para reloj biométrico
  role: EmployeeRole;
  phone?: string;
  email?: string;
  salaryType: SalaryType;
  baseSalary: number;
  workSchedule: {
    startTime: string; // ej: "08:00"
    endTime: string;   // ej: "17:00"
    toleranceMinutes: number; // ej: 15
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, unique: true, trim: true, index: true },
    role: {
      type: String,
      enum: ['cajero', 'almacen', 'vendedor', 'administrador', 'repartidor', 'limpieza', 'otro'],
      default: 'cajero',
      index: true,
    },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    salaryType: {
      type: String,
      enum: ['hora', 'diario', 'semanal', 'quincenal', 'mensual'],
      default: 'quincenal',
    },
    baseSalary: { type: Number, default: 0 },
    workSchedule: {
      startTime: { type: String, default: '08:00' },
      endTime: { type: String, default: '17:00' },
      toleranceMinutes: { type: Number, default: 15 },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Employee =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
