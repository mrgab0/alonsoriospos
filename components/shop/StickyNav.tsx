"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shop/LanguageSwitcher";
import { ThemeToggle } from "@/components/shop/ThemeToggle";
import dynamic from "next/dynamic";
import { MegaMenuDropdown } from "@/components/shop/MegaMenuDropdown";
import { Fingerprint, Instagram, Facebook, MessageCircle, ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

const CustomerBiometricModal = dynamic(
  () => import("@/components/auth/CustomerBiometricModal").then((m) => m.CustomerBiometricModal),
  { ssr: false }
);

interface StickyNavProps {
  siteConfig?: any;
}

export function StickyNav({ siteConfig }: StickyNavProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("nav");

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 180);
    };
    window.addEventListener("scroll", handleScroll);
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const enableSocials = siteConfig?.enableHeaderSocials !== false;
  const instagramUrl = siteConfig?.instagramUrl || "https://www.instagram.com/bonbonflowers__?stkn=MXBnc3hsbHVlM3psMQ==";
  const facebookUrl = siteConfig?.facebookUrl || "https://www.facebook.com/bonbon.flowers.2025";
  const tiktokUrl = siteConfig?.tiktokUrl || "https://tiktok.com";
  const whatsappUrl = siteConfig?.whatsappUrl || "https://wa.me/13467392730";

  const navLinks = [
    { href: "/", label: t('home') },
    { href: "/productos", label: t('catalog'), isMega: true },
    { href: "/rastreo", label: t('tracking') },
    { href: "/nosotros", label: t('about') },
    { href: "/contacto", label: t('contact') },
    { href: "/checkout", label: t('cart') }
  ];

  return (
    <>
      <nav
        className={`w-full z-50 transition-all duration-300 border-y border-[#D4AF37]/20 ${
          isSticky
            ? "fixed top-0 bg-white/95 dark:bg-[#12131A]/95 backdrop-blur-lg shadow-[0_10px_30px_rgba(42,0,2,0.08)] py-0"
            : "relative bg-white/90 dark:bg-[#0F1015]/90 backdrop-blur-md py-1"
        }`}
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 xl:gap-6 relative">
          
          {/* LADO IZQUIERDO: Logo de Bonbon Flowers con Letras Responsivas */}
          <div className="flex items-center gap-2 sm:gap-4 py-2 flex-shrink-0 relative z-10 min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group flex-shrink-0 min-w-0">
              {/* Contenedor del Logo */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-18 lg:h-18 rounded-full overflow-hidden border-2 sm:border-3 border-[#92C21E]/40 shadow-xl group-hover:scale-105 group-active:scale-95 transition-transform bg-white flex-shrink-0 flex items-center justify-center p-0.5">
                <img
                  src={siteConfig?.logoUrl || "/logo.png"}
                  alt="Bonbon Flowers Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-brand font-black text-[12.5px] min-[380px]:text-[14px] sm:text-lg lg:text-2xl text-[#E6007F] tracking-[0.04em] sm:tracking-[0.06em] uppercase flex-shrink-0 leading-tight whitespace-nowrap">
                  BONBON FLOWERS
                </span>
                <span className="text-[7.5px] min-[380px]:text-[8.5px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.25em] uppercase font-extrabold text-[#92C21E] whitespace-nowrap">
                  Art Floral • Houston, Texas
                </span>
              </div>
            </Link>

            {enableSocials && (
              <div className="hidden 2xl:flex items-center gap-1.5 ml-2 pl-3 border-l border-[#D4AF37]/30">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-stone-700 dark:text-gray-300 hover:text-[#163422] hover:-translate-y-0.5 active:scale-95 transition-all bg-stone-100/60 dark:bg-gray-800/60 rounded-md shadow-sm" title="Instagram">
                    <Instagram size={16} />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-stone-700 dark:text-gray-300 hover:text-[#163422] hover:-translate-y-0.5 active:scale-95 transition-all bg-stone-100/60 dark:bg-gray-800/60 rounded-md shadow-sm" title="Facebook">
                    <Facebook size={16} />
                  </a>
                )}
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-700 dark:text-emerald-400 hover:-translate-y-0.5 active:scale-95 transition-all bg-stone-100/60 dark:bg-gray-800/60 rounded-md shadow-sm" title="WhatsApp Directo">
                    <MessageCircle size={16} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* CENTRO: Botones de Navegación RECTANGULARES y EL TRIPLE DE ALTOS (h-16 a h-20) */}
          <div 
            ref={scrollRef}
            className="hidden lg:flex flex-1 min-w-0 items-center justify-center overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden font-bold uppercase tracking-wider 2xl:tracking-[0.18em] px-2 relative z-0 h-full"
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            {navLinks.map((link, idx) => (
              <div 
                key={idx} 
                className="relative h-full flex items-center"
                onMouseEnter={() => link.isMega && setIsMegaMenuOpen(true)}
              >
                <Link 
                  href={link.href} 
                  className="px-3.5 xl:px-5 2xl:px-6 h-16 xl:h-20 flex items-center justify-center rounded-none text-stone-900 dark:text-gray-100 hover:text-[#163422] dark:hover:text-[#C5A059] border-b-2 border-transparent hover:border-[#163422] dark:hover:border-[#C5A059] transition-all duration-200 tracking-widest uppercase font-bold text-xs xl:text-[13px] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                >
                  <span>{link.label}</span>
                  {link.isMega && (
                    <ChevronDown 
                      size={13} 
                      className={`ml-1 transition-transform duration-300 ${isMegaMenuOpen ? "rotate-180 text-[#163422]" : ""}`} 
                    />
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* Mega Menú Flotante */}
          <div onMouseEnter={() => setIsMegaMenuOpen(true)} onMouseLeave={() => setIsMegaMenuOpen(false)}>
            <MegaMenuDropdown 
              isOpen={isMegaMenuOpen} 
              onClose={() => setIsMegaMenuOpen(false)} 
            />
          </div>

          {/* DERECHA: Controles Auxiliares y Menú Móvil */}
          <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
            <button
              onClick={() => setIsBioModalOpen(true)}
              className="flex items-center gap-1.5 bg-stone-100 dark:bg-gray-800 text-stone-900 dark:text-gray-100 border border-stone-200 dark:border-gray-700 px-3 py-2.5 rounded-lg text-xs font-bold shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              title="Acceso con Huella / Face ID (Passkeys)"
            >
              <Fingerprint size={16} />
              <span className="hidden 2xl:inline text-[11px]">Huella</span>
            </button>

            <div className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
              <ThemeToggle />
            </div>
            
            <div className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
              <LanguageSwitcher />
            </div>

            {/* Botón de Menú Móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-lg bg-stone-100 dark:bg-gray-800 text-stone-900 dark:text-gray-200 border border-stone-300 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
              aria-label={isMobileMenuOpen ? "Contraer menú" : "Desplegar menú"}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE CON LÍNEAS RECTANGULARES Y MÁS ALTAS */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 dark:border-gray-800 bg-white/98 dark:bg-[#12131A]/98 backdrop-blur-xl px-4 py-4 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1.5">
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-4 rounded-md bg-stone-50 dark:bg-gray-800/70 text-stone-900 dark:text-gray-100 font-bold text-sm border-l-4 border-transparent hover:border-[#163422] transition-all hover:bg-[#163422]/5 hover:text-[#163422] dark:hover:text-[#C5A059]"
                >
                  <span className="tracking-wider uppercase">{link.label}</span>
                  <span className="text-xs text-[#163422] dark:text-[#C5A059]">→</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </nav>

      {isBioModalOpen && (
        <CustomerBiometricModal
          isOpen={isBioModalOpen}
          onClose={() => setIsBioModalOpen(false)}
        />
      )}
    </>
  );
}
