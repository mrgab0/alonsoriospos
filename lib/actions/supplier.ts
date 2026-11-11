'use server';

import dbConnect from '@/lib/db';
import { Supplier } from '@/lib/models/Supplier';
import { revalidatePath } from 'next/cache';

export async function getSuppliers() {
  try {
    await dbConnect();
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(suppliers)) };
  } catch (error: any) {
    console.error('Error al obtener proveedores:', error);
    return { success: false, error: error.message || 'Error al obtener proveedores' };
  }
}

export async function createSupplier(formData: {
  name: string;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditTermsDays?: number;
  notes?: string;
}) {
  try {
    await dbConnect();

    if (!formData.name?.trim()) {
      return { success: false, error: 'El nombre o razón social es obligatorio' };
    }

    const supplier = await Supplier.create({
      name: formData.name.trim(),
      taxId: formData.taxId?.trim() || '',
      contactName: formData.contactName?.trim() || '',
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || '',
      creditTermsDays: Number(formData.creditTermsDays) || 0,
      balancePending: 0,
      notes: formData.notes?.trim() || '',
      isActive: true,
    });

    revalidatePath('/admin/proveedores');
    revalidatePath('/admin/compras');
    return { success: true, data: JSON.parse(JSON.stringify(supplier)) };
  } catch (error: any) {
    console.error('Error al crear proveedor:', error);
    return { success: false, error: error.message || 'Error al crear proveedor' };
  }
}

export async function updateSupplier(
  id: string,
  formData: {
    name?: string;
    taxId?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    creditTermsDays?: number;
    notes?: string;
  }
) {
  try {
    await dbConnect();
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: formData },
      { new: true, runValidators: true }
    ).lean();

    if (!supplier) {
      return { success: false, error: 'Proveedor no encontrado' };
    }

    revalidatePath('/admin/proveedores');
    revalidatePath('/admin/compras');
    return { success: true, data: JSON.parse(JSON.stringify(supplier)) };
  } catch (error: any) {
    console.error('Error al actualizar proveedor:', error);
    return { success: false, error: error.message || 'Error al actualizar proveedor' };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await dbConnect();
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!supplier) {
      return { success: false, error: 'Proveedor no encontrado' };
    }

    revalidatePath('/admin/proveedores');
    revalidatePath('/admin/compras');
    return { success: true };
  } catch (error: any) {
    console.error('Error al desactivar proveedor:', error);
    return { success: false, error: error.message || 'Error al desactivar proveedor' };
  }
}
