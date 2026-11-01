"use client";

import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { useCart } from './CartContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const ShoppingCartComponent = () => {
  const pathname = usePathname();
  const isSpanish = pathname?.startsWith("/es");
  const [isOpen, setIsOpen] = useState(false);
  const { cartItems, addToCart, removeFromCart, decreaseFromCart } = useCart();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <>
      {/* Botón activador sincronizado con tema claro y oscuro */}
      <button 
        onClick={() => setIsOpen(true)}
        aria-label={isSpanish ? "Ver Carrito de Compras" : "View Shopping Cart"}
        className="fixed bottom-28 sm:bottom-32 right-5 sm:right-6 z-40 p-3.5 sm:p-4 bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white rounded-full shadow-[0px_8px_25px_rgba(22,52,34,0.35)] dark:shadow-[0px_8px_25px_rgba(0,0,0,0.6)] border-2 border-white/90 dark:border-[#E6C98B]/50 hover:scale-105 transition-all duration-300 active:scale-95 group"
      >
        <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#D4AF37] dark:bg-[#E6C98B] text-stone-950 dark:text-[#0D110F] text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-stone-900 shadow-sm">
            {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Side Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-[#1A1C1C]/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#F9F9F9] dark:bg-[#0D110F] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 flex justify-between items-center border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#141A16]">
              <h2 className="text-2xl font-extrabold text-[#1A1C1C] dark:text-white tracking-tight">{isSpanish ? "Tu Carrito" : "Your Cart"}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-black dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">{isSpanish ? "El carrito está vacío" : "Your cart is empty"}</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.addons)}`} className="relative flex gap-4 p-4 bg-white dark:bg-[#141A16] rounded-xl shadow-[0px_4px_15px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-white/10 items-center">
                    {/* Botón X para eliminar producto */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1A1C1C] dark:text-white text-sm leading-tight">{item.name}</h3>
                      
                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-1 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-1">
                          {item.addons.map((add: any, idx: number) => (
                            <div key={idx} className="text-[10px]">
                              <span className="text-gray-500 dark:text-gray-400 font-medium block">
                                ✨ {add.name || add.value} {add.price ? `(+$${add.price.toFixed(2)})` : ''}
                              </span>
                              {add.customText && (
                                <span className="text-[#FF97A4] italic block pl-2 font-semibold">
                                  💬 "{add.customText}"
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[#FF97A4] font-extrabold mt-1.5">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1E2620] p-1.5 rounded-lg border border-gray-100 dark:border-white/10">
                      <button 
                        onClick={() => decreaseFromCart(item.id)}
                        className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors text-gray-500"
                      >
                        <Minus size={14}/>
                      </button>
                      <span className="text-xs font-bold text-[#1A1C1C] dark:text-white w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors text-gray-500"
                      >
                        <Plus size={14}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#141A16]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">{isSpanish ? "Total Estimado" : "Estimated Total"}</span>
                <span className="text-3xl font-extrabold text-[#1A1C1C] dark:text-white">${total.toFixed(2)}</span>
              </div>
              <Link 
                href={isSpanish ? "/es/checkout" : "/checkout"} 
                onClick={() => setIsOpen(false)}
                className={`w-full bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 py-5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-[#163422]/20 dark:shadow-[0px_4px_25px_rgba(0,0,0,0.6)] flex justify-center items-center gap-2 group ${cartItems.length === 0 ? 'pointer-events-none bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : ''}`}
              >
                {isSpanish ? "Tramitar Pedido" : "Proceed to Checkout"}
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
