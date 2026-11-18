"use client";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

const CartIcon = () => {
  const itemCount = 0;
  const displayCount = itemCount > 9 ? "9+" : itemCount;

  return (
    <Link href={"/cart"} className="group relative">
      <ShoppingBag className="group-hover:text-shop_light_green hoverEffect" />
      {itemCount > 0 ? (
        <span
          className={`bg-shop_btn_dark_green absolute -top-1 -right-1 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full text-xs font-semibold text-white ${
            itemCount > 9 ? "px-1" : ""
          }`}
        >
          {displayCount}
        </span>
      ) : (
        <span className="bg-shop_btn_dark_green absolute -top-1 -right-1 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full text-xs font-semibold text-white">
          0
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
