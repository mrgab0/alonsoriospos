'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  Search,
  Plus,
  ArrowRight,
  Loader2,
  X,
  AlertCircle,
  Receipt,
  Layers,
} from 'lucide-react';
import { getPayablesSummary, registerSupplierPayment } from '@/lib/actions/payable';

export default function AdminCuentasPorPagarPage() {
  const [data, setData] = useState<any>({
    invoices: [],
    payments: [],
    totalDue: 0,
    pendingInvoicesCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [search, setSearch] = useState('');

  // Modal de pago
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getPayablesSummary();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPayAmount(invoice.balanceDue || 0);
    setPaymentMethod('transferencia');
    setReferenceNumber('');
    setNotes('');
  };

  const handlePayFull = () => {
    if (selectedInvoice) {
      setPayAmount(selectedInvoice.balanceDue || 0);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (payAmount <= 0) {
      setFeedback({ type: 'error', message: 'El monto debe ser mayor a 0' });
      return;
    }

    setSaving(true);
    const res = await registerSupplierPayment({
      purchaseInvoiceId: selectedInvoice._id,
      amount: payAmount,
      paymentMethod,
      referenceNumber,
      notes,
    });
    setSaving(false);

    if (res.success) {
      setSelectedInvoice(null);
      setFeedback({
        type: 'success',
        message: `¡Pago de $${payAmount.toFixed(2)} registrado con éxito para la factura #${selectedInvoice.invoiceNumber}!`,
      });
      loadData();
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al procesar el pago' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const filteredInvoices = (data.invoices || []).filter((inv: any) => {
    const term = search.toLowerCase();
    return (
      inv.supplierName?.toLowerCase().includes(term) ||
      inv.invoiceNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
            <CreditCard size={13} />
            <span>Gestión de Pasivos & Tesorería</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 dark:text-white">
            Cuentas por Pagar a Proveedores
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Control de facturas a crédito, monitoreo de vencimientos y registro de abonos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/compras"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <FileText size={15} className="text-emerald-500" />
            <span>Nueva Factura / Compra</span>
          </Link>
        </div>
      </div>

      {/* MÉTRICAS DE COMPROMISOS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Deuda Pendiente
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            ${(data.totalDue || 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">
            {data.pendingInvoicesCount || 0} facturas por saldar
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Facturas Vencidas
            </span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <span
            className={`text-2xl font-black mt-1 block ${
              data.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'
            }`}
          >
            {data.overdueCount || 0}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold block mt-1">
            {data.overdueCount > 0 ? 'Requieren pago inmediato' : 'Sin facturas en mora'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Por Vencer (≤ 5 días)
            </span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            {data.upcomingCount || 0}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">Planificar desembolsos</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Abonos Registrados
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {data.payments?.length || 0}
          </span>
          <button
            onClick={() => setActiveTab('history')}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline text-left mt-1"
          >
            Ver comprobantes de pago →
          </button>
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
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-[#163422] text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Facturas Pendientes ({data.pendingInvoicesCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#163422] text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Historial de Abonos ({data.payments?.length || 0})
          </button>
        </div>

        {activeTab === 'pending' && (
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por proveedor o N° factura..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* TABLA: FACTURAS PENDIENTES */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-amber-500" />
              <span className="text-xs">Cargando cuentas por pagar...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                ¡Al día! No hay facturas de proveedores pendientes de pago
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">N° Factura</th>
                    <th className="py-3 px-4">Emisión / Vencimiento</th>
                    <th className="py-3 px-4 text-right">Total Factura</th>
                    <th className="py-3 px-4 text-right">Abonado</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Urgencia</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredInvoices.map((inv: any) => (
                    <tr key={inv._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {inv.supplierName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <span className="text-gray-500 block">
                          Emitida: {new Date(inv.issueDate).toLocaleDateString()}
                        </span>
                        {inv.dueDate && (
                          <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                            Vence: {new Date(inv.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        ${(inv.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">
                        ${(inv.amountPaid || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-amber-600 dark:text-amber-400">
                        ${(inv.balanceDue || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.urgency === 'overdue' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-black">
                            Vencida ({Math.abs(inv.daysDiff)}d)
                          </span>
                        ) : inv.urgency === 'soon' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[10px] font-bold">
                            Por vencer ({inv.daysDiff}d)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-medium">
                            Al día
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                        >
                          Abonar / Pagar
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

      {/* TABLA: HISTORIAL DE ABONOS */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {data.payments?.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <Receipt size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-bold">No hay comprobantes de pago registrados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Fecha Pago</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Factura Asociada</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4 text-right">Monto Pagado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.payments.map((pay: any) => (
                    <tr key={pay._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(pay.paidAt).toLocaleDateString()}{' '}
                        {new Date(pay.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                        {pay.supplierName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-700 dark:text-gray-300">
                        #{pay.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-gray-600 dark:text-gray-400">
                        {pay.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        {pay.referenceNumber || 'S/N'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        ${(pay.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA REGISTRAR PAGO / ABONO */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-gray-900 dark:text-white">
                    Registrar Pago a Proveedor
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Factura #{selectedInvoice.invoiceNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha Resumen de Deuda */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs space-y-1">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Proveedor:</span>
                <strong className="text-gray-900 dark:text-white">{selectedInvoice.supplierName}</strong>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Total Factura:</span>
                <span>${(selectedInvoice.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-300 font-black pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>Saldo Pendiente:</span>
                <span>${(selectedInvoice.balanceDue || 0).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    Monto a Pagar ($) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePayFull}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Pagar Saldo Completo
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.balanceDue}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-base focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo / Caja Chica</option>
                  <option value="zelle_pagomovil">Pago Móvil / Zelle</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta de Débito / Crédito</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  N° de Referencia Bancaria / Comprobante
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej. REF-982341"
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Comentario sobre el desembolso..."
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || payAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirmar Abono (${payAmount.toFixed(2)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
