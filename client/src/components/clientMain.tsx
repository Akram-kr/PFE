"use client"; // This is the key!

import dynamic from "next/dynamic";
import FileList from "./fileListe";

// Now 'ssr: false' is allowed here because this is a Client Component
const FileUpload = dynamic(() => import("./fileUpload"), {
  ssr: false,
  loading: () => (
    <div className="h-20 w-full bg-gray-50 animate-pulse border-2 border-black" />
  ),
});

const ConnectWallet = dynamic(() => import("./connectWallet"), {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-gray-100 animate-pulse" />,
});

export default function ClientMain() {
  return (
    <>
      <nav className="border-b-2 border-black p-6 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter leading-none">
            DECENTRA.STORAGE
          </h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
            L3 PFE PROJECT • UNIV BLIDA 1
          </span>
        </div>
        <ConnectWallet />
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <h2 className="text-7xl font-bold tracking-tighter mb-6 leading-[0.9]">
          OWN YOUR
          <br />
          DATA.
        </h2>
        <FileUpload />
        <FileList />
      </section>
    </>
  );
}
