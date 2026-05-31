"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
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
  subtitle?: string;
  collapsed?: boolean;
}

export default function SidebarUserMenu({ name, initial, subtitle, collapsed = false }: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);

  const avatar = (
    <Avatar className="h-8 w-8 border-2 border-amber-600/40 shrink-0">
      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-700 text-amber-50 font-bold">
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      {collapsed ? (
        <div className="relative group/user flex justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-1 rounded-xl hover:bg-amber-800/45 transition-colors"
            aria-label="Ouvrir le menu de déconnexion"
          >
            {avatar}
          </button>
          <span className="
            pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
            bg-amber-950 text-amber-50 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap
            opacity-0 group-hover/user:opacity-100 transition-opacity duration-150
            z-50 shadow-lg border border-amber-700/40
          ">
            {name}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left bg-amber-800/30 border border-amber-700/35 rounded-xl p-2.5 backdrop-blur-sm
                     hover:bg-amber-800/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0 px-1 py-1">
            {avatar}
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold text-amber-50 truncate max-w-[140px]">{name}</span>
              <span className="text-xs text-amber-300/80 truncate max-w-[140px]">
                {subtitle || "Sans paroisse"}
              </span>
            </div>
          </div>
        </button>
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
