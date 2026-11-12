'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  X,
  Loader2,
  Download,
  AlertCircle,
  CreditCard,
  Building,
  Receipt,
  Search,
} from 'lucide-react';
import {
  getPayrollDashboard,
  registerPayrollPayment,
  getPayrollHistory,
  RegisterPaymentPayload,
} from '@/lib/actions/payroll';
import { PaymentMethodType } from '@/lib/models/PayrollPayment';

export default function AdminNominaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    currentMonth: '',
    metrics: {
      totalEmployees: 0,
      totalEstimatedPayroll: 0,
      totalDisbursed: 0,
      totalPending: 0,
    },
    employees: [],
    recentPayments: [],
  });

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal Registrar Pago
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [workedUnits, setWorkedUnits] = useState(0);
  const [overtimeAmount, setOvertimeAmount] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('efectivo');
  const [notes, setNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Modal Recibo Impreso
  const [receiptModalData, setReceiptModalData] = useState<any | null>(null);

  // Tab activo: Liquidación de nómina vs Historial de Recibos
  const [activeTab, setActiveTab] = useState<'liquidacion' | 'historial'>('liquidacion');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadDashboard = async (month?: string) => {
    setLoading(true);
    try {
      const res = await getPayrollDashboard(month || selectedMonth);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getPayrollHistory();
      if (res.success) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab === 'historial') {
      loadHistory();
    }
  }, [activeTab]);

  // Abrir Modal de Pago
  const openPayModal = (emp: any) => {
    setSelectedEmp(emp);

    const now = new Date();
    const firstDay = `${selectedMonth}-01`;
    const lastDay = `${selectedMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

    setPeriodStart(firstDay);
    setPeriodEnd(lastDay);
    setBaseSalary(emp.baseSalary);
    setWorkedUnits(emp.salaryType === 'hora' ? emp.totalHours : emp.totalDaysPresent);
    setOvertimeAmount(0);
    setBonusAmount(0);
    setDeductionAmount(0);
    setPaymentMethod('efectivo');
    setNotes('');
    setIsPayModalOpen(true);
  };

  // Cálculo neto a pagar en tiempo real
  const computedNet = Math.max(
    0,
    (selectedEmp?.salaryType === 'hora'
      ? workedUnits * baseSalary
      : selectedEmp?.salaryType === 'diario'
      ? workedUnits * baseSalary
      : baseSalary) +
      Number(overtimeAmount) +
      Number(bonusAmount) -
      Number(deductionAmount)
  );

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || computedNet <= 0) return;
    setSavingPayment(true);

    try {
      const payload: RegisterPaymentPayload = {
        employeeId: selectedEmp.employeeId,
        periodStart,
        periodEnd,
        baseSalary,
        workedUnits,
        overtimeAmount: Number(overtimeAmount),
        bonusAmount: Number(bonusAmount),
        deductionAmount: Number(deductionAmount),
        netAmount: Number(computedNet.toFixed(2)),
        paymentMethod,
        notes,
      };

      const res = await registerPayrollPayment(payload);
      if (res.success) {
        setIsPayModalOpen(false);
        setReceiptModalData(res.data);
        await loadDashboard(selectedMonth);
      } else {
        alert(res.error || 'Error al procesar pago');
      }
    } catch (err: any) {
      alert(err.message || 'Error al procesar pago');
    } finally {
      setSavingPayment(false);
    }
  };

  const filteredEmployees = (data.employees || []).filter((e: any) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#181922] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nómina & Control de Pago a Empleados
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Liquidación salarial automática según asistencia, horas laboradas y emisión de recibos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-800 dark:text-gray-200"
          />

          <Link
            href="/admin/asistencia"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-semibold transition-colors"
          >
            <Clock className="w-4 h-4" />
            Reloj Checador
          </Link>
        </div>
      </div>

      {/* METRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#181922] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Plantilla Activa</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {data.metrics?.totalEmployees || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Empleados en nómina</p>
        </div>

        <div className="bg-white dark:bg-[#181922] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Nómina Estimada</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            ${Number(data.metrics?.totalEstimatedPayroll || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Calculada para {selectedMonth}</p>
        </div>

        <div className="bg-white dark:bg-[#181922] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Total Desembolsado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ${Number(data.metrics?.totalDisbursed || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Pagado este periodo</p>
        </div>

        <div className="bg-white dark:bg-[#181922] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Saldo Pendiente</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            ${Number(data.metrics?.totalPending || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Por liquidar a empleados</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('liquidacion')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'liquidacion'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Liquidación de Empleados ({data.employees?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'historial'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Historial de Recibos Emitidos
        </button>
      </div>

      {activeTab === 'liquidacion' ? (
        /* TABLA DE LIQUIDACIÓN */
        <div className="bg-white dark:bg-[#181922] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Nómina del Mes: {selectedMonth}
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar empleado o puesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
              Calculando asistencias y sueldos...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No se encontraron empleados registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="p-4">Empleado / Puesto</th>
                    <th className="p-4">Esquema</th>
                    <th className="p-4">Asistencia en Mes</th>
                    <th className="p-4">Sueldo Estimado</th>
                    <th className="p-4">Pagado</th>
                    <th className="p-4">Pendiente</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEmployees.map((emp: any) => (
                    <tr key={emp.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        {emp.name}
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-normal capitalize">
                          {emp.role}
                        </p>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                          {emp.salaryType}
                        </span>
                        <p className="text-gray-400">${Number(emp.baseSalary).toFixed(2)}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {emp.totalDaysPresent} días
                        </span>{' '}
                        ({emp.totalHours} hrs)
                        {emp.totalTardanzas > 0 && (
                          <span className="ml-2 text-amber-500 font-medium">
                            {emp.totalTardanzas} tardanzas
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">
                        ${Number(emp.estimatedBasePay).toFixed(2)}
                      </td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        ${Number(emp.totalPaidThisMonth).toFixed(2)}
                      </td>
                      <td className="p-4 font-bold text-amber-600 dark:text-amber-400">
                        ${Number(emp.pendingPay).toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openPayModal(emp)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Pagar / Liquidar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* HISTORIAL DE RECIBOS */
        <div className="bg-white dark:bg-[#181922] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Historial de Recibos y Desembolsos
            </h3>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
              Cargando comprobantes...
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No hay pagos registrados aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="p-4">N° Recibo</th>
                    <th className="p-4">Fecha Pago</th>
                    <th className="p-4">Empleado</th>
                    <th className="p-4">Periodo</th>
                    <th className="p-4">Método</th>
                    <th className="p-4">Monto Neto</th>
                    <th className="p-4 text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {historyList.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {rec.receiptNumber}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(rec.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">
                        {rec.employeeName}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(rec.periodStart).toLocaleDateString()} al{' '}
                        {new Date(rec.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-4 capitalize text-xs">{rec.paymentMethod}</td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">
                        ${Number(rec.netAmount).toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setReceiptModalData(rec)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Ver o Imprimir Recibo"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL LIQUIDAR / REGISTRAR PAGO */}
      {isPayModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181922] w-full max-w-lg rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Registrar Pago a Empleado
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedEmp.name} • {selectedEmp.role}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Periodo Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Periodo Fin
                  </label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Sueldo Base ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Unidades (Horas/Días)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={workedUnits}
                    onChange={(e) => setWorkedUnits(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Horas Extra ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={overtimeAmount}
                    onChange={(e) => setOvertimeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Bono / Comisión ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Descuento / Anticipo ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-rose-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  >
                    <option value="efectivo">Efectivo en Caja</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Total Neto a Pagar
                  </label>
                  <div className="px-3 py-2 text-lg font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                    ${computedNet.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Notas / Concepto
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Quincena 1 de Noviembre 2026"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPayment || computedNet <= 0}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {savingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  Emitir Pago & Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECIBO DE PAGO DIGITAL / TÉRMICO */}
      {receiptModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Comprobante Oficial de Nómina
              </span>
              <button
                onClick={() => setReceiptModalData(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formato de Ticket de Recibo */}
            <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-gray-300 dark:border-gray-700 pb-3">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">VKA POS</h4>
                <p className="text-[10px] text-gray-500">RECIBO DE PAGO DE NÓMINA</p>
                <p className="font-bold text-xs text-emerald-600 mt-1">
                  {receiptModalData.receiptNumber}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Empleado:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {receiptModalData.employeeName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha de Pago:</span>
                  <span>{new Date(receiptModalData.paymentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Periodo:</span>
                  <span>
                    {new Date(receiptModalData.periodStart).toLocaleDateString()} -{' '}
                    {new Date(receiptModalData.periodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Método:</span>
                  <span className="capitalize">{receiptModalData.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Sueldo Base:</span>
                  <span>${Number(receiptModalData.baseSalary).toFixed(2)}</span>
                </div>
                {receiptModalData.overtimeAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Horas Extras:</span>
                    <span>+${Number(receiptModalData.overtimeAmount).toFixed(2)}</span>
                  </div>
                )}
                {receiptModalData.bonusAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Bonificaciones:</span>
                    <span>+${Number(receiptModalData.bonusAmount).toFixed(2)}</span>
                  </div>
                )}
                {receiptModalData.deductionAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Deducciones / Anticipos:</span>
                    <span>-${Number(receiptModalData.deductionAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-2 flex justify-between font-bold text-sm">
                <span>NETO RECIBIDO:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ${Number(receiptModalData.netAmount).toFixed(2)}
                </span>
              </div>

              {receiptModalData.notes && (
                <p className="text-[10px] text-gray-400 pt-1 italic">
                  Concepto: {receiptModalData.notes}
                </p>
              )}

              <div className="pt-6 text-center text-[10px] text-gray-400 border-t border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-32 mx-auto border-b border-gray-400 mb-1"></div>
                Firma de Conformidad
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Printer className="w-4 h-4" />
                Imprimir Recibo
              </button>
              <button
                onClick={() => setReceiptModalData(null)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
