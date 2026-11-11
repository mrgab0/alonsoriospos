'use server';

import dbConnect from '@/lib/db';
import { Driver, VehicleType, DriverStatus } from '@/lib/models/Driver';
import { Order } from '@/lib/models/Order';
import { revalidatePath } from 'next/cache';

export async function getDrivers() {
  try {
    await dbConnect();
    const drivers = await Driver.find({ isActive: true }).sort({ status: 1, name: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(drivers)) };
  } catch (error: any) {
    console.error('Error al obtener conductores:', error);
    return { success: false, error: error.message || 'Error al obtener conductores' };
  }
}

export interface CreateDriverPayload {
  name: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleModel?: string;
  capacityKg?: number;
  baseRate?: number;
  ratePerMile?: number;
  status?: DriverStatus;
}

export async function createDriver(payload: CreateDriverPayload) {
  try {
    await dbConnect();

    if (!payload.name?.trim() || !payload.phone?.trim()) {
      return { success: false, error: 'Nombre y teléfono son obligatorios' };
    }

    const driver = await Driver.create({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || '',
      vehicleType: payload.vehicleType || 'moto',
      vehiclePlate: payload.vehiclePlate?.trim() || '',
      vehicleModel: payload.vehicleModel?.trim() || '',
      capacityKg: Number(payload.capacityKg) || (payload.vehicleType === 'camioneta_camion' ? 500 : 20),
      baseRate: Number(payload.baseRate) || 5,
      ratePerMile: Number(payload.ratePerMile) || 1.5,
      status: payload.status || 'disponible',
      isActive: true,
    });

    revalidatePath('/admin/conductores');
    revalidatePath('/admin/ordenes');
    return { success: true, data: JSON.parse(JSON.stringify(driver)) };
  } catch (error: any) {
    console.error('Error al crear conductor:', error);
    return { success: false, error: error.message || 'Error al crear conductor' };
  }
}

export async function updateDriver(id: string, payload: Partial<CreateDriverPayload>) {
  try {
    await dbConnect();
    const driver = await Driver.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!driver) {
      return { success: false, error: 'Conductor no encontrado' };
    }

    revalidatePath('/admin/conductores');
    revalidatePath('/admin/ordenes');
    return { success: true, data: JSON.parse(JSON.stringify(driver)) };
  } catch (error: any) {
    console.error('Error al actualizar conductor:', error);
    return { success: false, error: error.message || 'Error al actualizar conductor' };
  }
}

export async function deleteDriver(id: string) {
  try {
    await dbConnect();
    const driver = await Driver.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
    if (!driver) {
      return { success: false, error: 'Conductor no encontrado' };
    }

    revalidatePath('/admin/conductores');
    return { success: true };
  } catch (error: any) {
    console.error('Error al desactivar conductor:', error);
    return { success: false, error: error.message || 'Error al desactivar conductor' };
  }
}

export async function assignDriverToOrder(orderId: string, driverId: string) {
  try {
    await dbConnect();

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return { success: false, error: 'Conductor no encontrado' };
    }

    // Actualizar Conductor
    driver.status = 'en_ruta';
    driver.activeOrderId = orderId;
    await driver.save();

    // Actualizar Orden
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          status: 'En ruta de entrega',
          deliveryMethod: `Despacho Local (${driver.vehicleType}) - ${driver.name}`,
        },
      }
    );

    revalidatePath('/admin/conductores');
    revalidatePath('/admin/ordenes');
    return { success: true };
  } catch (error: any) {
    console.error('Error al asignar conductor:', error);
    return { success: false, error: error.message || 'Error al asignar conductor' };
  }
}

export async function completeDriverDelivery(orderId: string, driverId: string) {
  try {
    await dbConnect();

    await Driver.findByIdAndUpdate(driverId, {
      $set: { status: 'disponible', activeOrderId: '' },
      $inc: { totalDeliveries: 1 },
    });

    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: { status: 'Entregada' },
      }
    );

    revalidatePath('/admin/conductores');
    revalidatePath('/admin/ordenes');
    return { success: true };
  } catch (error: any) {
    console.error('Error al completar despacho:', error);
    return { success: false, error: error.message || 'Error al completar despacho' };
  }
}
