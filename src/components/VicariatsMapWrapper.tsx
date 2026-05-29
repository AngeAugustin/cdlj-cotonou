"use client";

import dynamic from "next/dynamic";

const VicariatsLeafletMap = dynamic(() => import("@/components/VicariatsLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-3xl border border-slate-200 shadow-inner bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium" style={{ height: "min(70vh, 560px)" }}>
      Chargement de la carte…
    </div>
  ),
});

export default function VicariatsMapWrapper() {
  return <VicariatsLeafletMap />;
}
