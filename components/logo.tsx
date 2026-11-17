import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Logo({
  className,
  spanDesign,
}: {
  className?: string;
  spanDesign?: string;
}) {
  return (
    <Link href={"/"}>
      <h2
        className={cn(
          "text-shop_dark_green hover:text-shop_light_green hoverEffect group font-sans text-2xl font-bold tracking-wider uppercase",
          className,
        )}
      >
        Shopcar
        <span
          className={cn(
            "text-shop_light_green group-hover:text-shop_dark_green hoverEffect",
            spanDesign,
          )}
        >
          t
        </span>
      </h2>
    </Link>
  );
}
