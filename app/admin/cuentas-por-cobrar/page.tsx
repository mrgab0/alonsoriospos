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
} from 'lucide-react';
import {
  getDebtorsSummary,
  registerCustomerCreditPayment,
  updateCustomerCreditSettings,
} from '@/lib/actions/credit';

export default function AdminCuentasPorCobrarPage() {
  const [data, setData] = useState<any>({
    debtors: [],
    history: [],
    totalReceivable: 0,
    debtorsCount: 0,
    overLimitCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'debtors' | 'history'>('debtors');
  const [search, setSearch] = useState('');

  // Modal de Abono
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

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getDebtorsSummary();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (debtor: any) => {
    setSelectedDebtor(debtor);
    setPayAmount(debtor.balance || 0);
    setPaymentMethod('efectivo');
    setReferenceNumber('');
    setNotes('');
  };

  const openConfigModal = (debtor: any) => {
    setConfigDebtor(debtor);
    setNewLimit(debtor.limit || 500);
    setNewStatus(debtor.creditStatus || 'active');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    if (payAmount <= 0) {
      setFeedback({ type: 'error', message: 'El abono debe ser mayor a 0' });
      return;
    }

    setSavingPayment(true);
    const res = await registerCustomerCreditPayment({
      customerId: selectedDebtor._id,
      amount: payAmount,
      paymentMethod,
      referenceNumber,
      notes,
    });
    setSavingPayment(false);

    if (res.success) {
      setSelectedDebtor(null);
      setFeedback({
        type: 'success',
        message: `¡Abono de $${payAmount.toFixed(2)} recibido de ${selectedDebtor.name}! Saldo restante: $${res.data.newBalance.toFixed(2)}`,
      });
      loadData();
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al registrar abono' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configDebtor) return;

    setSavingLimit(true);
    const res = await updateCustomerCreditSettings(configDebtor._id, newLimit, newStatus);
    setSavingLimit(false);

    if (res.success) {
      setConfigDebtor(null);
      setFeedback({
        type: 'success',
        message: `Límites de crédito actualizados para ${configDebtor.name}`,
      });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al actualizar límites' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredDebtors = (data.debtors || []).filter((d: any) => {
    const term = search.toLowerCase();
    return d.name?.toLowerCase().includes(term) || d.phone?.includes(term);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
            <Users size={13} />
            <span>Gestión de Créditos & Cuentas por Cobrar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 dark:text-white">
            Cartera de Clientes Deudores (Fiado)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Monitorea el dinero por cobrar, recibe abonos en caja y gestiona los límites de crédito de clientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/pos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <DollarSign size={15} />
            <span>Abrir Caja POS</span>
          </Link>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Cartera por Cobrar
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            ${(data.totalReceivable || 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">
            Capital en circulación fiado a clientes
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Clientes con Saldo Pendiente
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {data.debtorsCount || 0}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">
            Fichas con balance deudor activo
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Clientes en Sobregiro
            </span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <span
            className={`text-2xl font-black mt-1 block ${
              data.overLimitCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
            }`}
          >
            {data.overLimitCount || 0}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
            {data.overLimitCount > 0 ? 'Superan su límite de crédito' : 'Todos dentro de su cupo'}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'debtors'
                ? 'bg-[#163422] text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Clientes Deudores ({data.debtorsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#163422] text-white shadow-sm'
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

      {/* TABLA: CLIENTES DEUDORES */}
      {activeTab === 'debtors' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="text-xs">Cargando deudores...</span>
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {search
                  ? 'No se encontraron clientes con esa búsqueda'
                  : '¡Excelente! No hay clientes con deudas pendientes de cobro'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4 text-right">Límite Cupo</th>
                    <th className="py-3 px-4 text-right">Saldo Adeudado</th>
                    <th className="py-3 px-4 w-40">Uso del Cupo</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredDebtors.map((d: any) => (
                    <tr key={d._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {d.name || 'Sin Nombre'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        {d.phone || d.email || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-600 dark:text-gray-300">
                        ${(d.limit || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                        ${(d.balance || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                d.isOverLimit
                                  ? 'bg-rose-500'
                                  : d.usagePercent > 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, d.usagePercent)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {d.usagePercent}% consumido
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.creditStatus === 'blocked'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                              : d.isOverLimit
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          }`}
                        >
                          {d.creditStatus === 'blocked'
                            ? 'Bloqueado'
                            : d.isOverLimit
                            ? 'Sobregiro'
                            : 'Activo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openPaymentModal(d)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                          >
                            Cobrar Abono
                          </button>
                          <button
                            onClick={() => openConfigModal(d)}
                            className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            title="Configurar Límite"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABLA: LIBRO DE MOVIMIENTOS (LEDGER) */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {data.history?.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <Receipt size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-bold">No hay transacciones registradas en el libro crediticio</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4 text-center">Tipo de Operación</th>
                    <th className="py-3 px-4">Referencia / Orden</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-right">Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.history.map((it: any) => (
                    <tr key={it._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3.5 px-4 text-gray-500 font-mono">
                        {new Date(it.createdAt).toLocaleDateString()}{' '}
                        {new Date(it.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {it.customerName}
                        </span>
                        {it.customerPhone && (
                          <span className="text-[10px] text-gray-400 font-mono">{it.customerPhone}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            it.type === 'payment'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                          }`}
                        >
                          {it.type === 'payment' ? (
                            <>
                              <TrendingDown size={11} />
                              <span>Abono Recibido</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp size={11} />
                              <span>Venta Fiada (Cargo)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">
                        {it.orderId ? `Orden #${it.orderId}` : it.referenceNumber || it.paymentMethod}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-black ${
                          it.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {it.type === 'payment' ? '-' : '+'} ${(it.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                        ${(it.newBalance || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL COBRAR / REGISTRAR ABONO */}
      {selectedDebtor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-gray-900 dark:text-white">
                    Registrar Cobro / Abono
                  </h3>
                  <span className="text-[11px] text-gray-400">Cliente: {selectedDebtor.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebtor(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha Resumen de Deuda */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs space-y-1">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Teléfono:</span>
                <strong className="font-mono text-gray-900 dark:text-white">
                  {selectedDebtor.phone || 'N/A'}
                </strong>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-black pt-1 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span>Deuda Actual:</span>
                <span>${(selectedDebtor.balance || 0).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    Monto a Cobrar ($) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedDebtor.balance || 0)}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Saldar Totalidad
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedDebtor.balance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Método de Cobro</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="efectivo">Efectivo (Entrada a Caja)</option>
                  <option value="pago_movil_zelle">Pago Móvil / Zelle</option>
                  <option value="tarjeta">Tarjeta Débito / Crédito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  N° Referencia / Comprobante (Opcional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej. REF-441829"
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Notas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre el abono..."
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebtor(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPayment || payAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingPayment && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirmar Ingreso (${payAmount.toFixed(2)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR LÍMITES DE CRÉDITO */}
      {configDebtor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-gray-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Límites de Crédito: {configDebtor.name}
                </h3>
              </div>
              <button
                onClick={() => setConfigDebtor(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfigSubmit} className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Límite de Crédito Permitido ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseFloat(e.target.value) || 0)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Estado para Nuevas Ventas Fiadas
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-bold"
                >
                  <option value="active">Activo (Permitir ventas a crédito)</option>
                  <option value="blocked">Bloqueado (No permitir crédito en POS)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfigDebtor(null)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLimit}
                  className="px-4 py-2 rounded-xl bg-[#163422] text-white font-bold"
                >
                  {savingLimit ? 'Guardando...' : 'Guardar Límite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
