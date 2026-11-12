import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'presente' | 'tardanza' | 'sobretiempo' | 'incompleto';

export interface IAttendanceRecord extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: Date;
  checkOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  hoursWorked: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true, index: true }, // Formato YYYY-MM-DD
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    breakStart: { type: Date },
    breakEnd: { type: Date },
    hoursWorked: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['presente', 'tardanza', 'sobretiempo', 'incompleto'],
      default: 'presente',
      index: true,
    },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ employeeId: 1, date: 1 });

export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
