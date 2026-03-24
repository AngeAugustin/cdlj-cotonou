"use client";

import { signOut } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarUserMenuProps {
  name: string;
  initial: string;
  collapsed?: boolean;
}

export default function SidebarUserMenu({ name, initial, collapsed = false }: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);

  const avatar = (
    <Avatar className="h-8 w-8 border-2 border-white/10 shrink-0">
      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold">
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      {collapsed ? (
        /* Mode réduit : avatar seul centré, tooltip au survol */
        <div className="relative group/user flex justify-center">
          <button
            onClick={() => setOpen(true)}
            className="p-1 rounded-xl hover:bg-amber-900/60 transition-colors"
            aria-label="Déconnexion"
          >
            {avatar}
          </button>
          <span className="
            pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
            bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap
            opacity-0 group-hover/user:opacity-100 transition-opacity duration-150
            z-50 shadow-lg border border-white/10
          ">
            {name}
          </span>
        </div>
      ) : (
        /* Mode étendu : carte complète */
        <div
          className="bg-amber-900/40 border border-amber-800/50 rounded-xl p-2 flex items-center justify-between cursor-pointer hover:bg-amber-900/60 transition-colors"
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-2">
            {avatar}
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white truncate max-w-[100px]">{name}</span>
              <span className="text-xs text-amber-500">Déconnexion</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
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
            <Button variant="outline" onClick={() => setOpen(false)}>
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
    </>
  );
}
