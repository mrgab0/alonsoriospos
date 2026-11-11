import RastreoPedidoPage from "@/app/rastreo/page";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Track My Order | VKA POS"
      : "Rastrear Mi Factura y Envío | VKA POS",
    description: isEn
      ? "Check the live preparation and delivery dispatch status of your order."
      : "Consulta el estado en vivo de tu pedido o despacho con tu ID de orden o teléfono.",
  };
}

export default async function LocalizedRastreoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RastreoPedidoPage initialLocale={locale} />;
}
