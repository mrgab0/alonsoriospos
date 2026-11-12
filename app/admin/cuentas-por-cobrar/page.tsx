'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Receipt,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  X,
  Loader2,
  AlertCircle,
  Settings,
  Phone,
  Mail,
  Calendar,
  FileText,
  Printer,
  BadgePercent,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  getDebtorsSummary,
  registerCustomerCreditPayment,
  updateCustomerCreditSettings,
} from '@/lib/actions/credit';
import {
  getFinancingDashboard,
  createCustomerFinancing,
  payFinancingInstallment,
  CreateFinancingPayload,
} from '@/lib/actions/financing';
import { FinancingFrequency } from '@/lib/models/CustomerFinancing';

export default function AdminCuentasPorCobrarPage() {
  const [data, setData] = useState<any>({
    debtors: [],
    history: [],
    totalReceivable: 0,
    debtorsCount: 0,
    overLimitCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'debtors' | 'financiamiento' | 'history'>('debtors');
  const [search, setSearch] = useState('');

  // Modal de Abono Fiado Directo
  const [selectedDebtor, setSelectedDebtor] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Modal de Configurar Límite
  const [configDebtor, setConfigDebtor] = useState<any | null>(null);
  const [newLimit, setNewLimit] = useState<number>(500);
  const [newStatus, setNewStatus] = useState<'active' | 'blocked'>('active');
  const [savingLimit, setSavingLimit] = useState(false);

  // FINANCIAMIENTO EN CUOTAS
  const [financingData, setFinancingData] = useState<any>({
    metrics: {
      totalPlans: 0,
      totalPrincipal: 0,
      totalFinanced: 0,
      totalAmortized: 0,
      totalPending: 0,
      overdueCount: 0,
    },
    plans: [],
  });
  const [loadingFinancing, setLoadingFinancing] = useState(false);

  // Modal Nuevo Financiamiento
  const [isNewFinancingModalOpen, setIsNewFinancingModalOpen] = useState(false);
  const [finCustomerId, setFinCustomerId] = useState('');
  const [finPrincipal, setFinPrincipal] = useState<number>(200);
  const [finInterestRate, setFinInterestRate] = useState<number>(0);
  const [finInstallmentsCount, setFinInstallmentsCount] = useState<number>(3);
  const [finFrequency, setFinFrequency] = useState<FinancingFrequency>('quincenal');
  const [finNotes, setFinNotes] = useState('');
  const [savingFinancing, setSavingFinancing] = useState(false);

  // Modal Cobrar Cuota
  const [payInstallmentPlan, setPayInstallmentPlan] = useState<any | null>(null);
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState<number>(1);
  const [installmentPayAmount, setInstallmentPayAmount] = useState<number>(0);
  const [installmentPayMethod, setInstallmentPayMethod] = useState('efectivo');
  const [installmentRef, setInstallmentRef] = useState('');
  const [installmentNotes, setInstallmentNotes] = useState('');
  const [savingInstallmentPay, setSavingInstallmentPay] = useState(false);

  // Modal Pagaré / Contrato de Financiamiento Imprimible
  const [promissoryPlan, setPromissoryPlan] = useState<any | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDebtorsSummary();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancing = async () => {
    setLoadingFinancing(true);
    try {
      const res = await getFinancingDashboard();
      if (res.success && res.data) {
        setFinancingData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFinancing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'financiamiento') {
      loadFinancing();
    }
  }, [activeTab]);

  const openPaymentModal = (debtor: any) => {
    setSelectedDebtor(debtor);
    setPayAmount(debtor.balance || 0);
    setPaymentMethod('efectivo');
    setReferenceNumber('');
    setNotes('');
  };

  const openConfigModal = (debtor: any) => {
    setConfigDebtor(debtor);
    setNewLimit(debtor.creditLimit || 500);
    setNewStatus(debtor.creditStatus || 'active');
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor || payAmount <= 0) return;
    setSavingPayment(true);

    try {
      const res = await registerCustomerCreditPayment({
        customerId: selectedDebtor.id,
        amount: Number(payAmount),
        paymentMethod,
        referenceNumber,
        notes,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `¡Abono de $${Number(payAmount).toFixed(2)} registrado con éxito para ${selectedDebtor.name}!`,
        });
        setSelectedDebtor(null);
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Error al procesar el abono',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error inesperado' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configDebtor) return;
    setSavingLimit(true);

    try {
      const res = await updateCustomerCreditSettings({
        customerId: configDebtor.id,
        creditLimit: Number(newLimit),
        creditStatus: newStatus,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Configuración actualizada para ${configDebtor.name}`,
        });
        setConfigDebtor(null);
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Error al actualizar configuración',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error inesperado' });
    } finally {
      setSavingLimit(false);
    }
  };

  // Abrir Modal Nuevo Financiamiento
  const openNewFinancingModal = () => {
    if (data.debtors?.length > 0) {
      setFinCustomerId(data.debtors[0].id);
    }
    setFinPrincipal(200);
    setFinInterestRate(0);
    setFinInstallmentsCount(3);
    setFinFrequency('quincenal');
    setFinNotes('');
    setIsNewFinancingModalOpen(true);
  };

  const handleSaveNewFinancing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finCustomerId || finPrincipal <= 0) return;
    setSavingFinancing(true);

    try {
      const payload: CreateFinancingPayload = {
        customerId: finCustomerId,
        principalAmount: Number(finPrincipal),
        interestRate: Number(finInterestRate),
        installmentsCount: Number(finInstallmentsCount),
        frequency: finFrequency,
        notes: finNotes,
      };

      const res = await createCustomerFinancing(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `¡Plan de financiamiento creado exitosamente!`,
        });
        setIsNewFinancingModalOpen(false);
        await loadFinancing();
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Error al crear financiamiento',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error inesperado' });
    } finally {
      setSavingFinancing(false);
    }
  };

  // Abrir Modal Cobro de Cuota
  const openInstallmentPayModal = (plan: any) => {
    setPayInstallmentPlan(plan);
    // Seleccionar la primera cuota pendiente
    const firstPending = plan.installments?.find((i: any) => i.status !== 'pagada');
    if (firstPending) {
      setSelectedInstallmentNumber(firstPending.installmentNumber);
      setInstallmentPayAmount(Number((firstPending.amount - firstPending.paidAmount).toFixed(2)));
    } else {
      setSelectedInstallmentNumber(1);
      setInstallmentPayAmount(0);
    }
    setInstallmentPayMethod('efectivo');
    setInstallmentRef('');
    setInstallmentNotes('');
  };

  const handleSaveInstallmentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInstallmentPlan || installmentPayAmount <= 0) return;
    setSavingInstallmentPay(true);

    try {
      const res = await payFinancingInstallment(
        payInstallmentPlan._id,
        selectedInstallmentNumber,
        installmentPayAmount,
        installmentPayMethod,
        installmentRef,
        installmentNotes
      );

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `¡Cuota #${selectedInstallmentNumber} pagada con éxito ($${installmentPayAmount.toFixed(2)})!`,
        });
        setPayInstallmentPlan(null);
        await loadFinancing();
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Error al procesar pago de cuota',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error inesperado' });
    } finally {
      setSavingInstallmentPay(false);
    }
  };

  const filteredDebtors = (data.debtors || []).filter(
    (d: any) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#181922] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Cuentas por Cobrar & Financiamiento
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Cartera de fiados, planes de financiamiento en cuotas, alertas de mora y libro contable
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewFinancingModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus size={16} />
            Nuevo Plan Financiamiento
          </button>

          <Link
            href="/admin/pos"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
          >
            <DollarSign size={16} />
            Ir a Caja POS
          </Link>
        </div>
      </div>

      {/* METRICAS TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total por Cobrar (Cartera)
            </span>
            <DollarSign size={16} className="text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            ${Number(data.totalReceivable || 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">Saldo acumulado en la calle</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Clientes Deudores
            </span>
            <Users size={16} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {data.debtorsCount || 0}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">Con saldo pendiente</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Planes Financiados
            </span>
            <Calendar size={16} className="text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {financingData.metrics?.totalPlans || 0}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">
            ${Number(financingData.metrics?.totalPending || 0).toFixed(2)} en cuotas
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Cuotas en Mora
            </span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <span
            className={`text-2xl font-black mt-1 block ${
              financingData.metrics?.overdueCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600'
            }`}
          >
            {financingData.metrics?.overdueCount || 0}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
            {financingData.metrics?.overdueCount > 0
              ? 'Planes con cuotas vencidas'
              : 'Cartera financiada al día'}
          </span>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* PESTAÑAS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'debtors'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Clientes Deudores ({data.debtorsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('financiamiento')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'financiamiento'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Planes de Financiamiento en Cuotas ({financingData.plans?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Libro de Movimientos ({data.history?.length || 0})
          </button>
        </div>

        {activeTab === 'debtors' && (
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* TABLA: CLIENTES DEUDORES (FIADO DIRECTO) */}
      {activeTab === 'debtors' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
              Cargando cartera de clientes deudores...
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No se encontraron clientes con deudas pendientes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6">Teléfono</th>
                    <th className="py-4 px-6">Límite Cupo</th>
                    <th className="py-4 px-6">Saldo Deudor</th>
                    <th className="py-4 px-6">% Cupo Usado</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {filteredDebtors.map((debtor: any) => {
                    const percent =
                      debtor.creditLimit > 0
                        ? Math.min(100, (debtor.balance / debtor.creditLimit) * 100)
                        : 100;
                    const isOver = debtor.balance > debtor.creditLimit;

                    return (
                      <tr key={debtor.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="py-4 px-6">
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {debtor.name}
                          </span>
                          <span className="text-[10px] text-gray-400 block">{debtor.email}</span>
                        </td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                          {debtor.phone}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-700 dark:text-gray-300">
                          ${Number(debtor.creditLimit || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 font-black text-rose-600 dark:text-rose-400 text-sm">
                          ${Number(debtor.balance || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOver ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {percent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              debtor.creditStatus === 'blocked'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : isOver
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {debtor.creditStatus === 'blocked'
                              ? 'Bloqueado'
                              : isOver
                              ? 'Sobregiro'
                              : 'Activo'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openPaymentModal(debtor)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                            >
                              <Receipt size={12} />
                              Abonar
                            </button>
                            <button
                              onClick={() => openConfigModal(debtor)}
                              className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                              title="Configurar Límite"
                            >
                              <Settings size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABLA: PLANES DE FINANCIAMIENTO EN CUOTAS */}
      {activeTab === 'financiamiento' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Financiamiento en Cuotas Activos
              </h3>
              <p className="text-xs text-gray-400">
                Planes estructurados con cronograma de pagos, vencimientos y seguimiento de mora
              </p>
            </div>
            <button
              onClick={openNewFinancingModal}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
            >
              + Nuevo Financiamiento
            </button>
          </div>

          {loadingFinancing ? (
            <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
              Cargando planes de financiamiento...
            </div>
          ) : financingData.plans?.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No hay planes de financiamiento registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6">Total Financiado</th>
                    <th className="py-4 px-6">Progreso Cuotas</th>
                    <th className="py-4 px-6">Monto Cuota</th>
                    <th className="py-4 px-6">Saldo Restante</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {financingData.plans.map((plan: any) => {
                    const paidCount = plan.installments?.filter((i: any) => i.status === 'pagada').length || 0;
                    const totalCount = plan.installmentsCount || 1;
                    const percent = (plan.paidAmount / (plan.totalAmount || 1)) * 100;

                    return (
                      <tr key={plan._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="py-4 px-6">
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {plan.customerName}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {plan.customerPhone || plan.orderId || 'Venta directa'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                          ${Number(plan.totalAmount).toFixed(2)}
                          {plan.interestRate > 0 && (
                            <span className="text-[10px] text-emerald-600 block">
                              +{plan.interestRate}% interés
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-gray-700 dark:text-gray-300">
                            {paidCount} de {totalCount} cuotas ({plan.frequency})
                          </span>
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-emerald-600 dark:text-emerald-400">
                          ${Number(plan.installmentAmount).toFixed(2)} / {plan.frequency}
                        </td>
                        <td className="py-4 px-6 font-black text-rose-600 dark:text-rose-400">
                          ${Number(plan.remainingBalance).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              plan.status === 'pagado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : plan.hasOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {plan.status === 'pagado'
                              ? 'Completado'
                              : plan.hasOverdue
                              ? 'En Mora'
                              : 'Al Día'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {plan.status !== 'pagado' && (
                              <button
                                onClick={() => openInstallmentPayModal(plan)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                              >
                                <DollarSign size={12} />
                                Cobrar Cuota
                              </button>
                            )}
                            <button
                              onClick={() => setPromissoryPlan(plan)}
                              className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                              title="Ver Pagaré / Compromiso de Pago"
                            >
                              <FileText size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABLA: LIBRO DE MOVIMIENTOS HISTÓRICOS */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Libro Mayor de Créditos y Abonos
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Tipo</th>
                  <th className="py-4 px-6">Monto</th>
                  <th className="py-4 px-6">Saldo Anterior</th>
                  <th className="py-4 px-6">Nuevo Saldo</th>
                  <th className="py-4 px-6">Detalle / Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {(data.history || []).map((h: any) => (
                  <tr key={h._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-4 px-6 text-gray-400">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                      {h.customerName}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.type === 'charge'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {h.type === 'charge' ? 'Cargo (Fiado)' : 'Abono'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-black text-gray-900 dark:text-white">
                      ${Number(h.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-gray-400">
                      ${Number(h.previousBalance).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                      ${Number(h.newBalance).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {h.notes || h.referenceNumber || h.orderId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVO FINANCIAMIENTO */}
      {isNewFinancingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Crear Plan de Financiamiento en Cuotas
              </h2>
              <button
                onClick={() => setIsNewFinancingModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewFinancing} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Cliente *
                </label>
                <select
                  value={finCustomerId}
                  onChange={(e) => setFinCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  {data.debtors?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Monto Principal ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={finPrincipal}
                    onChange={(e) => setFinPrincipal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Interés / Recargo (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={finInterestRate}
                    onChange={(e) => setFinInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    N° de Cuotas
                  </label>
                  <select
                    value={finInstallmentsCount}
                    onChange={(e) => setFinInstallmentsCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  >
                    {[2, 3, 4, 6, 8, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} cuotas
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Frecuencia de Pago
                  </label>
                  <select
                    value={finFrequency}
                    onChange={(e) => setFinFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                  >
                    <option value="quincenal">Quincenal (cada 15 días)</option>
                    <option value="mensual">Mensual (cada 30 días)</option>
                    <option value="semanal">Semanal (cada 7 días)</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                <span>Total a Pagar / Cuota:</span>
                <span className="font-bold text-sm">
                  ${((finPrincipal * (1 + finInterestRate / 100)) / finInstallmentsCount).toFixed(2)} / {finFrequency} (Total: ${(finPrincipal * (1 + finInterestRate / 100)).toFixed(2)})
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Notas / Concepto
                </label>
                <input
                  type="text"
                  value={finNotes}
                  onChange={(e) => setFinNotes(e.target.value)}
                  placeholder="Ej. Financiamiento de mercancía mayorista"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsNewFinancingModalOpen(false)}
                  className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFinancing}
                  className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
                >
                  {savingFinancing && <Loader2 size={14} className="animate-spin" />}
                  Emitir Financiamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COBRAR CUOTA DE FINANCIAMIENTO */}
      {payInstallmentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Cobrar Cuota de Financiamiento
                </h2>
                <p className="text-xs text-gray-400">{payInstallmentPlan.customerName}</p>
              </div>
              <button
                onClick={() => setPayInstallmentPlan(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveInstallmentPayment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Seleccionar Cuota a Pagar
                </label>
                <select
                  value={selectedInstallmentNumber}
                  onChange={(e) => {
                    const num = parseInt(e.target.value);
                    setSelectedInstallmentNumber(num);
                    const inst = payInstallmentPlan.installments.find((i: any) => i.installmentNumber === num);
                    if (inst) {
                      setInstallmentPayAmount(Number((inst.amount - inst.paidAmount).toFixed(2)));
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  {payInstallmentPlan.installments?.map((inst: any) => (
                    <option key={inst.installmentNumber} value={inst.installmentNumber}>
                      Cuota #{inst.installmentNumber} (Vence: {new Date(inst.dueDate).toLocaleDateString()}) - ${inst.amount.toFixed(2)} [{inst.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Monto a Cobrar ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={installmentPayAmount}
                  onChange={(e) => setInstallmentPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl font-black text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Método de Cobro
                </label>
                <select
                  value={installmentPayMethod}
                  onChange={(e) => setInstallmentPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  <option value="efectivo">Efectivo en Caja</option>
                  <option value="transferencia">Transferencia / Zelle</option>
                  <option value="tarjeta">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Referencia / N° Comprobante
                </label>
                <input
                  type="text"
                  value={installmentRef}
                  onChange={(e) => setInstallmentRef(e.target.value)}
                  placeholder="Ej. Zelle #82910"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setPayInstallmentPlan(null)}
                  className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingInstallmentPay || installmentPayAmount <= 0}
                  className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
                >
                  {savingInstallmentPay && <Loader2 size={14} className="animate-spin" />}
                  Confirmar Cobro de Cuota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGARÉ / CONTRATO DE FINANCIAMIENTO IMPRIMIBLE */}
      {promissoryPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181922] w-full max-w-lg rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Pagaré & Compromiso de Pago
              </span>
              <button
                onClick={() => setPromissoryPlan(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl font-mono text-xs space-y-4">
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <h4 className="font-bold text-base text-gray-900 dark:text-white">VKA POS</h4>
                <p className="text-[10px] text-gray-500">PAGARÉ / CONTRATO DE FINANCIAMIENTO</p>
                <p className="font-bold text-emerald-600 mt-1">PLAN #{promissoryPlan._id}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Deudor:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {promissoryPlan.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono:</span>
                  <span>{promissoryPlan.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha Emisión:</span>
                  <span>{new Date(promissoryPlan.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Financiado:</span>
                  <span className="font-bold text-sm text-emerald-600">
                    ${Number(promissoryPlan.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-3">
                <p className="font-bold text-[11px] mb-2 uppercase text-gray-700 dark:text-gray-300">
                  Tabla de Amortización / Cuotas:
                </p>
                <div className="space-y-1.5">
                  {promissoryPlan.installments?.map((inst: any) => (
                    <div
                      key={inst.installmentNumber}
                      className="flex justify-between items-center text-[11px] p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <span>
                        Cuota #{inst.installmentNumber} - Vence:{' '}
                        {new Date(inst.dueDate).toLocaleDateString()}
                      </span>
                      <span className="font-bold">
                        ${inst.amount.toFixed(2)}{' '}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            inst.status === 'pagada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-gray-500 pt-2 italic text-justify leading-tight">
                "Por este pagaré me comprometo a pagar incondicionalmente a la orden de VKA POS la
                cantidad indicada en las fechas y cuotas especificadas en este contrato."
              </p>

              <div className="pt-8 text-center text-[10px] text-gray-400 border-t border-dashed border-gray-300">
                <div className="w-40 mx-auto border-b border-gray-400 mb-1"></div>
                Firma y C.I. del Cliente Deudor
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Imprimir Pagaré
              </button>
              <button
                onClick={() => setPromissoryPlan(null)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ABONO CLIENTE FIADO DIRECTO */}
      {selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Registrar Abono a Cuenta Fiada
                </h2>
                <p className="text-xs text-gray-400">{selectedDebtor.name}</p>
              </div>
              <button
                onClick={() => setSelectedDebtor(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex justify-between items-center text-rose-800 dark:text-rose-300 font-bold">
                <span>Saldo adeudado actual:</span>
                <span className="text-sm font-black">${selectedDebtor.balance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Monto a Abonar ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedDebtor.balance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl font-black text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  <option value="efectivo">Efectivo en Caja</option>
                  <option value="transferencia">Transferencia / Zelle</option>
                  <option value="tarjeta">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Referencia / N° de Operación
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej. Ref #77881"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedDebtor(null)}
                  className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPayment || payAmount <= 0}
                  className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
                >
                  {savingPayment && <Loader2 size={14} className="animate-spin" />}
                  Registrar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR LÍMITE DE CRÉDITO */}
      {configDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181922] w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Configuración de Crédito
                </h2>
                <p className="text-xs text-gray-400">{configDebtor.name}</p>
              </div>
              <button
                onClick={() => setConfigDebtor(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Límite de Crédito ($)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Estado del Crédito
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl"
                >
                  <option value="active">Activo (Permite compras fiadas)</option>
                  <option value="blocked">Bloqueado (No autorizar más fiados)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setConfigDebtor(null)}
                  className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLimit}
                  className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
                >
                  {savingLimit && <Loader2 size={14} className="animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
