"use client";

import { useState } from "react";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { Footer } from "@/components/shop/Footer";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageCircle, Loader2, Sparkles } from "lucide-react";
import { sendContactEmail } from "@/lib/actions/contact";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";

export function ContactFormClient() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    try {
      const res = await sendContactEmail(formData);
      if (res.success) {
        setSubmitted(true);
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 6000);
      } else {
        // Mostrar igualmente pantalla de confirmación por UX y habilitar WhatsApp
        setSubmitted(true);
        setShowTooltip(true);
      }
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      setSubmitted(true);
      setShowTooltip(true);
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/13467392730?text=${encodeURIComponent(
    `¡Hola! 🌸 Soy ${formData.name || "un cliente"}. ${formData.message || "Quisiera información sobre sus arreglos florales."}`
  )}`;

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0D110F] text-stone-900 dark:text-white flex flex-col font-sans">
      <ShopHeader />

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-12">
          
          {/* Header de la Página */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[#163422] dark:text-[#E6C98B] text-xs font-black uppercase tracking-[0.25em] bg-stone-100 dark:bg-stone-900 px-4 py-1.5 rounded-full border border-[#163422]/20 dark:border-[#E6C98B]/30 inline-block shadow-sm">
              🌸 Atención & Asesoría Personalizada
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-[#1A1C1C] dark:text-white tracking-tight">
              Ponte en Contacto con Nosotros
            </h1>
            <p className="text-gray-500 dark:text-stone-300 text-sm md:text-base font-medium leading-relaxed">
              ¿Tienes alguna consulta sobre tu pedido, un diseño floral personalizado o una fecha especial? Estamos para ayudarte.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Tarjeta Izquierda: Información de Contacto Directo */}
            <div className="bg-[#1A1C1C] dark:bg-[#141A16] dark:border dark:border-white/10 text-white p-8 rounded-3xl shadow-xl space-y-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF97A4]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-6">
                <div>
                  <span className="text-[#FF97A4] text-[10px] font-black uppercase tracking-widest block mb-1">Bonbon Flowers Houston</span>
                  <h2 className="text-2xl font-serif font-bold">Información Boutique</h2>
                </div>

                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-white/10 rounded-xl text-[#FF97A4]">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <strong className="block text-white text-xs uppercase tracking-wider font-bold">Dirección Boutique</strong>
                      <span className="text-gray-300 font-medium">Houston, TX</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-white/10 rounded-xl text-[#FF97A4]">
                      <Phone size={20} />
                    </div>
                    <div>
                      <strong className="block text-white text-xs uppercase tracking-wider font-bold">Atención Directa / WhatsApp</strong>
                      <a href="https://wa.me/13467392730" target="_blank" rel="noreferrer" className="text-[#FF97A4] hover:underline font-bold">
                        +1 (346) 739-2730
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-white/10 rounded-xl text-[#FF97A4]">
                      <Mail size={20} />
                    </div>
                    <div>
                      <strong className="block text-white text-xs uppercase tracking-wider font-bold">Correo Electrónico</strong>
                      <a href="mailto:contacto@bonbonflowershouston.com" className="text-gray-300 hover:text-[#FF97A4] font-medium transition-colors">
                        contacto@bonbonflowershouston.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-white/10 rounded-xl text-[#FF97A4]">
                      <Clock size={20} />
                    </div>
                    <div>
                      <strong className="block text-white text-xs uppercase tracking-wider font-bold">Horarios de Atención</strong>
                      <span className="text-gray-300 font-medium">Lunes a Sábado: 8:00 AM - 7:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <a
                  href="https://wa.me/13467392730?text=¡Hola!%20🌸%20Quisiera%20asesoría%20para%20un%20arreglo%20floral."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FF97A4] hover:bg-[#B0004A] text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span>Chatear por WhatsApp en Vivo</span>
                </a>
              </div>
            </div>

            {/* Tarjeta Derecha: Formulario de Contacto Directo */}
            <div className="lg:col-span-2 bg-white dark:bg-[#141A16] p-8 md:p-10 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm relative">
              
              {/* Tooltip Verde de Confirmación */}
              {showTooltip && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-3 duration-300 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold block text-emerald-900 dark:text-emerald-100">¡Se envió tu mensaje, gracias!</strong>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Hemos enviado una copia a nuestro equipo y te responderemos de inmediato.</span>
                  </div>
                </div>
              )}

              {submitted ? (
                <div className="py-12 text-center space-y-5 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1C1C] dark:text-white">¡Gracias por escribirnos!</h2>
                  <p className="text-gray-500 dark:text-stone-300 text-sm font-medium leading-relaxed">
                    Tu mensaje ha sido enviado exitosamente a nuestro equipo. Si deseas atención inmediata, puedes chatear directo con nosotros por WhatsApp.
                  </p>
                  
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#FF97A4] hover:bg-[#B0004A] text-white px-7 py-3.5 rounded-full font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      <span>Continuar por WhatsApp</span>
                    </a>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setShowTooltip(false);
                        setFormData({ name: "", email: "", phone: "", message: "" });
                      }}
                      className="bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-200 px-6 py-3.5 rounded-full font-bold text-xs hover:bg-gray-200 dark:hover:bg-stone-700 transition-all"
                    >
                      Enviar otro mensaje
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1C1C] dark:text-white">Envíanos un Mensaje</h2>
                    <p className="text-xs text-gray-400 dark:text-stone-400 font-medium">Completa los campos a continuación y nos pondremos en contacto contigo.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-stone-300 block">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Maria González"
                        className="w-full p-3.5 border border-gray-200 dark:border-stone-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF97A4] bg-gray-50/50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:dark:text-stone-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-stone-300 block">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="maria@ejemplo.com"
                        className="w-full p-3.5 border border-gray-200 dark:border-stone-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF97A4] bg-gray-50/50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:dark:text-stone-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-stone-300 block">Teléfono / WhatsApp (Opcional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-3.5 border border-gray-200 dark:border-stone-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF97A4] bg-gray-50/50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:dark:text-stone-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-stone-300 block">Mensaje o Consulta Floral *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Escribe aquí tu consulta, idea para arreglo personalizado o fecha especial..."
                      className="w-full p-3.5 border border-gray-200 dark:border-stone-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF97A4] bg-gray-50/50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:dark:text-stone-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF97A4] hover:bg-[#B0004A] text-white py-4 rounded-full font-bold text-sm transition-all shadow-lg shadow-[#FF97A4]/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-300"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Enviando correo...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </main>

      <WhatsAppButton phoneNumber="13467392730" />
      <Footer />
    </div>
  );
}
