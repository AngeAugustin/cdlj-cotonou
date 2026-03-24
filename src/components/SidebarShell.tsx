"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3, Users, Building2, Map, Shield,
  Activity, FileText, Wallet, Award, GraduationCap,
  PanelLeftClose, PanelLeftOpen, Bell, Search, Settings,
} from "lucide-react";
import SidebarUserMenu from "@/components/SidebarUserMenu";
import LiveClock from "@/components/LiveClock";

const ALL_NAV = [
  { name: "Tableau de Bord", href: "/dashboard",   icon: BarChart3,      roles: ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Lecteurs",        href: "/lecteurs",     icon: Users,          roles: ["PAROISSIAL"] },
  { name: "Paroisses",       href: "/paroisses",    icon: Building2,      roles: ["VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Vicariats",       href: "/vicariats",    icon: Map,            roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Activités",       href: "/activites",    icon: Activity,       roles: ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "A. Générales",    href: "/assemblees",   icon: FileText,       roles: ["VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Cotisations",     href: "/cotisations",  icon: Wallet,         roles: ["VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Grades",          href: "/grades",       icon: Award,          roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Évaluations",     href: "/evaluations",  icon: GraduationCap,  roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Utilisateurs",    href: "/utilisateurs", icon: Shield,         roles: ["SUPERADMIN"] },
];

interface SidebarShellProps {
  user: { name?: string | null; roles: string[] };
  children: React.ReactNode;
}

export default function SidebarShell({ user, children }: SidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navigation = ALL_NAV.filter((item) =>
    item.roles.some((role) => user.roles.includes(role))
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        style={{ width: collapsed ? "4rem" : "18rem" }}
        className="hidden lg:flex flex-col shrink-0 transition-[width] duration-300 ease-in-out
                   text-slate-300 min-h-screen border-r border-white/5 shadow-2xl
                   sticky top-0 h-screen z-40 overflow-hidden
                   bg-gradient-to-b from-amber-950/90 via-amber-900/70 to-slate-900/90 backdrop-blur-2xl"
      >
        {/* Background glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-800/10 via-transparent to-slate-900/30 pointer-events-none" />
        <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-slate-800/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col h-full relative z-10 overflow-hidden">

          {/* ── Header logo + toggle ── */}
          <div
            className={`flex items-center mb-0 transition-all duration-300
              ${collapsed ? "justify-center p-3" : "justify-between p-8 pb-3"}`}
          >
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-4 group min-w-0">
                <div className="rounded-xl w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src="https://i.postimg.cc/BnnDpTc2/CDLJ.png"
                    alt="Logo CDLJ"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight truncate">
                    Portail CDLJ
                  </h1>
                  <span className="text-xs font-medium text-amber-500 uppercase tracking-widest">
                    {user.roles[0] || "Paroissial"}
                  </span>
                </div>
              </Link>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 shrink-0"
              aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
            >
              {collapsed
                ? <PanelLeftOpen  className="w-5 h-5" />
                : <PanelLeftClose className="w-5 h-5" />
              }
            </button>
          </div>

          {/* ── Navigation ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-0.5 custom-scrollbar">
            {!collapsed && (
              <p className="px-4 text-xs font-bold text-amber-200/40 uppercase tracking-widest mb-3 mt-2">
                Menu Principal
              </p>
            )}

            {navigation.map((item) => (
              <div key={item.href} className="relative group/nav">
                <Link
                  href={item.href}
                  className={`flex items-center py-2.5 rounded-xl font-medium transition-all duration-200
                    hover:bg-amber-900/50 hover:text-white group
                    ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}
                >
                  <item.icon className="w-5 h-5 text-amber-600 group-hover:text-amber-400 transition-colors shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>

                {/* Tooltip mode réduit */}
                {collapsed && (
                  <span className="
                    pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                    bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap
                    opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150
                    z-50 shadow-lg border border-white/10
                  ">
                    {item.name}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── User menu ── */}
          <div className="p-2 mt-auto">
            <SidebarUserMenu
              name={user.name || "Utilisateur"}
              initial={user.name?.charAt(0) || "U"}
              collapsed={collapsed}
            />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden min-w-0">

        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60
                           flex items-center justify-between px-8 lg:px-12
                           sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="relative group hidden sm:block">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
              <input
                type="text"
                placeholder="Recherche rapide..."
                className="pl-11 pr-4 py-2.5 bg-slate-100 hover:bg-slate-200/50 focus:bg-white
                           border-transparent focus:border-amber-900/20 focus:ring-amber-900/20
                           rounded-full text-sm font-medium transition-all w-64 focus:w-80 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-900 rounded-full transition-colors group">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-900 rounded-full transition-colors lg:hidden">
              <Settings className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center pl-5 border-l border-slate-200">
              <LiveClock />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
