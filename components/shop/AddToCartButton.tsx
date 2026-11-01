"use client";

import { useCart } from "@/components/shop/Cart/CartContext";
import { useTranslations } from "next-intl";

export const AddToCartButton = ({ product }: { product: any }) => {
  const { addToCart } = useCart();
  const t = useTranslations("ProductDetail");

  return (
    <button 
      onClick={() => addToCart({ 
        id: product._id.toString(), 
        name: product.name, 
        price: product.price, 
        image: product.images[0],
        addons: product.selectedAddons
      })}
      className="w-full sm:w-auto bg-[#163422] hover:bg-[#1B2E22] dark:bg-[#163422] dark:hover:bg-[#1E432C] text-white dark:text-white dark:border dark:border-[#E6C98B]/50 px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-[#163422]/20 dark:shadow-[0px_4px_25px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
    >
      {t('addToCart')}
    </button>
  );
};
