'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PackagePlus,
  Building2,
  Calendar,
  DollarSign,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Barcode,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { getSuppliers } from '@/lib/actions/supplier';
import { getPurchases, createPurchaseInvoice } from '@/lib/actions/purchase';

export default function AdminComprasPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('create');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Formulario de nueva compra / recepción
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Items en la recepción
  const [items, setItems] = useState<
    Array<{
      productId: string;
      productName: string;
      barcode?: string;
      sku?: string;
      quantity: number;
      costPrice: number;
      subtotal: number;
    }>
  >([]);

  // Búsqueda de productos en la base de datos
  const [productSearch, setProductSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [suppRes, purRes, prodRes] = await Promise.all([
      getSuppliers(),
      getPurchases(),
      fetch('/api/products?limit=200').then((r) => r.json()).catch(() => ({ data: [] })),
    ]);

    if (suppRes.success && suppRes.data) setSuppliers(suppRes.data);
    if (purRes.success && purRes.data) setPurchases(purRes.data);
    if (prodRes && prodRes.data) setProducts(prodRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Manejo de cambio de proveedor (auto calcular fecha de vencimiento según días de crédito)
  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSupplierId(sId);
    const supp = suppliers.find((s) => s._id === sId);
    if (supp && supp.creditTermsDays > 0) {
      setIsCredit(true);
      const d = new Date();
      d.setDate(d.getDate() + supp.creditTermsDays);
      setDueDate(d.toISOString().split('T')[0]);
    } else {
      setIsCredit(false);
      setDueDate('');
    }
  };

  // Agregar producto a la lista de recepción
  const handleAddProduct = (prod: any) => {
    const existingIndex = items.findIndex((it) => it.productId === prod._id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal =
        Math.round(updated[existingIndex].quantity * updated[existingIndex].costPrice * 100) / 100;
      setItems(updated);
    } else {
      const defaultCost = prod.costPrice || 0;
      setItems([
        ...items,
        {
          productId: prod._id,
          productName: prod.name,
          barcode: prod.barcode || '',
          sku: prod.sku || '',
          quantity: 1,
          costPrice: defaultCost,
          subtotal: defaultCost,
        },
      ]);
    }
    setProductSearch('');
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'costPrice', val: number) => {
    const updated = [...items];
    updated[index][field] = Math.max(0, val);
    updated[index].subtotal =
      Math.round(updated[index].quantity * updated[index].costPrice * 100) / 100;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Cálculos de totales
  const subtotal = Math.round(items.reduce((acc, it) => acc + it.subtotal, 0) * 100) / 100;
  const total = subtotal;

  // Si no es a crédito, el monto pagado es igual al total
  useEffect(() => {
    if (!isCredit) {
      setAmountPaid(total);
    }
  }, [total, isCredit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setFeedback({ type: 'error', message: 'Ingresa el número de factura del proveedor' });
      return;
    }
    if (!selectedSupplierId) {
      setFeedback({ type: 'error', message: 'Selecciona el proveedor que despacha' });
      return;
    }
    if (items.length === 0) {
      setFeedback({ type: 'error', message: 'Debes añadir al menos un producto a la recepción' });
      return;
    }

    const supp = suppliers.find((s) => s._id === selectedSupplierId);

    setSaving(true);
    const res = await createPurchaseInvoice({
      invoiceNumber,
      supplierId: selectedSupplierId,
      supplierName: supp?.name || 'Proveedor General',
      issueDate,
      dueDate: isCredit ? dueDate : undefined,
      status: isCredit && amountPaid < total ? (amountPaid > 0 ? 'partially_paid' : 'pending') : 'paid',
      items,
      subtotal,
      total,
      amountPaid,
      notes,
    });
    setSaving(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `¡Mercancía recepcionada con éxito! Inventario actualizado (${items.length} productos).`,
      });
      // Limpiar formulario
      setInvoiceNumber('');
      setItems([]);
      setNotes('');
      loadData();
      setActiveTab('list');
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al procesar la recepción' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const filteredSearchProducts = products
    .filter((p) => {
      const q = productSearch.toLowerCase().trim();
      if (!q) return false;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
            <PackagePlus size={13} />
            <span>Recepción de Mercancía & Kardex</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 dark:text-white">
            Compras & Entrada de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Registra facturas de proveedores. El stock se sumará de inmediato y actualizará los costos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-[#163422] text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            + Nueva Recepción
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-[#163422] text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Historial de Facturas
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

      {/* TAB 1: FORMULARIO DE NUEVA RECEPCIÓN */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CABECERA DE LA FACTURA */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <FileText size={16} className="text-emerald-600" />
              <span>1. Datos de la Factura de Proveedor</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Proveedor Emisor <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={handleSupplierChange}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.creditTermsDays > 0 ? `(${s.creditTermsDays} días crédito)` : '(Contado)'}
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/admin/proveedores"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    title="Administrar Proveedores"
                  >
                    <Building2 size={16} />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  N° de Factura / Comprobante <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ej. FAC-2026-0891"
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Fecha de Emisión</label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* SELECTOR Y TABLA DE PRODUCTOS A INGRESAR */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <span>2. Artículos a Recepcionar (Sumará Existencias)</span>
              </h2>

              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {items.length} {items.length === 1 ? 'artículo' : 'artículos'} agregados
              </span>
            </div>

            {/* Búsqueda rápida de producto */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Escribe el nombre del producto, código de barras o SKU para añadirlo..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs font-medium focus:outline-none focus:border-blue-500 dark:text-white"
              />

              {/* Resultados desplegables */}
              {filteredSearchProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-20 divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredSearchProducts.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => handleAddProduct(p)}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-xs text-gray-900 dark:text-white block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Stock actual: {p.stock || 0} • Costo previo: ${(p.costPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={12} />
                        <span>Agregar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de Items */}
            {items.length === 0 ? (
              <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-2">
                <Barcode size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-xs font-bold">No hay productos en esta recepción</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Usa el buscador superior para seleccionar los artículos de la factura de compra.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 w-32">Cantidad a Sumar</th>
                      <th className="py-2.5 px-3 w-32">Costo Unit. ($)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map((it, idx) => (
                      <tr key={it.productId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="py-3 px-3">
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {it.productName}
                          </span>
                          {it.barcode && (
                            <span className="text-[10px] font-mono text-gray-400">
                              Barcode: {it.barcode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 0)
                            }
                            className="w-24 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-center"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.costPrice}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'costPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-24 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-center"
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                          ${it.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CONDICIONES DE PAGO Y TOTALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 text-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Clock size={16} className="text-amber-500" />
                <span>3. Términos de Pago & Factura Pendiente</span>
              </h2>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 dark:text-gray-200">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={!isCredit}
                    onChange={() => setIsCredit(false)}
                    className="accent-emerald-600"
                  />
                  <span>Contado (Pagado Totalmente)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 dark:text-gray-200">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={isCredit}
                    onChange={() => setIsCredit(true)}
                    className="accent-amber-600"
                  />
                  <span>Crédito (Factura por Pagar)</span>
                </label>
              </div>

              {isCredit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">
                      Fecha Límite / Vencimiento
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">
                      Monto Abonado Hoy ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre el lote, número de guía del transportista, etc."
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* RESUMEN TOTAL Y BOTÓN DE CONFIRMACIÓN */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3">
                  Resumen de la Factura de Compra
                </h3>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal Mercancía:</span>
                  <span className="font-bold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Total Factura:</span>
                  <span className="text-xl text-emerald-600">${total.toFixed(2)}</span>
                </div>

                {isCredit && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                    <div className="flex justify-between text-amber-800 dark:text-amber-200">
                      <span>Abono inmediato:</span>
                      <span className="font-bold">${amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-amber-900 dark:text-amber-100">
                      <span>Saldo Pendiente por Pagar:</span>
                      <span>${Math.max(0, total - amountPaid).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving || items.length === 0}
                className="w-full py-3.5 rounded-2xl bg-[#163422] hover:bg-[#1E432C] text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                <span>Guardar Factura & Aumentar Stock</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: HISTORIAL DE COMPRAS */}
      {activeTab === 'list' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Registro Histórico de Recepciones & Facturas de Compra
          </h2>

          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="text-xs">Cargando facturas de compra...</span>
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <PackagePlus size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-bold">No hay recepciones registradas todavía</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Factura N°</th>
                    <th className="py-2.5 px-3">Proveedor</th>
                    <th className="py-2.5 px-3">Artículos</th>
                    <th className="py-2.5 px-3 text-right">Total Factura</th>
                    <th className="py-2.5 px-3 text-right">Saldo Deuda</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {purchases.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-3 text-gray-500">
                        {new Date(p.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                        {p.supplierName}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {p.items?.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0)} unidades (
                        {p.items?.length || 0} items)
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                        ${(p.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black">
                        {p.balanceDue > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            ${p.balanceDue.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">$0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : p.status === 'partially_paid'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {p.status === 'paid'
                            ? 'Pagado'
                            : p.status === 'partially_paid'
                            ? 'Abonado'
                            : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
