import mongoose, { Schema, Document } from "mongoose";

export interface IPasskey {
  credentialID: string;
  publicKey: string;
  counter: number;
  deviceType?: string;
  backedUp?: boolean;
  transports?: string[];
  createdAt?: Date;
}

export interface ICustomer extends Document {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  creditBalance?: number;
  creditStatus?: 'active' | 'blocked';
  passkeys: IPasskey[];
  currentChallenge?: string;
  createdAt: Date;
}

const CustomerSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  creditLimit: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 },
  creditStatus: { type: String, enum: ['active', 'blocked'], default: 'active' },
  passkeys: [
    {
      credentialID: { type: String, required: true },
      publicKey: { type: String, required: true },
      counter: { type: Number, default: 0 },
      deviceType: { type: String, default: "singleDevice" },
      backedUp: { type: Boolean, default: false },
      transports: [{ type: String }],
      createdAt: { type: Date, default: Date.now }
    }
  ],
  currentChallenge: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const Customer =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
