import { getPosts } from "@/lib/actions/post";
import { NosotrosClient } from "@/components/shop/NosotrosClient";
import { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "About Us | VKA POS"
      : "Nosotros | VKA POS",
    description: isEn
      ? "Learn about VKA POS, modern point of sale, invoicing, inventory, and local dispatch software."
      : "Conoce más sobre VKA POS, solución integral para punto de venta, facturación, inventario y despachos locales.",
    openGraph: {
      title: isEn ? "About Us | VKA POS" : "Nosotros | VKA POS",
      description: isEn
        ? "Point of Sale, Invoicing and Retail Management System."
        : "Sistema de Punto de Venta, Facturación y Gestión Retail.",
      images: ["/logo.png"]
    }
  };
}

export default async function LocalizedNosotrosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const targetLanguage = locale === "en" ? "en" : "es";
  const { data: posts } = await getPosts({ publishedOnly: true, language: targetLanguage });

  return <NosotrosClient initialPosts={posts || []} locale={locale} />;
}
