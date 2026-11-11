'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Barcode,
  Camera,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  User,
  Phone,
  Tag,
  ArrowRight,
  Layers,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { searchPOSProducts, processPOSSale, POSSaleItem } from '@/lib/actions/pos';
import { CameraBarcodeScannerModal } from '@/components/admin/pos/CameraBarcodeScannerModal';
import { ThermalTicketModal } from '@/components/admin/pos/ThermalTicketModal';

export default function AdminPOSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Carrito de Venta
  const [cart, setCart] = useState<POSSaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  // Cobro
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'credito_fiado'>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // Proceso y Ticket
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState<any | null>(null);

  // Lector de código de barras físico (captura teclado global)
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());

  const loadProducts = async (term = '') => {
    setLoading(true);
    const res = await searchPOSProducts(term);
    if (res.success && res.data) {
      setProducts(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Escucha automática de pistola lectora de código de barras USB
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en un input o textarea normal, no interferir
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        const barcode = barcodeBufferRef.current.trim();
        if (barcode.length >= 3) {
          handleBarcodeScanned(barcode);
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleBarcodeScanned = (scannedBarcode: string) => {
    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === scannedBarcode.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === scannedBarcode.toLowerCase())
    );

    if (match) {
      addToCart(match);
      setFeedback({ type: 'success', message: `Añadido: ${match.name}` });
      setTimeout(() => setFeedback(null), 2500);
    } else {
      // Buscar en BD
      searchPOSProducts(scannedBarcode).then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          addToCart(res.data[0]);
          setFeedback({ type: 'success', message: `Añadido: ${res.data[0].name}` });
          setTimeout(() => setFeedback(null), 2500);
        } else {
          setFeedback({
            type: 'error',
            message: `Código no registrado: ${scannedBarcode}`,
          });
          setTimeout(() => setFeedback(null), 3500);
        }
      });
    }
  };

  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex((it) => it.productId === product._id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price: product.price || 0,
          quantity: 1,
          barcode: product.barcode,
          sku: product.sku,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
    } else {
      updated[index].quantity = newQty;
      setCart(updated);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('¿Vaciar carrito de venta?')) {
      setCart([]);
      setDiscount(0);
    }
  };

  // Cálculos de Totales
  const subtotal = Math.round(cart.reduce((acc, it) => acc + it.price * it.quantity, 0) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  const changeDue = Math.max(0, Math.round((cashReceived - total) * 100) / 100);

  const openCheckoutModal = (method: typeof paymentMethod) => {
    setPaymentMethod(method);
    if (method === 'efectivo') {
      setCashReceived(total);
    }
    setIsCheckoutOpen(true);
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'credito_fiado') {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert('Para vender a crédito / fiado es obligatorio Nombre y Teléfono');
        return;
      }
    }

    setProcessing(true);
    const res = await processPOSSale({
      items: cart,
      subtotal,
      discount,
      tax: 0,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? cashReceived : total,
      changeDue: paymentMethod === 'efectivo' ? changeDue : 0,
      paymentRef,
      customerName: customerName.trim() || 'Cliente Mostrador',
      customerPhone: customerPhone.trim() || 'N/A',
    });
    setProcessing(false);

    if (res.success && res.data) {
      setIsCheckoutOpen(false);
      setTicketData({
        orderId: res.data.orderId,
        customerName: res.data.customerName,
        items: res.data.items,
        subtotal,
        discount,
        total,
        paymentMethod,
        cashReceived: paymentMethod === 'efectivo' ? cashReceived : undefined,
        changeDue: paymentMethod === 'efectivo' ? changeDue : undefined,
        createdAt: res.data.createdAt,
      });
      setTicketModalOpen(true);
      setCart([]);
      setDiscount(0);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentRef('');
      loadProducts(search);
    } else {
      alert(res.error || 'Error al procesar la venta');
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* HEADER POS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md">
            POS
          </div>
          <div>
            <h1 className="font-serif font-black text-lg text-gray-900 dark:text-white leading-tight">
              Terminal de Venta en Mostrador
            </h1>
            <span className="text-[10px] text-gray-400 font-medium">
              VKA POS • Modo Caja Rápida & Lector de Códigos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Lector con Cámara del Teléfono */}
          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all shadow-xs"
          >
            <Camera size={15} />
            <span>Escanear con Cámara</span>
          </button>

          <Link
            href="/admin/ordenes"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Ver Ventas
          </Link>
        </div>
      </div>

      {/* FEEDBACK POPUP */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* DISPOSICIÓN EN 2 COLUMNAS: CATÁLOGO IZQ. / CARRITO DER. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMNA IZQUIERDA: BÚSQUEDA Y CUADRÍCULA DE ARTÍCULOS */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Búsqueda rápida */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                loadProducts(e.target.value);
              }}
              placeholder="Buscar producto o escanear código de barras (Foco automático)..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-sm dark:text-white"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  loadProducts('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cuadrícula de Productos */}
          {loading ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="text-xs">Cargando inventario...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-2">
              <Barcode size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-bold">No se encontraron productos con esa búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {products.map((p) => (
                <div
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer active:scale-95 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">
                        {p.category || 'Retail'}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          (p.stock || 0) > 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        Stock: {p.stock || 0}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                      {p.name}
                    </h4>

                    {p.barcode && (
                      <span className="text-[9px] font-mono text-gray-400 flex items-center gap-1">
                        <Barcode size={10} />
                        {p.barcode}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      ${(p.price || 0).toFixed(2)}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      +
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: CARRITO Y LIQUIDACIÓN EN CAJA */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Ticket de Venta Actual
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Lista de Items en Carrito */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <ShoppingCart size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-xs font-bold">El ticket está vacío</p>
                  <p className="text-[10px]">Escanea un código o pulsa un producto a la izquierda</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate max-w-[140px]">
                      <span className="font-bold text-gray-900 dark:text-white block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ${item.price.toFixed(2)} c/u
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center font-bold shadow-2xs hover:bg-gray-200"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center font-black text-gray-900 dark:text-white text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center font-bold shadow-2xs hover:bg-gray-200"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <span className="font-black text-gray-900 dark:text-white shrink-0 text-xs w-16 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TOTALES Y ACCIONES DE COBRO */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-gray-500">
                <span>Descuento ($):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-20 p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-right font-bold text-xs"
                />
              </div>

              <div className="flex justify-between text-base font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>Total a Cobrar:</span>
                <span className="text-2xl text-emerald-600 dark:text-emerald-400">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* BOTONES DE MÉTODO DE PAGO RÁPIDO */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => openCheckoutModal('efectivo')}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all"
              >
                <DollarSign size={16} />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => openCheckoutModal('tarjeta')}
                className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all"
              >
                <CreditCard size={16} />
                <span>Tarjeta</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => openCheckoutModal('transferencia')}
                className="py-3 px-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all"
              >
                <RefreshCw size={14} />
                <span>Pago Móvil / Zelle</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => openCheckoutModal('credito_fiado')}
                className="py-3 px-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all"
              >
                <Clock size={15} />
                <span>A Crédito (Fiado)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE FINALIZACIÓN DE COBRO */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-600" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Confirmar Cobro • ${total.toFixed(2)}
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Resumen del Método Seleccionado */}
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 text-xs font-bold flex justify-between items-center">
                <span>Método de Cobro:</span>
                <span className="uppercase text-emerald-600 dark:text-emerald-400 font-black">
                  {paymentMethod === 'credito_fiado' ? 'A Crédito / Fiado' : paymentMethod}
                </span>
              </div>

              {/* Si es efectivo: Calculadora de Vuelto */}
              {paymentMethod === 'efectivo' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-800 dark:text-gray-200">
                      Efectivo Recibido ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={total}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                      className="w-28 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-gray-800 text-right font-black text-sm"
                    />
                  </div>

                  {/* Botones de montos rápidos */}
                  <div className="flex gap-1.5 pt-1">
                    {[total, 10, 20, 50, 100].filter((v, i, a) => a.indexOf(v) === i && v >= total).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashReceived(val)}
                        className="flex-1 py-1 px-2 rounded-lg bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-800 font-bold text-[11px] text-emerald-800 dark:text-emerald-200"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-emerald-200 dark:border-emerald-900">
                    <span>Cambio / Vuelto:</span>
                    <span className="text-base text-emerald-700 dark:text-emerald-300">
                      ${changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Si es Crédito (Fiado): Campos de Cliente */}
              {paymentMethod === 'credito_fiado' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2.5">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block text-[11px]">
                    Identificación del Cliente Deudor:
                  </span>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. Roberto Sánchez"
                      className="p-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-gray-800 font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 555-0123"
                      className="p-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-gray-800 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Referencia opcional para tarjeta/transferencia */}
              {(paymentMethod === 'tarjeta' || paymentMethod === 'transferencia') && (
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    N° de Referencia / Aprobación (Opcional)
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Ej. Lote 04 - Ref 98234"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleProcessSale}
                  className="px-5 py-2.5 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white font-bold flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {processing && <Loader2 size={14} className="animate-spin" />}
                  <span>Completar Venta & Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CÁMARA */}
      <CameraBarcodeScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* MODAL DE IMPRESIÓN DE TICKET TÉRMICO */}
      <ThermalTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        ticketData={ticketData}
      />
    </div>
  );
}
