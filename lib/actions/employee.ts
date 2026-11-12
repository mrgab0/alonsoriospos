'use server';

import dbConnect from '@/lib/db';
import { Employee, EmployeeRole, SalaryType } from '@/lib/models/Employee';
import { revalidatePath } from 'next/cache';

export async function getEmployees() {
  try {
    await dbConnect();
    const employees = await Employee.find().sort({ isActive: -1, name: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(employees)) };
  } catch (error: any) {
    console.error('Error al obtener empleados:', error);
    return { success: false, error: error.message || 'Error al obtener empleados' };
  }
}

export interface CreateEmployeePayload {
  name: string;
  pinCode: string;
  role: EmployeeRole;
  phone?: string;
  email?: string;
  salaryType: SalaryType;
  baseSalary: number;
  workSchedule?: {
    startTime: string;
    endTime: string;
    toleranceMinutes: number;
  };
}

export async function createEmployee(payload: CreateEmployeePayload) {
  try {
    await dbConnect();

    if (!payload.name?.trim() || !payload.pinCode?.trim()) {
      return { success: false, error: 'Nombre y código PIN son requeridos' };
    }

    const pin = payload.pinCode.trim();
    if (pin.length < 4) {
      return { success: false, error: 'El PIN debe tener al menos 4 dígitos' };
    }

    const existingPin = await Employee.findOne({ pinCode: pin });
    if (existingPin) {
      return { success: false, error: 'Ese código PIN ya está asignado a otro empleado' };
    }

    const employee = await Employee.create({
      name: payload.name.trim(),
      pinCode: pin,
      role: payload.role || 'cajero',
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      salaryType: payload.salaryType || 'quincenal',
      baseSalary: Number(payload.baseSalary) || 0,
      workSchedule: {
        startTime: payload.workSchedule?.startTime || '08:00',
        endTime: payload.workSchedule?.endTime || '17:00',
        toleranceMinutes: Number(payload.workSchedule?.toleranceMinutes) || 15,
      },
      isActive: true,
    });

    revalidatePath('/admin/asistencia');
    revalidatePath('/admin/nomina');
    return { success: true, data: JSON.parse(JSON.stringify(employee)) };
  } catch (error: any) {
    console.error('Error al crear empleado:', error);
    return { success: false, error: error.message || 'Error al crear empleado' };
  }
}

export async function updateEmployee(id: string, payload: Partial<CreateEmployeePayload> & { isActive?: boolean }) {
  try {
    await dbConnect();

    const employee = await Employee.findById(id);
    if (!employee) {
      return { success: false, error: 'Empleado no encontrado' };
    }

    if (payload.pinCode && payload.pinCode.trim() !== employee.pinCode) {
      const pin = payload.pinCode.trim();
      const existingPin = await Employee.findOne({ pinCode: pin, _id: { $ne: id } });
      if (existingPin) {
        return { success: false, error: 'Ese código PIN ya está asignado a otro empleado' };
      }
      employee.pinCode = pin;
    }

    if (payload.name) employee.name = payload.name.trim();
    if (payload.role) employee.role = payload.role;
    if (payload.phone !== undefined) employee.phone = payload.phone.trim();
    if (payload.email !== undefined) employee.email = payload.email.trim();
    if (payload.salaryType) employee.salaryType = payload.salaryType;
    if (payload.baseSalary !== undefined) employee.baseSalary = Number(payload.baseSalary);
    if (payload.isActive !== undefined) employee.isActive = payload.isActive;
    if (payload.workSchedule) {
      employee.workSchedule = {
        startTime: payload.workSchedule.startTime || employee.workSchedule?.startTime || '08:00',
        endTime: payload.workSchedule.endTime || employee.workSchedule?.endTime || '17:00',
        toleranceMinutes: Number(payload.workSchedule.toleranceMinutes) || 15,
      };
    }

    await employee.save();

    revalidatePath('/admin/asistencia');
    revalidatePath('/admin/nomina');
    return { success: true, data: JSON.parse(JSON.stringify(employee)) };
  } catch (error: any) {
    console.error('Error al actualizar empleado:', error);
    return { success: false, error: error.message || 'Error al actualizar empleado' };
  }
}
