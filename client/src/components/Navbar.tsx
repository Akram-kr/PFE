"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/admin", label: "Admin" },
  { href: "/verify", label: "Vérifier" },
];

export function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-uni-blue">
          <ShieldCheck className="h-5 w-5" />
          DiploChain
          <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500 sm:inline">
            Blida 1
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                path === href
                  ? "bg-blue-50 text-uni-blue"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}
