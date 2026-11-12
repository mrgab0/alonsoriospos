'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  UserCheck,
  UserX,
  Users,
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Edit2,
  DollarSign,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  punchAttendanceByPin,
  getTodayAttendanceBoard,
  registerManualAttendance,
} from '@/lib/actions/attendance';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
} from '@/lib/actions/employee';

export default function AdminAsistenciaPage() {
  // Estado del Kiosco PIN
  const [pin, setPin] = useState('');
  const [punching, setPunching] = useState(false);
  const [punchResult, setPunchResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    action?: 'check_in' | 'check_out';
  } | null>(null);

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Pizarra de Hoy
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState<any>({
    date: '',
    board: [],
    totalActive: 0,
    presentCount: 0,
    finishedCount: 0,
    pendingCount: 0,
  });
  const [search, setSearch] = useState('');

  // Modal Empleados
  const [employees, setEmployees] = useState<any[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empPin, setEmpPin] = useState('');
  const [empRole, setEmpRole] = useState('cajero');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empSalaryType, setEmpSalaryType] = useState('quincenal');
  const [empBaseSalary, setEmpBaseSalary] = useState(0);
  const [empStartTime, setEmpStartTime] = useState('08:00');
  const [empEndTime, setEmpEndTime] = useState('17:00');
  const [empTolerance, setEmpTolerance] = useState(15);

  // Modal Ajuste Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualIn, setManualIn] = useState('08:00');
  const [manualOut, setManualOut] = useState('17:00');
  const [manualStatus, setManualStatus] = useState('presente');
  const [manualNotes, setManualNotes] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Tab activo: Kiosco + Pizarra vs Directorio de Empleados
  const [activeTab, setActiveTab] = useState<'kiosco' | 'empleados'>('kiosco');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [boardRes, empRes] = await Promise.all([
        getTodayAttendanceBoard(),
        getEmployees(),
      ]);
      if (boardRes.success) setBoardData(boardRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Manejo de marcado PIN
  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleClearPin = () => {
    setPin('');
    setPunchResult(null);
  };

  const handlePunchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) return;

    setPunching(true);
    setPunchResult(null);

    try {
      const res = await punchAttendanceByPin(pin);
      if (res.success) {
        setPunchResult({
          success: true,
          message: res.message,
          action: res.action,
        });
        setPin('');
        await loadData();
      } else {
        setPunchResult({
          success: false,
          error: res.error || 'Error al procesar marca',
        });
      }
    } catch (err: any) {
      setPunchResult({
        success: false,
        error: err.message || 'Error de conexión',
      });
    } finally {
      setPunching(false);
    }
  };

  // Abrir Modal Empleado
  const openEmployeeModal = (emp: any | null = null) => {
    if (emp) {
      setEditingEmployee(emp);
      setEmpName(emp.name);
      setEmpPin(emp.pinCode);
      setEmpRole(emp.role);
      setEmpPhone(emp.phone || '');
      setEmpEmail(emp.email || '');
      setEmpSalaryType(emp.salaryType);
      setEmpBaseSalary(emp.baseSalary);
      setEmpStartTime(emp.workSchedule?.startTime || '08:00');
      setEmpEndTime(emp.workSchedule?.endTime || '17:00');
      setEmpTolerance(emp.workSchedule?.toleranceMinutes || 15);
    } else {
      setEditingEmployee(null);
      setEmpName('');
      // Generar PIN sugerido de 4 dígitos
      const randomPin = String(Math.floor(1000 + Math.random() * 9000));
      setEmpPin(randomPin);
      setEmpRole('cajero');
      setEmpPhone('');
      setEmpEmail('');
      setEmpSalaryType('quincenal');
      setEmpBaseSalary(0);
      setEmpStartTime('08:00');
      setEmpEndTime('17:00');
      setEmpTolerance(15);
    }
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmployee(true);

    try {
      const payload: any = {
        name: empName,
        pinCode: empPin,
        role: empRole,
        phone: empPhone,
        email: empEmail,
        salaryType: empSalaryType,
        baseSalary: Number(empBaseSalary),
        workSchedule: {
          startTime: empStartTime,
          endTime: empEndTime,
          toleranceMinutes: Number(empTolerance),
        },
      };

      let res;
      if (editingEmployee) {
        res = await updateEmployee(editingEmployee._id, payload);
      } else {
        res = await createEmployee(payload);
      }

      if (res.success) {
        setIsEmployeeModalOpen(false);
        await loadData();
      } else {
        alert(res.error || 'Error al guardar empleado');
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSavingEmployee(false);
    }
  };

  // Abrir Modal Ajuste Manual
  const openManualModal = (empId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setManualEmpId(empId || (employees[0]?._id || ''));
    setManualDate(today);
    setManualIn('08:00');
    setManualOut('17:00');
    setManualStatus('presente');
    setManualNotes('');
    setIsManualModalOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmpId || !manualDate || !manualIn) return;
    setSavingManual(true);

    try {
      const res = await registerManualAttendance({
        employeeId: manualEmpId,
        date: manualDate,
        checkIn: manualIn,
        checkOut: manualOut || undefined,
        status: manualStatus as any,
        notes: manualNotes,
      });

      if (res.success) {
        setIsManualModalOpen(false);
        await loadData();
      } else {
        alert(res.error || 'Error al guardar ajuste');
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSavingManual(false);
    }
  };

  const filteredBoard = boardData.board.filter((b: any) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#181922] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reloj Checador & Control de Asistencia
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {currentDate} • Registro biométrico por código PIN y monitoreo de turnos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/nomina"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Ir a Nómina & Pagos
          </Link>

          <button
            onClick={() => openEmployeeModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* TABS DE VISTA */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('kiosco')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'kiosco'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Kiosco PIN & Pizarra de Hoy
        </button>
        <button
          onClick={() => setActiveTab('empleados')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'empleados'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Directorio de Empleados ({employees.length})
        </button>
      </div>

      {activeTab === 'kiosco' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: TERMINAL KIOSCO PIN */}
          <div className="lg:col-span-5 bg-gradient-to-b from-gray-900 to-gray-950 text-white p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col items-center">
            {/* Reloj Digital */}
            <div className="text-center my-2">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-widest text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                {currentTime || '--:--:--'}
              </span>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                Hora Oficial Tienda
              </p>
            </div>

            {/* Display PIN */}
            <div className="w-full max-w-xs mt-4">
              <label className="block text-center text-xs font-medium text-gray-400 uppercase mb-2">
                Ingresa tu PIN de 4 dígitos
              </label>
              <div className="h-14 bg-gray-800/80 border-2 border-gray-700 rounded-2xl flex items-center justify-center tracking-[1em] text-3xl font-mono text-white px-4 shadow-inner">
                {pin ? '•'.repeat(pin.length) : <span className="text-sm font-sans tracking-normal text-gray-500">PIN personal</span>}
              </div>
            </div>

            {/* Teclado Numérico Kiosco */}
            <div className="w-full max-w-xs grid grid-cols-3 gap-2.5 mt-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="h-14 bg-gray-800 hover:bg-gray-700 active:scale-95 text-xl font-bold rounded-2xl transition-all border border-gray-700/60 shadow-sm flex items-center justify-center text-gray-100"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearPin}
                className="h-14 bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 text-sm font-semibold rounded-2xl transition-all border border-rose-800/40 text-rose-300 flex items-center justify-center"
              >
                Borrar
              </button>

              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-14 bg-gray-800 hover:bg-gray-700 active:scale-95 text-xl font-bold rounded-2xl transition-all border border-gray-700/60 shadow-sm flex items-center justify-center text-gray-100"
              >
                0
              </button>

              <button
                type="button"
                disabled={pin.length < 4 || punching}
                onClick={() => handlePunchSubmit()}
                className="h-14 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-sm font-bold rounded-2xl transition-all border border-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30"
              >
                {punching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'MARCAR'}
              </button>
            </div>

            {/* Mensajes de Resultado */}
            {punchResult && (
              <div
                className={`w-full max-w-xs mt-5 p-4 rounded-2xl border text-sm transition-all animate-in fade-in zoom-in-95 duration-200 ${
                  punchResult.success
                    ? punchResult.action === 'check_in'
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                      : 'bg-blue-950/80 border-blue-600 text-blue-200'
                    : 'bg-rose-950/80 border-rose-600 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {punchResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {punchResult.success ? '¡Marca procesada con éxito!' : 'Error de marcaje'}
                    </p>
                    <p className="text-xs mt-1">
                      {punchResult.success ? punchResult.message : punchResult.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: PIZARRA EN VIVO DE HOY */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tarjetas de Métricas de Asistencia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#181922] p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  Presentes
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {boardData.presentCount}
                </div>
              </div>

              <div className="bg-white dark:bg-[#181922] p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Salidas
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  {boardData.finishedCount}
                </div>
              </div>

              <div className="bg-white dark:bg-[#181922] p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <UserX className="w-4 h-4 text-rose-500" />
                  Pendientes
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                  {boardData.pendingCount}
                </div>
              </div>

              <div className="bg-white dark:bg-[#181922] p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <Users className="w-4 h-4 text-purple-500" />
                  Plantilla
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {boardData.totalActive}
                </div>
              </div>
            </div>

            {/* Listado en Vivo */}
            <div className="bg-white dark:bg-[#181922] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🟢</span> Quién está en tienda hoy
                </h3>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar empleado..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => openManualModal()}
                    className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold rounded-xl text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    Ajuste Manual
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                  Cargando asistencia de hoy...
                </div>
              ) : filteredBoard.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No hay registros de empleados para hoy.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredBoard.map((item: any) => {
                    const isWorking = item.checkIn && !item.checkOut;
                    const isFinished = !!item.checkOut;

                    return (
                      <div
                        key={item.employeeId}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isWorking
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                : isFinished
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {item.name.charAt(0)}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                {item.name}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {item.role}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Horario: {item.scheduledStart} - {item.scheduledEnd}
                            </p>
                          </div>
                        </div>

                        {/* Estado y Tiempos */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            {item.checkIn ? (
                              <>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                  Entrada: {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {item.checkOut ? (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Salida: {new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.hoursWorked} hrs)
                                  </p>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    En turno activo
                                  </span>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-rose-500 font-medium">Aún no marca</p>
                            )}
                          </div>

                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                              isWorking
                                ? item.status === 'tardanza'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                : isFinished
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {isWorking
                              ? item.status === 'tardanza'
                                ? 'Tardanza'
                                : 'Presente'
                              : isFinished
                              ? 'Completado'
                              : 'Ausente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DIRECTORIO DE EMPLEADOS */
        <div className="bg-white dark:bg-[#181922] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Empleados Registrados ({employees.length})
            </h3>
            <button
              onClick={() => openEmployeeModal()}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              + Agregar Empleado
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="p-4">Empleado</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">PIN Biométrico</th>
                  <th className="p-4">Tipo de Salario</th>
                  <th className="p-4">Salario Base</th>
                  <th className="p-4">Horario</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      {emp.name}
                      {emp.phone && (
                        <p className="text-xs text-gray-400 font-normal">{emp.phone}</p>
                      )}
                    </td>
                    <td className="p-4 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {emp.pinCode}
                    </td>
                    <td className="p-4 capitalize text-gray-600 dark:text-gray-300">
                      {emp.salaryType}
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      ${Number(emp.baseSalary).toFixed(2)}
                    </td>
                    <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                      {emp.workSchedule?.startTime} - {emp.workSchedule?.endTime} (±{emp.workSchedule?.toleranceMinutes}m)
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEmployeeModal(emp)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR EMPLEADO */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181922] w-full max-w-lg rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingEmployee ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
              </h2>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="Ej. Roberto Martínez"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    PIN Biométrico (4 Dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={empPin}
                    onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-3.5 py-2 text-sm font-mono font-bold tracking-widest bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Rol / Puesto *
                  </label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cajero">Cajero POS</option>
                    <option value="almacen">Almacén & Kardex</option>
                    <option value="vendedor">Vendedor de Mostrador</option>
                    <option value="administrador">Administrador</option>
                    <option value="repartidor">Repartidor / Chofer</option>
                    <option value="limpieza">Mantenimiento</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="+58 412..."
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="empleado@correo.com"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Modalidad de Sueldo
                  </label>
                  <select
                    value={empSalaryType}
                    onChange={(e) => setEmpSalaryType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  >
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="semanal">Semanal</option>
                    <option value="hora">Por Hora</option>
                    <option value="diario">Por Día</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Monto Base ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={empBaseSalary}
                    onChange={(e) => setEmpBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Hora Entrada Programada
                  </label>
                  <input
                    type="time"
                    value={empStartTime}
                    onChange={(e) => setEmpStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Hora Salida Programada
                  </label>
                  <input
                    type="time"
                    value={empEndTime}
                    onChange={(e) => setEmpEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {savingEmployee && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE MANUAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Ajuste Manual de Asistencia
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Empleado
                </label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    required
                    value={manualIn}
                    onChange={(e) => setManualIn(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Hora Salida
                  </label>
                  <input
                    type="time"
                    value={manualOut}
                    onChange={(e) => setManualOut(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Estado
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  <option value="presente">A tiempo (Presente)</option>
                  <option value="tardanza">Tardanza</option>
                  <option value="sobretiempo">Sobretiempo / Horas Extra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Motivo / Observaciones
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ej. Olvidó marcar salida al cerrar"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {savingManual && <Loader2 className="w-4 h-4 animate-spin" />}
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
