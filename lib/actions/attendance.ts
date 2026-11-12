'use server';

import dbConnect from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { AttendanceRecord, AttendanceStatus } from '@/lib/models/AttendanceRecord';
import { revalidatePath } from 'next/cache';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function punchAttendanceByPin(pinCode: string) {
  try {
    await dbConnect();

    const cleanPin = pinCode.trim();
    if (!cleanPin) {
      return { success: false, error: 'Ingrese su código PIN' };
    }

    const employee = await Employee.findOne({ pinCode: cleanPin, isActive: true });
    if (!employee) {
      return { success: false, error: 'PIN incorrecto o empleado inactivo' };
    }

    const todayStr = getTodayDateString();
    const now = new Date();

    // Buscar si ya tiene registro el día de hoy
    let record = await AttendanceRecord.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    if (!record) {
      // MARCAR ENTRADA
      let status: AttendanceStatus = 'presente';

      if (employee.workSchedule?.startTime) {
        const [targetHours, targetMinutes] = employee.workSchedule.startTime.split(':').map(Number);
        const tolerance = employee.workSchedule.toleranceMinutes || 15;

        const scheduledTime = new Date(now);
        scheduledTime.setHours(targetHours, targetMinutes + tolerance, 0, 0);

        if (now > scheduledTime) {
          status = 'tardanza';
        }
      }

      record = await AttendanceRecord.create({
        employeeId: employee._id,
        employeeName: employee.name,
        date: todayStr,
        checkIn: now,
        status,
        hoursWorked: 0,
      });

      revalidatePath('/admin/asistencia');
      return {
        success: true,
        action: 'check_in' as const,
        employeeName: employee.name,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status,
        message: `¡Bienvenido(a), ${employee.name}! Entrada registrada con éxito (${status === 'tardanza' ? 'Con Tardanza' : 'A Tiempo'}).`,
      };
    } else if (!record.checkOut) {
      // MARCAR SALIDA
      record.checkOut = now;
      const diffMs = now.getTime() - new Date(record.checkIn).getTime();
      const hours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));
      record.hoursWorked = hours;

      if (hours > 8.5 && record.status !== 'tardanza') {
        record.status = 'sobretiempo';
      }

      await record.save();

      revalidatePath('/admin/asistencia');
      return {
        success: true,
        action: 'check_out' as const,
        employeeName: employee.name,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        hoursWorked: hours,
        message: `¡Hasta pronto, ${employee.name}! Salida registrada. Horas trabajadas hoy: ${hours} hrs.`,
      };
    } else {
      return {
        success: false,
        error: `${employee.name} ya registró su Entrada (${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) y Salida (${new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) de hoy.`,
      };
    }
  } catch (error: any) {
    console.error('Error al marcar asistencia:', error);
    return { success: false, error: error.message || 'Error al procesar marca de asistencia' };
  }
}

export async function getTodayAttendanceBoard() {
  try {
    await dbConnect();
    const todayStr = getTodayDateString();

    const [employees, todayRecords] = await Promise.all([
      Employee.find({ isActive: true }).sort({ name: 1 }).lean(),
      AttendanceRecord.find({ date: todayStr }).lean(),
    ]);

    const recordsMap = new Map();
    todayRecords.forEach((rec) => {
      recordsMap.set(rec.employeeId.toString(), rec);
    });

    const board = employees.map((emp) => {
      const rec = recordsMap.get(emp._id.toString());
      return {
        employeeId: emp._id.toString(),
        name: emp.name,
        role: emp.role,
        scheduledStart: emp.workSchedule?.startTime || '08:00',
        scheduledEnd: emp.workSchedule?.endTime || '17:00',
        hasRecord: !!rec,
        checkIn: rec?.checkIn ? new Date(rec.checkIn).toISOString() : null,
        checkOut: rec?.checkOut ? new Date(rec.checkOut).toISOString() : null,
        hoursWorked: rec?.hoursWorked || 0,
        status: rec ? rec.status : 'ausente',
        recordId: rec?._id?.toString() || null,
      };
    });

    return {
      success: true,
      data: {
        date: todayStr,
        board: JSON.parse(JSON.stringify(board)),
        totalActive: employees.length,
        presentCount: todayRecords.filter((r) => !r.checkOut).length,
        finishedCount: todayRecords.filter((r) => !!r.checkOut).length,
        pendingCount: employees.length - todayRecords.length,
      },
    };
  } catch (error: any) {
    console.error('Error al obtener pizarra de asistencia:', error);
    return { success: false, error: error.message || 'Error al obtener pizarra de asistencia' };
  }
}

export async function getAttendanceHistory(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    await dbConnect();

    const query: any = {};
    if (filters?.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters?.startDate && filters?.endDate) {
      query.date = { $gte: filters.startDate, $lte: filters.endDate };
    } else if (filters?.startDate) {
      query.date = { $gte: filters.startDate };
    }

    const records = await AttendanceRecord.find(query).sort({ date: -1, checkIn: -1 }).limit(100).lean();
    return { success: true, data: JSON.parse(JSON.stringify(records)) };
  } catch (error: any) {
    console.error('Error al obtener historial de asistencia:', error);
    return { success: false, error: error.message || 'Error al obtener historial' };
  }
}

export async function registerManualAttendance(payload: {
  employeeId: string;
  date: string;
  checkIn: string; // HH:mm
  checkOut?: string; // HH:mm
  status?: AttendanceStatus;
  notes?: string;
}) {
  try {
    await dbConnect();

    const employee = await Employee.findById(payload.employeeId);
    if (!employee) {
      return { success: false, error: 'Empleado no encontrado' };
    }

    const [inH, inM] = payload.checkIn.split(':').map(Number);
    const checkInDate = new Date(`${payload.date}T00:00:00`);
    checkInDate.setHours(inH, inM, 0, 0);

    let checkOutDate: Date | undefined = undefined;
    let hoursWorked = 0;

    if (payload.checkOut) {
      const [outH, outM] = payload.checkOut.split(':').map(Number);
      checkOutDate = new Date(`${payload.date}T00:00:00`);
      checkOutDate.setHours(outH, outM, 0, 0);
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      hoursWorked = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));
    }

    const record = await AttendanceRecord.findOneAndUpdate(
      { employeeId: employee._id, date: payload.date },
      {
        employeeName: employee.name,
        checkIn: checkInDate,
        ...(checkOutDate ? { checkOut: checkOutDate } : {}),
        hoursWorked,
        status: payload.status || 'presente',
        notes: payload.notes?.trim() || 'Ajuste manual de supervisor',
      },
      { upsert: true, new: true }
    );

    revalidatePath('/admin/asistencia');
    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (error: any) {
    console.error('Error al registrar asistencia manual:', error);
    return { success: false, error: error.message || 'Error al registrar ajuste manual' };
  }
}
