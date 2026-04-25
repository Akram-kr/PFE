"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-16 bg-bg/80 backdrop-blur-xl border-b border-border font-display">
      <div className="flex items-center gap-2.5">
        <span className="text-accent text-2xl leading-none">⬡</span>
        <span className="text-[17px] font-bold tracking-tight text-text-1">
          DecentraVault
        </span>
      </div>

      <ConnectButton
        accountStatus="avatar"
        chainStatus="icon"
        showBalance={false}
      />
    </nav>
  );
}
// "use client";

// import { ConnectButton } from "@rainbow-me/rainbowkit";
// import { useAccount } from "wagmi";

// export function Navbar() {
//   const { isConnected, chain } = useAccount();

//   return (
//     <header className="sticky top-0 z-50 border-b border-line bg-ink-1/95 backdrop-blur-md">
//       {/* Top status strip */}
//       <div className="border-b border-line px-6 py-1 flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <span className="font-proto text-[10px] text-t3 tracking-widest uppercase">
//             DecentraVault Protocol v1.0
//           </span>
//           <span className="h-3 w-px bg-line-2" />
//           <span className="font-proto text-[10px] flex items-center gap-1.5">
//             <span className="w-1.5 h-1.5 rounded-full bg-proto-green animate-pulse" />
//             <span className="text-proto-green">NODE ACTIVE</span>
//           </span>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="font-proto text-[10px] text-t3">
//             {isConnected
//               ? `${chain?.name ?? "Unknown"} · ${chain?.id}`
//               : "NOT CONNECTED"}
//           </span>
//         </div>
//       </div>

//       {/* Main nav */}
//       <div className="px-6 h-12 flex items-center justify-between">
//         {/* Logo */}
//         <div className="flex items-center gap-3">
//           <div className="relative w-7 h-7 flex items-center justify-center">
//             <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
//               <polygon
//                 points="14,2 26,8 26,20 14,26 2,20 2,8"
//                 stroke="#2f81f7"
//                 strokeWidth="1.5"
//                 fill="rgba(47,129,247,0.08)"
//               />
//               <polygon
//                 points="14,7 21,11 21,17 14,21 7,17 7,11"
//                 stroke="#2f81f7"
//                 strokeWidth="1"
//                 fill="rgba(47,129,247,0.15)"
//               />
//               <circle cx="14" cy="14" r="2" fill="#2f81f7" />
//             </svg>
//           </div>
//           <div>
//             <span className="text-sm font-semibold tracking-tight text-t1">
//               DecentraVault
//             </span>
//             <span className="hidden sm:inline font-proto text-[10px] text-t3 ml-2 tracking-widest">
//               /STORAGE
//             </span>
//           </div>
//         </div>

//         {/* Nav links */}
//         <nav className="hidden md:flex items-center gap-1">
//           {["Vault", "Activity", "Network"].map((item, i) => (
//             <button
//               key={item}
//               className={`px-3 py-1.5 rounded-proto font-proto text-[11px] tracking-wider transition-all ${
//                 i === 0
//                   ? "bg-blue-dim text-blue-2 border border-blue/20"
//                   : "text-t3 hover:text-t2 hover:bg-ink-3"
//               }`}
//             >
//               {item.toUpperCase()}
//             </button>
//           ))}
//         </nav>

//         {/* Connect button */}
//         <ConnectButton
//           accountStatus="avatar"
//           chainStatus="none"
//           showBalance={false}
//         />
//       </div>
//     </header>
//   );
// }
