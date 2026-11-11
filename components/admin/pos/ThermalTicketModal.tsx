'use client';

import React, { useRef } from 'react';
import { Printer, X, CheckCircle2, Download } from 'lucide-react';

interface ThermalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: {
    orderId: string;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    subtotal?: number;
    discount?: number;
    total: number;
    paymentMethod: string;
    cashReceived?: number;
    changeDue?: number;
    createdAt?: string;
  } | null;
}

export function ThermalTicketModal({ isOpen, onClose, ticketData }: ThermalTicketModalProps) {
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !ticketData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCredit = ticketData.paymentMethod === 'credito_fiado';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra de Controles superior (no se imprime) */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="font-bold text-xs text-gray-900 dark:text-white">
              Venta Registrada Exitosamente
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* ÁREA IMPRIMIBLE DEL TICKET (Estilo 80mm / 58mm térmico) */}
        <div className="overflow-y-auto p-4 flex-1">
          <div
            ref={printAreaRef}
            id="thermal-receipt"
            className="bg-white text-black p-4 font-mono text-[11px] leading-tight border border-gray-200 rounded-xl max-w-[320px] mx-auto shadow-xs print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full"
          >
            {/* Header del Ticket */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400 space-y-1">
              <h2 className="text-base font-black tracking-wider uppercase">VKA POS</h2>
              <p className="text-[10px]">SISTEMA DE FACTURACIÓN & RETAIL</p>
              <p className="text-[9px] text-gray-600">Houston, Texas • Atencion Comercial</p>
            </div>

            {/* Metadatos de la Venta */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>N° FACTURA:</span>
                <strong className="font-bold">{ticketData.orderId}</strong>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>
                  {new Date(ticketData.createdAt || Date.now()).toLocaleDateString()}{' '}
                  {new Date(ticketData.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <strong className="truncate max-w-[170px]">{ticketData.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>CAJERO:</span>
                <span>Caja Mostrador 01</span>
              </div>
            </div>

            {/* Detalle de Artículos */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-200">
                <span>CANT. DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              {ticketData.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start gap-1">
                  <div className="truncate max-w-[210px]">
                    <span className="font-bold mr-1">{it.quantity}x</span>
                    <span>{it.name}</span>
                    <span className="text-[9px] text-gray-500 block">
                      @ ${(it.price || 0).toFixed(2)} c/u
                    </span>
                  </div>
                  <span className="font-bold shrink-0">
                    ${((it.price || 0) * it.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales y Liquidación */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
              {ticketData.discount && ticketData.discount > 0 ? (
                <div className="flex justify-between">
                  <span>DESCUENTO:</span>
                  <span>-${ticketData.discount.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-xs font-black pt-1">
                <span>TOTAL A PAGAR:</span>
                <span className="text-sm">${ticketData.total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-1">
                <span>MÉTODO DE PAGO:</span>
                <strong className="uppercase font-bold">
                  {isCredit ? 'A CRÉDITO (FIADO)' : ticketData.paymentMethod}
                </strong>
              </div>

              {ticketData.paymentMethod === 'efectivo' && ticketData.cashReceived ? (
                <>
                  <div className="flex justify-between">
                    <span>EFECTIVO RECIBIDO:</span>
                    <span>${ticketData.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>CAMBIO / VUELTO:</span>
                    <span>${(ticketData.changeDue || 0).toFixed(2)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Pie del Ticket */}
            <div className="pt-3 text-center space-y-1 text-[9px] text-gray-700">
              {isCredit ? (
                <p className="font-bold border border-black p-1">
                  *** CUENTA POR COBRAR / FIADO ***
                  <br />
                  Firma de conformidad de recepción
                </p>
              ) : (
                <p className="font-semibold">¡GRACIAS POR SU COMPRA!</p>
              )}
              <p>Conserve este ticket para cualquier reclamo o garantía.</p>
              <p className="font-mono text-[8px] text-gray-500">vkapos.com • Facturación POS</p>
            </div>
          </div>
        </div>

        {/* Acciones de Impresión (no se imprimen) */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-100"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <Printer size={15} />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>

      {/* Estilos CSS Globales de Impresión Térmica */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt,
          #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 2mm;
            border: none !important;
            font-size: 11px;
            color: black !important;
            background: white !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
