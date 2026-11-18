"use client";

import { headerData } from "@/constants/data";
import { useOutsideClick } from "@/hooks";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";
import SocialMedia from "./social-media";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const pathname = usePathname();
  const sidebarRef = useOutsideClick;
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-full bg-black/50 shadow-xl ${isOpen ? "translate-x-0" : "-translate-x-full"} hoverEffect`}
    >
      <div className="border-r-shop_light_green flex h-screen max-w-96 min-w-72 flex-col gap-6 border-r bg-black p-10">
        <div className="flex items-center justify-between">
          <Logo className="text-white" spanDesign="group-hover:text-white" />
          <button
            onClick={onClose}
            className="hover:text-shop_light_green hoverEffect"
          >
            <X />
          </button>
        </div>

        <div className="flex flex-col space-y-3.5 font-semibold tracking-wide">
          {headerData.map((item) => (
            <Link
              href={item.href}
              key={item.title}
              className={`hover:text-shop_light_green hoverEffect ${pathname === item.href ? "text-shop_light_green" : ""}`}
            >
              {item.title}
            </Link>
          ))}
        </div>

        <SocialMedia />
      </div>
    </div>
  );
}
