"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

const FavoriteButton = ({ showProduct = false }: { showProduct?: boolean }) => {
  return (
    <>
      {!showProduct ? (
        <Link
          href="/wishlist"
          className="group hover:text-shop_light_green hoverEffect relative"
        >
          <Heart className="group-hover:text-shop_light_green hoverEffect mt-.5" />

          <span className="bg-shop_btn_dark_green absolute -top-1 -right-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full text-xs font-semibold text-white">
            0
          </span>
        </Link>
      ) : (
        <button
          type="button"
          className="group hover:text-shop_light_green hoverEffect border-shop_light_green/80 relative rounded-sm border p-1.5"
        >
          <Heart
            fill="#fff"
            className="text-shop_light_green/80 group-hover:text-shop_light_green hoverEffect mt-.5"
          />
        </button>
      )}
    </>
  );
};

export default FavoriteButton;
