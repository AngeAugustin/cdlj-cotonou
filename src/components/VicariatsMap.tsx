"use client";

import { useState } from "react";
import { Church, Users, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { VICARIATS, type Vicariat } from "@/lib/vicariats-data";

// Label offset par node (évite chevauchement texte/cercle)
const LABEL_OFFSET: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  I:    { dx: 0,   dy: -42, anchor: "middle" },  // hub → au-dessus
  II:   { dx: 50,  dy: 4,   anchor: "start"  },  // droite
  III:  { dx: -50, dy: 4,   anchor: "end"    },  // gauche
  IV:   { dx: -46, dy: -2,  anchor: "end"    },  // gauche
  V:    { dx: -48, dy: 4,   anchor: "end"    },  // gauche
  VI:   { dx: 48,  dy: 4,   anchor: "start"  },  // droite
  VII:  { dx: -48, dy: 4,   anchor: "end"    },  // gauche
  VIII: { dx: 0,   dy: -38, anchor: "middle" },  // au-dessus
  IX:   { dx: 46,  dy: 4,   anchor: "start"  },  // droite
  X:    { dx: 50,  dy: 4,   anchor: "start"  },  // droite
  XI:   { dx: -44, dy: -6,  anchor: "end"    },  // gauche-haut
  XII:  { dx: -50, dy: 4,   anchor: "end"    },  // gauche
  XIII: { dx: 0,   dy: 44,  anchor: "middle" },  // en-dessous
  XIV:  { dx: 0,   dy: 44,  anchor: "middle" },  // en-dessous
  XV:   { dx: -32, dy: 44,  anchor: "end"    },  // en-dessous-gauche
};

export default function VicariatsMap() {
  const [selected, setSelected] = useState<Vicariat | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const hub = VICARIATS.find((v) => v.isHub)!;

  const handleSelect = (node: Vicariat) =>
    setSelected((prev) => (prev?.id === node.id ? null : node));

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-50">
      <style>{`
        @keyframes dash-flow { to { stroke-dashoffset: -60; } }
        @keyframes pulse-ring { 0% { r: 18; opacity: 0.5; } 100% { r: 30; opacity: 0; } }
        @keyframes hub-pulse  { 0% { r: 26; opacity: 0.3; } 100% { r: 44; opacity: 0; } }
        .spoke     { animation: dash-flow 2.4s linear infinite; }
        .pulse-ring{ animation: pulse-ring 2s ease-out infinite; }
        .hub-ring  { animation: hub-pulse  2.2s ease-out infinite; }
      `}</style>

      <div className="relative">
        <svg
          viewBox="0 0 920 490"
          className="w-full"
          style={{ display: "block" }}
          aria-label="Carte schématique des 15 vicariats forains"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
            </pattern>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Fond grille */}
          <rect width="920" height="490" fill="url(#grid)" />

          {/* Golfe du Bénin */}
          <path
            d="M 0 448 Q 230 428 460 450 Q 690 472 920 442 L 920 490 L 0 490 Z"
            fill="url(#ocean)" opacity="0.8"
          />
          <text x="460" y="478" textAnchor="middle" fontSize="10" fontWeight="700"
            fill="#3b82f6" opacity="0.6" letterSpacing="3" fontFamily="system-ui, sans-serif">
            GOLFE DU BÉNIN
          </text>

          {/* Boussole */}
          <g transform="translate(876, 56)">
            <circle cx="0" cy="0" r="22" fill="white" stroke="#e2e8f0" strokeWidth="1" opacity="0.95" />
            <text x="0" y="-10" textAnchor="middle" fontSize="8" fontWeight="800" fill="#64748b" fontFamily="system-ui">N</text>
            <text x="0" y="15"  textAnchor="middle" fontSize="8" fontWeight="800" fill="#64748b" fontFamily="system-ui">S</text>
            <text x="13" y="3"  textAnchor="middle" fontSize="8" fontWeight="800" fill="#64748b" fontFamily="system-ui">E</text>
            <text x="-13" y="3" textAnchor="middle" fontSize="8" fontWeight="800" fill="#64748b" fontFamily="system-ui">O</text>
            <line x1="0" y1="-16" x2="0" y2="16" stroke="#cbd5e1" strokeWidth="0.8" />
            <line x1="-16" y1="0" x2="16" y2="0" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="2.5" fill="#b45309" />
          </g>

          {/* ── Spokes ──────────────────────────────────────────── */}
          {VICARIATS.filter((n) => !n.isHub).map((n) => {
            const active = hovered === n.id || selected?.id === n.id;
            return (
              <g key={`spoke-${n.id}`}>
                {/* Glow */}
                <line x1={n.x} y1={n.y} x2={hub.x} y2={hub.y}
                  stroke={n.hexColor} strokeWidth={active ? 3.5 : 1.8}
                  strokeOpacity={active ? 0.22 : 0.10} strokeLinecap="round" />
                {/* Animated dash */}
                <line x1={n.x} y1={n.y} x2={hub.x} y2={hub.y}
                  stroke={n.hexColor} strokeWidth={active ? 2.5 : 1.5}
                  strokeOpacity={active ? 0.95 : 0.42} strokeLinecap="round"
                  strokeDasharray="6 10" className="spoke"
                  style={{ animationDuration: `${2.1 + (parseInt(n.id, 36) % 5) * 0.18}s` }}
                />
              </g>
            );
          })}

          {/* ── Hub pulse ───────────────────────────────────────── */}
          <circle cx={hub.x} cy={hub.y} r="26" fill={hub.hexColor} className="hub-ring" />
          <circle cx={hub.x} cy={hub.y} r="26" fill={hub.hexColor} className="hub-ring"
            style={{ animationDelay: "1.1s" }} />

          {/* ── Nodes ───────────────────────────────────────────── */}
          {VICARIATS.map((node) => {
            const isSelected = selected?.id === node.id;
            const isHovered  = hovered === node.id;
            const lbl = LABEL_OFFSET[node.id] ?? { dx: 0, dy: -38, anchor: "middle" };
            const r   = node.isHub ? 22 : 16;

            return (
              <g key={node.id} style={{ cursor: "pointer" }}
                onClick={() => handleSelect(node)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Pulse ring on interact */}
                {(isSelected || isHovered) && (
                  <circle cx={node.x} cy={node.y} r={r} fill={node.hexColor}
                    opacity="0" className="pulse-ring" />
                )}

                {/* Drop shadow */}
                <circle cx={node.x + 1.5} cy={node.y + 2.5} r={r + 2}
                  fill="rgba(0,0,0,0.14)" />

                {/* Main circle */}
                <circle cx={node.x} cy={node.y} r={r}
                  fill={node.hexColor} stroke="white"
                  strokeWidth={node.isHub ? 3.5 : 2.5}
                  opacity={isSelected || isHovered ? 1 : 0.9}
                />

                {/* ID */}
                <text x={node.x} y={node.y + 1} textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={node.isHub ? "11" : "9"} fontWeight="900"
                  fill="white" fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.id}
                </text>

                {/* Name label */}
                <text x={node.x + lbl.dx} y={node.y + lbl.dy}
                  textAnchor={lbl.anchor} fontSize="10" fontWeight={isSelected ? "800" : "600"}
                  fill={isSelected ? node.hexColor : "#334155"}
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.name}
                </text>

                {/* Zone sub-label */}
                <text x={node.x + lbl.dx} y={node.y + lbl.dy + 13}
                  textAnchor={lbl.anchor} fontSize="8.5" fontWeight="500"
                  fill="#94a3b8" fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.zone}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Info panel ──────────────────────────────────────── */}
        {selected && (
          <div className="absolute bottom-4 right-4 z-10 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-64
            animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button onClick={() => setSelected(null)}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400
                hover:text-slate-600 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-[10px] font-black
              uppercase tracking-wider mb-3" style={{ background: selected.hexColor }}>
              Vicariat {selected.id}
            </div>

            <h3 className="font-extrabold text-slate-900 text-sm leading-tight mb-0.5">{selected.name}</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">{selected.zone}</p>

            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
                <Church className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                <p className="text-xl font-black text-slate-800">{selected.paroisses}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">paroisses</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
                <Users className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                <p className="text-xl font-black text-slate-800">{selected.lecteurs.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">lecteurs</p>
              </div>
            </div>

            <Link
              href={`/nos-vicariats/${selected.slug}`}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-white text-xs
                font-bold transition-opacity hover:opacity-90"
              style={{ background: selected.hexColor }}
            >
              Voir le vicariat <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
