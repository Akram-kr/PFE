import Link from "next/link";
import {
  ShieldCheck,
  LayoutDashboard,
  QrCode,
  Lock,
  Cpu,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Soulbound NFT",
    desc: "Chaque diplôme est un token ERC-721 non-transférable ancré sur blockchain.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Signature",
    desc: "Chaque lot doit être approuvé par le Doyen ET le Recteur avant l'émission.",
  },
  {
    icon: Globe,
    title: "Stockage IPFS",
    desc: "Les PDFs et métadonnées sont stockés sur IPFS via Pinata. Seul le hash est on-chain.",
  },
  {
    icon: QrCode,
    title: "QR de vérification",
    desc: "Chaque diplôme génère un QR code pour une vérification instantanée d'authenticité.",
  },
  {
    icon: Cpu,
    title: "Batch Minting",
    desc: "Des centaines de diplômes émis en une seule transaction blockchain.",
  },
  {
    icon: LayoutDashboard,
    title: "Tableau de bord admin",
    desc: "Proposez des lots, signez en tant que Doyen/Recteur, et frappez les NFTs.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-uni-blue via-blue-800 to-blue-900 py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Université de Blida 1 — Département Informatique
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            DiploChain
          </h1>
          <p className="mb-2 text-xl font-semibold text-blue-100">
            Système de délivrance de diplômes haute sécurité
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-blue-200">
            Diplômes infalsifiables basés sur les Soulbound Tokens (ERC-721),
            gouvernance multi-signatures Doyen + Recteur, stockage IPFS
            décentralisé.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-uni-blue shadow transition hover:bg-blue-50"
            >
              Tableau de bord Admin
            </Link>
            <Link
              href="/verify"
              className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Vérifier un diplôme
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-800">
            Architecture technique
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card group hover:border-uni-blue/30 hover:shadow-md transition"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-uni-blue group-hover:bg-uni-blue group-hover:text-white transition">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow diagram */}
      <section className="border-t border-slate-200 bg-slate-100 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-8 text-xl font-bold text-slate-800">
            Flux de gouvernance
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
            {[
              {
                label: "Proposé",
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
              },
              { label: "→", color: "text-slate-400" },
              {
                label: "Signé — Doyen",
                color: "bg-blue-100 text-blue-800 border-blue-200",
              },
              { label: "→", color: "text-slate-400" },
              {
                label: "Signé — Recteur",
                color: "bg-purple-100 text-purple-800 border-purple-200",
              },
              { label: "→", color: "text-slate-400" },
              {
                label: "Diplômes frappés",
                color: "bg-green-100 text-green-800 border-green-200",
              },
            ].map(({ label, color }, i) =>
              label === "→" ? (
                <span key={i} className={color + " text-lg"}>
                  {label}
                </span>
              ) : (
                <span
                  key={i}
                  className={`rounded-full border px-4 py-1.5 ${color}`}
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
