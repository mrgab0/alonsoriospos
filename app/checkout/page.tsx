"use client";

import { useCart } from "@/components/shop/Cart/CartContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createOrder } from "@/lib/actions/order";
import { saveAbandonedCartAction, restoreAbandonedCartAction } from "@/lib/actions/abandonedCart";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { DEFAULT_DELIVERY_OPTIONS, DeliveryOption } from "@/lib/deliveryOptions";
import { getDeliveryOptions } from "@/lib/actions/delivery";
import { validateCoupon, checkAutoLaunchCoupon } from "@/lib/actions/coupon";
import { getPaymentConfigs } from "@/lib/actions/paymentConfig";
import { logAnalyticsEventAction } from "@/lib/actions/analytics";
import { CustomerBiometricModal } from "@/components/auth/CustomerBiometricModal";
import { Zap, Rocket, Truck, Sun, Clock, Moon, Store, ShieldCheck, CheckCircle2, Ticket, Sparkles, Tag, AlertCircle, Copy, ExternalLink, QrCode, MessageSquare, Heart, Fingerprint } from "lucide-react";


const PaymentLogos = {
  zelle: <svg viewBox="0 0 38 24" width="38" height="24" className="w-8 h-auto"><path d="M0 0h38v24H0z" fill="#6d2277"/><path d="M10 5h18v3l-10 8h10v5H10v-3l10-8H10z" fill="#fff"/></svg>,
  cashapp: <svg viewBox="0 0 38 24" width="38" height="24" className="w-8 h-auto"><rect width="38" height="24" fill="#00D632"/><path d="M19 6v12M14 9h7a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
  paypal: <svg viewBox="0 0 38 24" width="38" height="24" className="w-8 h-auto"><path d="M0 0h38v24H0z" fill="#003087"/><path d="M10 5h18v14H10z" fill="#009cde"/></svg>,
  square: <svg viewBox="0 0 38 24" width="38" height="24" className="w-8 h-auto"><rect width="38" height="24" fill="#000000" rx="4"/><rect x="11" y="7" width="16" height="10" rx="2" fill="#fff"/></svg>,
  efectivo: <svg viewBox="0 0 38 24" width="38" height="24" className="w-8 h-auto"><rect width="38" height="24" fill="#22C55E" rx="4"/><circle cx="19" cy="12" r="5" fill="#fff"/></svg>
};

const iconMap: Record<string, any> = {
  Zap: Zap,
  Rocket: Rocket,
  Truck: Truck,
  Sun: Sun,
  Clock: Clock,
  Moon: Moon,
  Store: Store,
};

import dynamic from "next/dynamic";

const DeliveryMapPicker = dynamic(
  () => import("@/components/shop/DeliveryMapPicker").then((mod) => mod.DeliveryMapPicker),
  { ssr: false }
);

function CheckoutContent() {
  const { cartItems, clearCart, updateAddonCustomText, restoreCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [deliveryOptionsList, setDeliveryOptionsList] = useState<DeliveryOption[]>(DEFAULT_DELIVERY_OPTIONS);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [currentCartToken, setCurrentCartToken] = useState<string>("");
  const [recoveredCartBanner, setRecoveredCartBanner] = useState<string | null>(null);

  // Estado de Ubicación y Distancia por Millas
  const [deliveryLocation, setDeliveryLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
    distanceMiles: number;
    googleMapsUrl: string;
  }>({
    address: "",
    lat: 29.7027,
    lng: -95.2936,
    distanceMiles: 0,
    googleMapsUrl: "https://maps.google.com",
  });

  const [isMounted, setIsMounted] = useState(false);

  // Estados para datos de contacto
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cardMessage, setCardMessage] = useState("");

  // Estados para Cupones y Pagos
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [autoLaunchInfo, setAutoLaunchInfo] = useState<{ isAvailable: boolean; orderIndex?: number; coupon?: any } | null>(null);
  
  // Datos de Configuración de Cuentas de Pago
  const [paymentConfigs, setPaymentConfigs] = useState<Record<string, any>>({});
  const [copiedText, setCopiedText] = useState("");

  useEffect(() => {
    async function loadOptionsAndCoupon() {
      const { data } = await getDeliveryOptions();
      if (data && data.length > 0) {
        setDeliveryOptionsList(data);
      }

      const payRes = await getPaymentConfigs();
      if (payRes.success && payRes.data) {
        setPaymentConfigs(payRes.data);
      }

      const autoRes = await checkAutoLaunchCoupon();
      if (autoRes.success && autoRes.isAutoAvailable && autoRes.coupon) {
        setAutoLaunchInfo({
          isAvailable: true,
          orderIndex: autoRes.orderIndex,
          coupon: autoRes.coupon
        });
        setAppliedCoupon(autoRes.coupon);
        setCouponSuccess(`🎁 ¡Felicidades! Eres el cliente #${autoRes.orderIndex} de inauguración. Cupón del ${autoRes.coupon.discountValue}% OFF aplicado automáticamente.`);
      }
    }
    loadOptionsAndCoupon();

    const savedName = localStorage.getItem("customerName") || "";
    const savedEmail = localStorage.getItem("customerEmail") || "";
    const savedPhone = localStorage.getItem("customerPhone") || "";
    const savedAddress = localStorage.getItem("customerAddress") || "";
    
    setName(savedName);
    setEmail(savedEmail);
    setPhone(savedPhone);
    setAddress(savedAddress);
    setIsMounted(true);

    if (cartItems.length > 0) {
      logAnalyticsEventAction({
        type: "cart_abandon",
        path: "/checkout",
        customerName: savedName,
        customerPhone: savedPhone,
        price: subtotal,
        cartItems: cartItems.map((i) => ({ productId: i.id, name: i.name, price: i.price, image: i.image }))
      });
    }
  }, [cartItems]);

  // 1. Restaurar carrito si el cliente hace clic en el link de correo (?recover=[cartToken])
  useEffect(() => {
    const recoverToken = searchParams.get("recover");
    if (!recoverToken) return;

    async function handleRecoverCart() {
      try {
        const res = await restoreAbandonedCartAction(recoverToken!);
        if (res.success && res.data) {
          const cart = res.data;
          setCurrentCartToken(cart.cartToken);
          if (cart.customerEmail) setEmail(cart.customerEmail);
          if (cart.customerName) setName(cart.customerName);
          if (cart.customerPhone) setPhone(cart.customerPhone);
          if (cart.items && cart.items.length > 0 && restoreCart) {
            restoreCart(cart.items);
          }
          setRecoveredCartBanner(
            `🌸 ¡Bienvenido de nuevo${cart.customerName ? `, ${cart.customerName}` : ""}! Hemos recuperado tu carrito para que continúes tu orden con total comodidad.`
          );
        }
      } catch (err) {
        console.error("Error restaurando carrito abandonado:", err);
      }
    }

    handleRecoverCart();
  }, [searchParams, restoreCart]);


  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 3000);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Cálculo del Descuento del Cupón
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Subtotal Imponible tras Descuento
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);

  // Impuestos de Ley (Sales Tax 8.25%) sumados Adicionalmente al Subtotal Imponible
  const taxAmount = Math.round(taxableSubtotal * 0.0825 * 100) / 100;

  // Cálculo dinámico de tarifa por milla según la opción seleccionada (Millas × $/milla, sin precio base)
  const calcOptionFee = (opt: DeliveryOption) => {
    if (opt.id === "pickup") return 0;
    const miles = deliveryLocation?.distanceMiles || 0;
    const perMile = Number(opt.pricePerMile || 0);
    const totalFee = miles * perMile;
    return Math.round(totalFee * 100) / 100;
  };

  const deliveryFee = selectedDelivery ? calcOptionFee(selectedDelivery) : 0;

  // Total Final = Subtotal Imponible + Sales Tax (8.25%) + Envío
  const finalTotal = taxableSubtotal + taxAmount + deliveryFee;

  // 2. Guardado automático (Debounce) del carrito abandonado al escribir datos de contacto
  useEffect(() => {
    if (!email || !email.includes("@") || cartItems.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        const res = await saveAbandonedCartAction({
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
          items: cartItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            addons: i.addons,
          })),
          subtotal: finalTotal,
          stepReached: selectedPayment
            ? "payment_method"
            : selectedDelivery
            ? "delivery_selected"
            : "customer_info",
        });

        if (res.success && res.cartToken) {
          setCurrentCartToken(res.cartToken);
          if (typeof window !== "undefined") {
            localStorage.setItem("currentCartToken", res.cartToken);
          }
        }
      } catch (err) {
        // Silencioso para no interferir con la navegación del usuario
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [email, name, phone, cartItems, finalTotal, selectedDelivery, selectedPayment]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (!couponInput.trim()) return;

    const res = await validateCoupon(couponInput, subtotal);
    if (res.success && res.coupon) {
      setAppliedCoupon(res.coupon);
      setCouponSuccess(`¡Cupón "${res.coupon.code}" aplicado con éxito!`);
      setCouponInput("");
    } else {
      setCouponError(res.error || "Código de cupón inválido.");
    }
  };

  const rawPaymentMethods = [
    { id: "zelle", label: "Zelle" },
    { id: "cashapp", label: "CashApp" },
    { id: "paypal", label: "PayPal" },
    { id: "square", label: "Square (Tarjeta)" },
    { id: "efectivo", label: "Efectivo" },
  ];

  const paymentMethods = rawPaymentMethods.filter((method) => {
    const cfg = paymentConfigs[method.id];
    return !cfg || cfg.isActive !== false;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedDelivery) {
      alert("Por favor selecciona una Opción de Entrega para completar tu pedido.");
      return;
    }

    setLoading(true);

    const data = new FormData(e.currentTarget);
    const activeCartToken =
      currentCartToken ||
      (typeof window !== "undefined" ? localStorage.getItem("currentCartToken") : "") ||
      undefined;

    const orderData = {
      customerName: data.get("name")?.toString() || "",
      customerEmail: data.get("email")?.toString() || "",
      customerPhone: data.get("phone")?.toString() || "",
      address: deliveryLocation.address || data.get("address")?.toString() || address,
      destLat: deliveryLocation.lat,
      destLng: deliveryLocation.lng,
      distanceMiles: deliveryLocation.distanceMiles,
      googleMapsUrl: deliveryLocation.googleMapsUrl,
      deliveryMethod: `${selectedDelivery.title} (${selectedDelivery.estimatedTimeLabel})`,
      deliveryFee: deliveryFee,
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      discountAmount: discountAmount,
      taxAmount: taxAmount,
      cardMessage: data.get("cardMessage")?.toString() || cardMessage || "",
      paymentMethod: data.get("paymentMethod")?.toString() || "",
      paymentRef: data.get("paymentRef")?.toString() || "N/A",
      items: cartItems,
      total: finalTotal,
      cartToken: activeCartToken,
    };

    const existingOrderId = localStorage.getItem("lastOrderId") || undefined;
    const result = await createOrder(orderData, existingOrderId);
    
    if (result.success) {
      clearCart();
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentCartToken");
      }
      localStorage.setItem("lastOrderId", result.orderId);
      localStorage.setItem("customerName", orderData.customerName);
      localStorage.setItem("customerEmail", orderData.customerEmail);
      localStorage.setItem("customerPhone", orderData.customerPhone);
      localStorage.setItem("customerAddress", orderData.address);

      const isSpanish = typeof window !== "undefined" && window.location.pathname.startsWith("/es");
      router.push(isSpanish ? `/es/checkout/confirmacion?orderId=${result.orderId}` : `/checkout/confirmacion?orderId=${result.orderId}`);
    } else {
      alert("Error al procesar pedido");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0B0C10] text-stone-900 dark:text-[#E6F7F0] flex flex-col transition-colors duration-300">
      <ShopHeader />

      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-8">
          
          {/* Banner de Carrito Abandonado Recuperado */}
          {recoveredCartBanner && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900 text-sm shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="font-medium">{recoveredCartBanner}</p>
              </div>
              <button
                type="button"
                onClick={() => setRecoveredCartBanner(null)}
                className="text-xs text-emerald-700 hover:text-emerald-950 font-bold ml-4 px-2 py-1 bg-white/70 rounded-lg transition-colors"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-stone-800 pb-6 gap-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-stone-900 dark:text-white">Finalizar Pedido</h1>
              <p className="text-xs text-gray-400 dark:text-stone-400">Selecciona tu método de entrega y completa tus datos</p>
            </div>
            <span className="bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full border border-green-200 dark:border-emerald-800/60 flex items-center gap-1.5">
              <ShieldCheck size={16} /> Pago Seguro Encriptado
            </span>
          </div>
          
          <div className="grid md:grid-cols-12 gap-8">
            
            {/* FORMULARIO DE DATOS Y SELECCIÓN DE ENTREGA */}
            <div className="md:col-span-7 bg-white dark:bg-[#12131A] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-stone-800 space-y-8">
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Datos de Contacto + Acceso Biométrico */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                      1. Información del Cliente
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsBioModalOpen(true)}
                      className="bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <Fingerprint size={14} />
                      <span>Ingresar con Huella 👆</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input 
                      name="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Nombre y Apellido Completo *" 
                      className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF97A4] font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder:text-gray-400" 
                      required 
                    />
                    <input 
                      type="email"
                      name="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="Correo Electrónico del Cliente *" 
                      className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF97A4] font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder:text-gray-400" 
                      required 
                    />
                    <input 
                      name="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="Teléfono / WhatsApp de Contacto *" 
                      className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF97A4] font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder:text-gray-400" 
                      required 
                    />
                    <DeliveryMapPicker
                      initialAddress={address}
                      onLocationChange={(locData) => {
                        setAddress(locData.address);
                        setDeliveryLocation(locData);
                      }}
                    />
                  </div>
                </div>

                {/* 1.5 Mensaje para la Tarjeta de Dedicatoria Incluida */}
                <div className="space-y-3 bg-pink-50/60 dark:bg-pink-950/20 p-4 rounded-2xl border border-pink-100/80 dark:border-pink-900/30">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF97A4] flex items-center gap-1.5">
                      <Heart size={14} className="text-[#FF97A4] fill-[#FF97A4]" /> Tarjeta de Dedicatoria Impresa (Gratis Incluida)
                    </h2>
                    <span className="bg-[#FF97A4] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Incluido 🎁
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-stone-400 font-medium leading-relaxed">
                    Escribe a continuación el mensaje especial que deseas que imprimamos en la tarjeta de regalo de tu arreglo floral:
                  </p>
                  <textarea
                    name="cardMessage"
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="Ej: ¡Feliz Cumpleaños María! Deseo que este día esté lleno de amor y alegría. Con todo mi cariño, Carlos. ❤️"
                    className="w-full p-3.5 border border-pink-200 dark:border-pink-900/50 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF97A4] h-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>

                {/* 2. Selector de Opciones de Entrega */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                      2. Opción y Horario de Entrega
                    </h2>
                    <span className="text-xs font-bold text-[#FF97A4]">{deliveryOptionsList.length} opciones disponibles</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {deliveryOptionsList.map((option, index) => {
                      const IconComponent = iconMap[option.iconName] || Truck;
                      const isSelected = selectedDelivery ? ((selectedDelivery.id && selectedDelivery.id === option.id) || selectedDelivery.title === option.title) : false;
                      const optionPrice = calcOptionFee(option);

                      return (
                        <label
                          key={option.id || (option as any)._id || `delivery-${index}`}
                          onClick={() => setSelectedDelivery(option)}
                          className={`relative flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#FF97A4] bg-[#FF97A4]/5 shadow-sm"
                              : "border-gray-100 dark:border-stone-800 hover:border-gray-200 dark:hover:border-stone-700 bg-white dark:bg-[#181922]"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-xl ${isSelected ? "bg-[#FF97A4] text-white" : "bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-300"}`}>
                              <IconComponent size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#1A1C1C] dark:text-white">{option.title}</span>
                                {option.badge && (
                                  <span className="bg-[#163422] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm border border-[#D4AF37]/50">
                                    {option.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                                <span className="font-bold text-gray-500">
                                  ⏱️ <strong className="text-gray-800 dark:text-stone-200">{option.estimatedTimeLabel}</strong>
                                </span>
                                {isMounted && option.id !== "pickup" && (
                                  <span suppressHydrationWarning className="text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-100 dark:border-purple-900/50">
                                    📍 {deliveryLocation?.distanceMiles || 0} mi × ${Number(option.pricePerMile || 0).toFixed(2)}/mi = ${optionPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-3">
                            <span suppressHydrationWarning className={`text-sm font-extrabold block ${optionPrice > 0 ? "text-[#FF97A4]" : "text-green-600"}`}>
                              {option.id === "pickup"
                                ? "Gratis"
                                : optionPrice > 0
                                  ? `+$${optionPrice.toFixed(2)} USD`
                                  : (deliveryLocation?.distanceMiles || 0) > 0
                                    ? "Gratis"
                                    : "$0.00 USD"}
                            </span>
                            {isSelected && (
                              <CheckCircle2 size={18} className="text-[#FF97A4] ml-auto mt-1" />
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Información de Pago */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b pb-2">
                    3. Método de Pago
                  </h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <label 
                        key={method.id} 
                        className={`relative flex flex-col items-center p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                          selectedPayment === method.id
                            ? 'border-[#FF97A4] bg-[#FF97A4]/5 shadow-sm'
                            : 'border-gray-100 dark:border-stone-800 hover:border-gray-200 dark:hover:border-stone-700 bg-white dark:bg-[#181922]'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value={method.id} 
                          className="peer sr-only" 
                          required 
                          onChange={() => setSelectedPayment(method.id)}
                        />
                        <div className="mb-1.5">
                          {PaymentLogos[method.id as keyof typeof PaymentLogos]}
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-stone-300 uppercase">{method.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* TARJETA DESPLEGABLE CON DATOS DE PAGO Y CÓDIGO QR */}
                  {selectedPayment && (
                    <div className="bg-gray-50 dark:bg-[#181922] p-5 rounded-2xl border border-gray-200 dark:border-stone-800 space-y-4 animate-in fade-in duration-300">
                      {(() => {
                        const cfg = paymentConfigs[selectedPayment] || {};
                        const detailToCopy = cfg.accountDetail || cfg.linkUrl || "";

                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-xs text-gray-400 dark:text-stone-400 uppercase tracking-wider block">
                                  Instrucciones de Pago ({cfg.title || selectedPayment})
                                </span>
                                {cfg.holderName && (
                                  <span className="font-bold text-sm text-[#1A1C1C] dark:text-white block mt-0.5">
                                    Titular: {cfg.holderName}
                                  </span>
                                )}
                              </div>

                              {detailToCopy && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(detailToCopy)}
                                  className="bg-white dark:bg-stone-800 border dark:border-stone-700 text-gray-700 dark:text-stone-200 hover:text-[#FF97A4] hover:border-[#FF97A4] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <Copy size={13} />
                                  <span>{copiedText === detailToCopy ? "¡Copiado! ✓" : "Copiar Datos"}</span>
                                </button>
                              )}
                            </div>

                            {cfg.qrImage && (
                              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-stone-900 rounded-2xl border dark:border-stone-700 w-fit mx-auto shadow-sm">
                                <img src={cfg.qrImage} alt={`QR ${cfg.title}`} className="w-44 h-44 object-contain rounded-xl" />
                                <span className="text-[10px] text-gray-400 dark:text-stone-400 font-bold mt-1.5 flex items-center gap-1">
                                  <QrCode size={12} /> Escanea con la App de {cfg.title}
                                </span>
                              </div>
                            )}

                            {cfg.linkUrl && (
                              <div className="text-center pt-1">
                                <a
                                  href={cfg.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 bg-[#1A1C1C] dark:bg-[#163422] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#FF97A4] dark:hover:bg-[#1E432C] transition-colors shadow-sm"
                                >
                                  <span>Pagar vía {cfg.title}</span>
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            )}

                            {cfg.accountDetail && (
                              <div className="bg-white dark:bg-stone-900 p-3 rounded-xl border dark:border-stone-700 text-center font-mono font-extrabold text-sm text-[#1A1C1C] dark:text-white">
                                {cfg.accountDetail}
                              </div>
                            )}

                            {cfg.instructions && (
                              <div className="text-xs text-gray-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-gray-100 dark:border-stone-800 space-y-1 shadow-sm">
                                <span className="font-bold text-gray-500 dark:text-stone-400 uppercase text-[10px] tracking-wider block mb-1">
                                  📌 Paso a paso para pagar:
                                </span>
                                {cfg.instructions.split('\n').map((line: string, i: number) => (
                                  <p key={i} className="font-medium text-gray-700 dark:text-stone-300 leading-relaxed">
                                    {line}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <input 
                    name="paymentRef" 
                    placeholder={selectedPayment === 'efectivo' ? "No requerido para pago en efectivo" : "Número o Código de Referencia de Pago *"} 
                    className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF97A4] font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder:text-gray-400" 
                    disabled={selectedPayment === 'efectivo'}
                    required={selectedPayment !== 'efectivo'}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || cartItems.length === 0} 
                  className="w-full bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 py-4 rounded-full font-bold transition-all shadow-lg shadow-[#163422]/20 dark:shadow-[0px_4px_25px_rgba(0,0,0,0.6)] disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 text-base flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? "Procesando Orden..." : `Confirmar Pedido - $${finalTotal.toFixed(2)} USD`}
                </button>
              </form>
            </div>

            {/* RESUMEN DE COMPRA CON DESGLOSE DINÁMICO */}
            <div className="md:col-span-5 bg-white dark:bg-[#141A16] p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 h-fit space-y-6">
              <h2 className="text-xl font-serif font-black text-[#1A1C1C] dark:text-white border-b border-gray-100 dark:border-stone-800 pb-3">Resumen de Tu Pedido</h2>
              
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${JSON.stringify(item.addons)}`} className="flex justify-between items-start text-sm border-b pb-3 border-gray-50 dark:border-stone-800">
                    <div className="flex items-start gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-stone-700 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-[#1A1C1C] dark:text-white block">{item.name}</span>
                        <span className="text-xs text-gray-400 dark:text-stone-400 font-medium block">Cant: {item.quantity}</span>
                        
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1 space-y-1 border-t border-gray-100 dark:border-stone-800 pt-1">
                            {item.addons.map((add: any, idx: number) => (
                              <div key={idx} className="text-[10px]">
                                <span className="block text-[#FF97A4] font-bold">
                                  ✨ {add.name || add.value} {add.price ? `(+$${add.price.toFixed(2)})` : ''}
                                </span>
                                {add.customText ? (
                                  <div className="bg-pink-50 dark:bg-pink-950/40 p-1.5 rounded-md text-gray-800 dark:text-stone-200 font-medium my-0.5 border border-pink-100 dark:border-pink-900/40 flex items-start gap-1">
                                    <MessageSquare size={11} className="text-[#FF97A4] flex-shrink-0 mt-0.5" />
                                    <span><em>"{add.customText}"</em></span>
                                  </div>
                                ) : (
                                  updateAddonCustomText && (
                                    <input
                                      type="text"
                                      placeholder="Añadir dedicatoria para este adicional..."
                                      onChange={(e) => updateAddonCustomText(item.id, add.addonId, e.target.value)}
                                      className="mt-0.5 p-1 text-[9px] border rounded w-full focus:outline-none focus:ring-1 focus:ring-[#FF97A4] bg-white dark:bg-stone-900 border-gray-300 dark:border-stone-700 text-stone-900 dark:text-white"
                                    />
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-gray-800 dark:text-stone-200 flex-shrink-0 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* CAJA DE CUPÓN DE DESCUENTO */}
              <div className="pt-4 border-t border-gray-100 dark:border-stone-800 space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket size={14} className="text-[#FF97A4]" /> ¿Tienes un Cupón de Descuento?
                </label>

                {couponSuccess && (
                  <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl border border-green-200 flex items-start gap-2">
                    <Sparkles size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{couponSuccess}</span>
                  </div>
                )}

                {couponError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{couponError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Ej: INAUGURACION, BIENVENIDA"
                    className="flex-1 p-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-xs uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#FF97A4] text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-[#1A1C1C] dark:bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#FF97A4] dark:hover:bg-[#FF97A4] transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* DESGLOSE TRANSPARENTE DE TOTALES */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100 dark:border-stone-800 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-stone-300 font-medium">
                  <span>Subtotal Arreglos & Adicionales</span>
                  <span className="font-bold text-gray-800 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag size={14} /> Descuento Cupón ({appliedCoupon.code})
                    </span>
                    <span>-${discountAmount.toFixed(2)} USD</span>
                  </div>
                )}

                <div className="flex justify-between text-purple-700 dark:text-purple-300 font-medium bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/50">
                  <span className="font-bold flex items-center gap-1 text-xs">
                    🏛️ Impuestos de Ley (Sales Tax 8.25%)
                  </span>
                  <span className="font-extrabold text-purple-800 dark:text-purple-200">+${taxAmount.toFixed(2)} USD</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-stone-300 font-medium">
                  <span>Entrega {selectedDelivery ? `(${selectedDelivery.title})` : "(Por seleccionar)"}</span>
                  <span className={`font-bold ${deliveryFee > 0 ? "text-[#FF97A4]" : "text-gray-800 dark:text-white"}`}>
                    {selectedDelivery ? (deliveryFee > 0 ? `+$${deliveryFee.toFixed(2)}` : "Gratis") : "$0.00"}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-stone-800 pt-3 flex justify-between font-extrabold text-xl text-[#1A1C1C] dark:text-white">
                  <span>Total Final</span>
                  <span className="text-[#FF97A4]">${finalTotal.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modal Biométrico de Huella / Passkeys para el Cliente */}
      <CustomerBiometricModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onSuccess={(cust) => {
          if (cust.email) setEmail(cust.email);
          if (cust.name) setName(cust.name);
          if (cust.phone) setPhone(cust.phone);
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#163422] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-500">Cargando checkout seguro...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
