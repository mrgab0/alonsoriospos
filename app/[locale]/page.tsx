import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { StitchMobileHeaderAndHero } from "@/components/shop/StitchMobileHeaderAndHero";
import { PillarsOfExcellence } from "@/components/shop/PillarsOfExcellence";
import { HomeProductShowcase } from "@/components/shop/HomeProductShowcase";
import { HoustonDeliveryBanner } from "@/components/shop/HoustonDeliveryBanner";
import { StoreLocationSection } from "@/components/shop/StoreLocationSection";
import dbConnect from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { getSiteConfig } from "@/lib/actions/siteConfig";
import { filterUniqueVariantProducts } from "@/lib/utils/variantFilter";

const SocialAndReviewsSection = dynamic(
  () => import("@/components/shop/SocialAndReviewsSection").then((m) => m.SocialAndReviewsSection),
  { ssr: true }
);

const CustomIframeSection = dynamic(
  () => import("@/components/shop/CustomIframeSection").then((m) => m.CustomIframeSection),
  { ssr: true }
);

const Footer = dynamic(
  () => import("@/components/shop/Footer").then((m) => m.Footer),
  { ssr: true }
);

export const revalidate = 60;

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  let products: any[] = [];
  let siteConfig: any = null;
  let heroProducts: any[] = [];

  try {
    await dbConnect();
    const [productsRaw, siteConfigRes] = await Promise.all([
      Product.find({ isActive: { $ne: false } })
        .sort({ isFeatured: -1, createdAt: -1 })
        .lean(),
      getSiteConfig(),
    ]);

    const plainProducts = JSON.parse(JSON.stringify(productsRaw || []));
    const uniqueProducts = filterUniqueVariantProducts(plainProducts);
    products = uniqueProducts.slice(0, 24);
    siteConfig = siteConfigRes?.data;

    // Resolución de candidatos para el Hero Showcase según configuración
    const mode = siteConfig?.heroProductMode || "popular";
    if (mode === "single" && siteConfig?.heroProductId) {
      const match = plainProducts.find((p: any) => String(p._id) === String(siteConfig.heroProductId));
      if (match) heroProducts = [match];
    } else if (mode === "custom_list" && Array.isArray(siteConfig?.heroCustomProductIds) && siteConfig.heroCustomProductIds.length > 0) {
      const selectedSet = new Set(siteConfig.heroCustomProductIds.map(String));
      const matched = plainProducts.filter((p: any) => selectedSet.has(String(p._id)));
      if (matched.length > 0) heroProducts = matched;
    }

    // Modo "popular" o fallback seguro
    if (heroProducts.length === 0) {
      const count = Number(siteConfig?.heroPopularCount) || 10;
      heroProducts = plainProducts.slice(0, count);
    }
  } catch (err) {
    console.warn("Aviso: No se pudo conectar a la base de datos durante el pre-renderizado estático de [locale]/page. Usando valores seguros.", err);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#0B0C10] text-stone-800 dark:text-gray-100 transition-colors duration-300 relative overflow-x-hidden">
      {/* Cabecera, Navegación, Hero 2-Columnas y 5 Categorías Circulares Stitch 1:1 */}
      <StitchMobileHeaderAndHero siteConfig={siteConfig} heroProducts={heroProducts} locale={locale} />

      {/* 4 Pilares de Excelencia (Entrega Mismo Día, Tarjeta Caligrafiada, Rosas Ecuador, White Glove) */}
      <PillarsOfExcellence />

      {/* Módulo iFrame Personalizado (si está activo en el Administrador) */}
      {siteConfig?.enableCustomIframe && (
        <CustomIframeSection
          title={siteConfig.customIframeTitle}
          iframeHtml={siteConfig.customIframeHtml}
        />
      )}

      {/* Vitrina "Composiciones Esculturales / Most Loved" con Filtros Interactivos */}
      <HomeProductShowcase products={products} />

      {/* Banner de Entregas y Zonas de Cobertura */}
      <HoustonDeliveryBanner
        phone="(346) 739-2730"
        whatsappUrl="https://wa.me/13467392730?text=Hola!%20Quisiera%20informacion%20de%20pedidos."
      />

      {/* Sección de Ubicación y Cobertura */}
      <StoreLocationSection
        phone="(346) 739-2730"
        email="contacto@vkapos.com"
        whatsappUrl="https://wa.me/13467392730?text=Hola!%20Quisiera%20informacion%20de%20pedidos."
      />

      {/* Secciones de Reseñas y Feed de Instagram */}
      <SocialAndReviewsSection
        enableReviews={siteConfig?.enableReviewsSection !== false}
        reviewsTitle={siteConfig?.reviewsTitle}
        ratingScore={siteConfig?.reviewsRatingScore}
        countText={siteConfig?.reviewsCountText}
        trustpilotWidgetHtml={siteConfig?.trustpilotWidgetHtml}
        enableSocialFeed={siteConfig?.enableSocialFeed !== false}
        socialTitle={siteConfig?.socialFeedTitle || "Síguenos en Instagram 📸"}
        embedHtml={siteConfig?.socialEmbedHtml}
        instagramUrl={siteConfig?.instagramUrl || "https://www.instagram.com/bonbonflowers__?stkn=MXBnc3hsbHVlM3psMQ=="}
      />

      {/* Footer de Lujo */}
      <Footer siteConfig={siteConfig} />
    </main>
  );
}

