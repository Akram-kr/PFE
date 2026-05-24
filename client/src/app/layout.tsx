import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DiploChain — Université de Blida 1",
  description:
    "Système de délivrance et vérification de diplômes sécurisés par blockchain NFT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Université de Blida 1 — DiploChain •{" "}
            Diplômes Soulbound NFT sur Ethereum
          </footer>
        </Providers>
      </body>
    </html>
  );
}
