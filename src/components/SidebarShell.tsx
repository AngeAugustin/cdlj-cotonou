"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  BarChart3, Users, Building2, Map, Shield,
  Activity, FileText, Wallet, Award, GraduationCap,
  PanelLeftClose, PanelLeftOpen, Bell, Search, Newspaper, Menu, X, User, LogOut,
  Image as ImageIcon,
} from "lucide-react";
import SidebarUserMenu from "@/components/SidebarUserMenu";
import { SidebarNavScroll } from "@/components/SidebarNavScroll";
import LiveClock from "@/components/LiveClock";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function initialsFromDisplayName(name: string | null | undefined): string {
  const n = (name ?? "U").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? "U").toUpperCase();
}

const ALL_NAV = [
  { name: "Tableau de Bord", href: "/dashboard",   icon: BarChart3,      roles: ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Lecteurs",        href: "/lecteurs",     icon: Users,          roles: ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Paroisses",       href: "/paroisses",    icon: Building2,      roles: ["VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Vicariats",       href: "/vicariats",    icon: Map,            roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Activités",       href: "/activites",    icon: Activity,       roles: ["PAROISSIAL", "VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "A. Générales",    href: "/assemblees",   icon: FileText,       roles: ["VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
 // { name: "Cotisations",     href: "/cotisations",  icon: Wallet,         roles: ["VICARIAL", "DIOCESAIN", "SUPERADMIN"] },
  { name: "Grades",          href: "/grades",       icon: Award,          roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Évaluations",     href: "/evaluations",  icon: GraduationCap,  roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Actualités",      href: "/actualites",   icon: Newspaper,      roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Médiathèque",     href: "/gestion-mediatheque", icon: ImageIcon, roles: ["DIOCESAIN", "SUPERADMIN"] },
  { name: "Utilisateurs",    href: "/utilisateurs", icon: Shield,         roles: ["SUPERADMIN"] },
];

interface SidebarShellProps {
  user: { name?: string | null; roles: string[]; paroisseName?: string | null };
  children: React.ReactNode;
}

const SIDEBAR_BASE =
  "text-amber-100/85 min-h-screen border-r border-amber-800/25 shadow-2xl " +
  "bg-gradient-to-b from-amber-900/92 via-amber-950/88 to-amber-950/95 backdrop-blur-2xl";

const SIDEBAR_GLOWS = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-700/20 via-amber-900/5 to-amber-950/50 pointer-events-none" />
    <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-amber-500/12 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-amber-800/30 rounded-full blur-[100px] pointer-events-none" />
  </>
);

export default function SidebarShell({ user, children }: SidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [mobileLogoutConfirmOpen, setMobileLogoutConfirmOpen] = useState(false);
  const normalizedUserRoles = (user.roles ?? []).map((role) => role.trim().toUpperCase());
  const hasVicarialRole = normalizedUserRoles.includes("VICARIAL");

  const navigation = ALL_NAV.filter((item) => {
    // Règle métier: un profil VICARIAL ne doit jamais voir l'entrée "Vicariats".
    if (hasVicarialRole && item.href === "/vicariats") {
      return false;
    }
    return item.roles.some((role) => normalizedUserRoles.includes(role));
  });

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-amber-950/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col
                    ${SIDEBAR_BASE}
                    transition-transform duration-300 ease-out lg:hidden
                    ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {SIDEBAR_GLOWS}

        <div className="relative z-10 flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-amber-700/30">
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0" onClick={() => setMobileMenuOpen(false)}>
              <div className="rounded-xl w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                <img src="https://i.postimg.cc/BnnDpTc2/CDLJ.png" alt="Logo CDLJ" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-amber-50 truncate">Portail CDLJ</p>
                <p className="text-[10px] font-medium text-amber-300/90 uppercase tracking-widest">
                  {user.roles[0] || "Paroissial"}
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="p-2 rounded-xl text-amber-200/70 hover:text-amber-50 hover:bg-amber-800/40 transition-colors"
              aria-label="Fermer le menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <SidebarNavScroll className="px-2 pb-24">
            <p className="px-4 text-xs font-bold text-amber-400/50 uppercase tracking-widest mb-3 mt-4">
              Menu Principal
            </p>
            <div className="space-y-0.5">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-amber-100/80 transition-all duration-200 hover:bg-amber-800/45 hover:text-amber-50 group"
              >
                <item.icon className="w-5 h-5 text-amber-300/80 group-hover:text-amber-200 shrink-0 transition-colors" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
            </div>
          </SidebarNavScroll>

        </div>
      </aside>

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        style={{ width: collapsed ? "4rem" : "18rem" }}
        className={`hidden lg:flex flex-col shrink-0 transition-[width] duration-300 ease-in-out
                   sticky top-0 h-screen z-40 overflow-hidden ${SIDEBAR_BASE}`}
      >
        {SIDEBAR_GLOWS}

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
                  <h1 className="text-xl font-extrabold text-amber-50 tracking-tight leading-tight truncate">
                    Portail CDLJ
                  </h1>
                  <span className="text-xs font-medium text-amber-300/90 uppercase tracking-widest">
                    {user.roles[0] || "Paroissial"}
                  </span>
                </div>
              </Link>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl text-amber-300/70 hover:text-amber-50 hover:bg-amber-800/40 transition-all duration-200 shrink-0"
              aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
            >
              {collapsed
                ? <PanelLeftOpen  className="w-5 h-5" />
                : <PanelLeftClose className="w-5 h-5" />
              }
            </button>
          </div>

          {/* ── Navigation ── */}
          <SidebarNavScroll className="px-2 pb-4">
            {!collapsed && (
              <p className="px-4 text-xs font-bold text-amber-400/50 uppercase tracking-widest mb-3 mt-2">
                Menu Principal
              </p>
            )}

            <div className="space-y-0.5">
            {navigation.map((item) => (
              <div key={item.href} className="relative group/nav">
                <Link
                  href={item.href}
                  className={`flex items-center py-2.5 rounded-xl font-medium text-amber-100/80 transition-all duration-200
                    hover:bg-amber-800/45 hover:text-amber-50 group
                    ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}
                >
                  <item.icon className="w-5 h-5 text-amber-300/80 group-hover:text-amber-200 transition-colors shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>

                {/* Tooltip mode réduit */}
                {collapsed && (
                  <span className="
                    pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                    bg-amber-950 text-amber-50 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap
                    opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150
                    z-50 shadow-lg border border-amber-700/40
                  ">
                    {item.name}
                  </span>
                )}
              </div>
            ))}
            </div>
          </SidebarNavScroll>

          {/* ── User menu ── */}
          <div className="p-2 mt-auto">
            <SidebarUserMenu
              name={user.name || "Utilisateur"}
              initial={initialsFromDisplayName(user.name)}
              subtitle={user.paroisseName || undefined}
              collapsed={collapsed}
            />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden min-w-0">

        {/* Top Navbar */}
        <header className="min-h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60
                           flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-12 py-3
                           sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              type="button"
              className="p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-900 rounded-full transition-colors lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative group flex-1 min-w-0 max-w-xl">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
              <input
                type="text"
                placeholder="Recherche rapide..."
                className="pl-11 pr-4 py-2.5 bg-slate-100 hover:bg-slate-200/50 focus:bg-white
                           border-transparent focus:border-amber-900/20 focus:ring-amber-900/20
                           rounded-full text-sm font-medium transition-all w-full outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setMobileUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full p-0.5 pr-2 sm:pr-3
                           hover:bg-amber-50 transition-colors border border-transparent
                           hover:border-amber-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/30"
                aria-label="Ouvrir le menu utilisateur"
              >
                <Avatar className="h-9 w-9 border-2 border-slate-200 shadow-sm shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-700 text-white text-sm font-bold">
                    {initialsFromDisplayName(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-semibold text-slate-700 max-w-[140px] truncate">
                  {user.name || "Profil"}
                </span>
              </button>
              {mobileUserMenuOpen ? (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-40 p-1.5">
                  <Link
                    href="/profil"
                    onClick={() => setMobileUserMenuOpen(false)}
                    className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4" /> Voir profil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileUserMenuOpen(false);
                      setMobileLogoutConfirmOpen(true);
                    }}
                    className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </div>
              ) : null}
            </div>

            <Link
              href="/profil"
              className="hidden lg:flex items-center gap-2 rounded-full p-0.5 pr-2 sm:pr-3
                         hover:bg-amber-50 transition-colors border border-transparent
                         hover:border-amber-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/30"
              aria-label="Mon profil"
            >
              <Avatar className="h-9 w-9 border-2 border-slate-200 shadow-sm shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-700 text-white text-sm font-bold">
                  {initialsFromDisplayName(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-semibold text-slate-700 max-w-[140px] truncate">
                {user.name || "Profil"}
              </span>
            </Link>
            <button className="relative p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-900 rounded-full transition-colors group">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
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

      <Dialog open={mobileLogoutConfirmOpen} onOpenChange={setMobileLogoutConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Confirmer la déconnexion</DialogTitle>
            <DialogDescription className="text-center">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre espace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMobileLogoutConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
