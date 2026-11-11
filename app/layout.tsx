import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/shop/Cart/CartContext";
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import Script from "next/script";
import dynamic from "next/dynamic";
import { getThemeConfigAction } from "@/lib/actions/theme";
import { getDoorDashConfigAction } from "@/lib/actions/doordash";

const CookieConsent = dynamic(() => import("@/components/CookieConsent").then((m) => m.CookieConsent));
const PedidoFlotante = dynamic(() => import("@/components/shop/PedidoFlotante").then((m) => m.PedidoFlotante));
const ShoppingCartComponent = dynamic(() => import("@/components/shop/Cart/ShoppingCart").then((m) => m.ShoppingCartComponent));
const ChatbotModal = dynamic(() => import("@/components/shop/Chatbot/ChatbotModal").then((m) => m.ChatbotModal));
const LeadCaptureFloatingWidget = dynamic(() => import("@/components/shop/LeadCaptureFloatingWidget").then((m) => m.LeadCaptureFloatingWidget));

import { Playfair_Display, Montserrat, Plus_Jakarta_Sans, Manrope, Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VKA POS | Punto de Venta, Facturación & Retail",
  description: "Sistema integral de facturación, punto de venta (POS), control de inventario y despacho local con flota de reparto.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeRes, doorDashRes] = await Promise.all([
    getThemeConfigAction(),
    getDoorDashConfigAction(),
  ]);
  const theme = themeRes.theme;
  const doordashConfig = doorDashRes.config;

  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable} ${plusJakarta.variable} ${manrope.variable} ${greatVibes.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="trustpilot-one-time-domain-verification-id" content="e993157a-ecc6-48b6-985d-bca8eebb5fb2" />

        {/* Anti-FOUC Theme Initializer */}
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />

        {/* Script Oficial e Integración DoorDash Drive / Storefront */}
        {doordashConfig?.scriptEnabled && doordashConfig?.scriptHtml && (
          <div
            id="doordash-injected-script"
            dangerouslySetInnerHTML={{ __html: doordashConfig.scriptHtml }}
          />
        )}

        {/* Variables dinámicas del Editor de Tema para la Home y Componentes */}
        <style
          id="dynamic-theme-vars"
          dangerouslySetInnerHTML={{
            __html: `
              :root, html:not(.dark) {
                --theme-announcement-bg: ${theme.announcementBg || "#33cccc"};
                --theme-announcement-text: ${theme.announcementText || "#1c1917"};
                --theme-header-bg: ${theme.headerBg || "#ffffff"};
                --theme-header-text: ${theme.headerText || "#163422"};
                --theme-btn-primary-bg: ${theme.buttonPrimaryBg || "#163422"};
                --theme-btn-primary-text: ${theme.buttonPrimaryText || "#ffffff"};
                --theme-btn-primary-hover: ${theme.buttonPrimaryHoverBg || "#1F452E"};
                --theme-btn-secondary-bg: ${theme.buttonSecondaryBg || "#FF97A4"};
                --theme-btn-secondary-text: ${theme.buttonSecondaryText || "#ffffff"};
                --theme-accent: ${theme.accentColor || "#C5A059"};
                --theme-heading: ${theme.headingColor || "#163422"};
                --theme-body: ${theme.bodyTextColor || "#4A5568"};
                --theme-script: ${theme.scriptTextColor || "#163422"};
                --theme-footer-bg: ${theme.footerBg || "#ffffff"};
                --theme-footer-text: ${theme.footerText || "#1c1917"};
                --theme-footer-accent: ${theme.footerAccent || "#163422"};
                --theme-page-bg: ${theme.pageBg || "#FDFBF7"};
                --theme-card-bg: ${theme.cardBg || "#ffffff"};
                --theme-card-border: ${theme.cardBorder || "#f3f4f6"};
                --theme-price-color: ${theme.priceColor || "#163422"};
                --theme-badge-bg: ${theme.badgeBg || "#FF97A4"};
                --theme-badge-text: ${theme.badgeText || "#ffffff"};
              }

              /* MODO OSCURO: Paleta Nocturna de Alta Costura Floral & Contraste WCAG AAA */
              html.dark {
                --theme-announcement-bg: #141E17;
                --theme-announcement-text: #FFFFFF;
                --theme-header-bg: rgba(14, 20, 16, 0.95);
                --theme-header-text: #FFFFFF;
                --theme-btn-primary-bg: #163422;
                --theme-btn-primary-text: #FFFFFF;
                --theme-btn-primary-hover: #1F452E;
                --theme-btn-secondary-bg: #FF97A4;
                --theme-btn-secondary-text: #FFFFFF;
                --theme-accent: #E6C98B;
                --theme-heading: #FFFFFF;
                --theme-body: #E2E8F0;
                --theme-script: #E6C98B;
                --theme-footer-bg: #0A0D0B;
                --theme-footer-text: #E2E8F0;
                --theme-footer-accent: #E6C98B;
                --theme-page-bg: #0D110F;
                --theme-card-bg: #141A16;
                --theme-card-border: rgba(255, 255, 255, 0.08);
                --theme-price-color: #E6C98B;
                --theme-badge-bg: #FF97A4;
                --theme-badge-text: #FFFFFF;
              }

              /* Tipografía Cursiva en Home y Hero: Modo Claro (#163422) vs Modo Oscuro (#E6C98B Champagne) */
              html:not(.dark) .font-script-custom:not(.preserve-color) {
                color: var(--theme-script, #163422) !important;
              }
              html.dark .font-script-custom:not(.preserve-color) {
                color: #E6C98B !important;
                text-shadow: 0 0 20px rgba(230, 201, 139, 0.35);
              }

              /* Botones Primarios de Conversión en modo claro */
              html:not(.dark) .theme-btn-primary,
              html:not(.dark) button.bg-\\[\\#163422\\],
              html:not(.dark) a.bg-\\[\\#163422\\] {
                background-color: var(--theme-btn-primary-bg, #163422) !important;
                color: var(--theme-btn-primary-text, #ffffff) !important;
              }
              html:not(.dark) button.bg-\\[\\#163422\\]:hover,
              html:not(.dark) a.bg-\\[\\#163422\\]:hover {
                background-color: var(--theme-btn-primary-hover, #1F452E) !important;
              }

              /* Botones Primarios en modo oscuro */
              html.dark .theme-btn-primary {
                background-color: #163422 !important;
                color: #FFFFFF !important;
                border: 1px solid rgba(230, 201, 139, 0.3) !important;
              }

              /* Botones e Insignias Secundarias */
              html:not(.dark) .theme-btn-secondary,
              html:not(.dark) button.bg-\\[\\#FF97A4\\],
              html:not(.dark) a.bg-\\[\\#FF97A4\\],
              html:not(.dark) span.bg-\\[\\#FF97A4\\] {
                background-color: var(--theme-btn-secondary-bg, #FF97A4) !important;
                color: var(--theme-btn-secondary-text, #ffffff) !important;
              }
            `,
          }}
        />
        
        {/* Script Oficial Permanente de Integración e Invitaciones de Trustpilot */}
        <Script
          id="trustpilot-invite-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,r,n){w.TrustpilotObject=n;w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
              a=d.createElement(s);a.async=1;a.src=r;a.type='text/java'+s;f=d.getElementsByTagName(s)[0];
              f.parentNode.insertBefore(a,f)})(window,document,'script', 'https://invitejs.trustpilot.com/tp.min.js', 'tp');
              tp('register', 'Mj2BoVbFWujG5sRE');
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale="en" messages={enMessages}>
            <CartProvider>
              <PedidoFlotante />
              <ShoppingCartComponent />
              <LeadCaptureFloatingWidget />
              {children}
              <ChatbotModal />
              <CookieConsent />
              <AnalyticsTracker />
              <InstallPrompt />
            </CartProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
