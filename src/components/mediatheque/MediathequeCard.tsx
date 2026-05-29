"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Send,
  Trash2,
} from "lucide-react";
import { formatMediathequeDate } from "@/modules/mediatheque/constants";

export type MediathequeCardData = {
  _id?: string;
  nom: string;
  categorie: string;
  mois: number;
  annee: number;
  coverImage?: string;
  hostingLink: string;
  published?: boolean;
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800";

type MediathequeCardProps = {
  item: MediathequeCardData;
  compact?: boolean;
  mode?: "public" | "admin";
  onTogglePublish?: () => void;
  onDelete?: () => void;
  editHref?: string;
};

function CardCover({
  item,
  compact,
  showStatus,
}: {
  item: MediathequeCardData;
  compact: boolean;
  showStatus?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${compact ? "aspect-[3/2]" : "aspect-[4/3]"}`}>
      {item.coverImage ? (
        <Image
          src={item.coverImage}
          alt={item.nom}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
          <ImageIcon className={compact ? "h-7 w-7 text-amber-300" : "h-10 w-10 text-amber-300"} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <span
        className={`absolute left-2 top-2 rounded-md bg-white/90 font-bold uppercase tracking-wide text-slate-700 backdrop-blur-sm ${
          compact ? "px-1.5 py-0.5 text-[9px]" : "top-3 left-3 px-2.5 py-1 rounded-lg text-[11px]"
        }`}
      >
        {item.categorie}
      </span>
      {showStatus && (
        <span
          className={`absolute right-2 top-2 rounded-md font-semibold backdrop-blur-sm ${
            compact ? "px-1.5 py-0.5 text-[9px]" : "top-3 right-3 px-2.5 py-1 rounded-full text-[11px]"
          } ${item.published ? "bg-emerald-100/95 text-emerald-700" : "bg-slate-900/75 text-white"}`}
        >
          {item.published ? "Publié" : "Brouillon"}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className={`flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg ${
            compact ? "h-8 w-8" : "h-12 w-12"
          }`}
        >
          <ExternalLink className={compact ? "h-3.5 w-3.5 text-amber-900" : "h-5 w-5 text-amber-900"} />
        </div>
      </div>
      <span
        className={`absolute bottom-2 left-2 font-medium text-white/90 ${
          compact ? "text-[9px]" : "bottom-3 left-3 text-[11px]"
        }`}
      >
        {formatMediathequeDate(item.mois, item.annee)}
      </span>
    </div>
  );
}

export function MediathequeCard({
  item,
  compact = false,
  mode = "public",
  onTogglePublish,
  onDelete,
  editHref,
}: MediathequeCardProps) {
  const shellClass = `group block overflow-hidden border border-slate-200/70 bg-white hover:border-amber-200/70 hover:shadow-md hover:shadow-amber-900/5 transition-all duration-300 ${
    compact ? "rounded-xl" : "rounded-2xl hover:shadow-lg"
  }`;

  const titleClass = `font-bold leading-snug text-slate-800 transition-colors line-clamp-2 group-hover:text-amber-900 ${
    compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
  }`;

  if (mode === "public") {
    return (
      <a
        href={item.hostingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={shellClass}
      >
        <CardCover item={item} compact={compact} />
        <div className={compact ? "p-2.5" : "p-4"}>
          <h3 className={titleClass}>{item.nom}</h3>
        </div>
      </a>
    );
  }

  return (
    <article className={shellClass}>
      <a href={item.hostingLink} target="_blank" rel="noopener noreferrer" className="block">
        <CardCover item={item} compact={compact} showStatus />
      </a>
      <div className={compact ? "p-2.5" : "p-4"}>
        <p className={titleClass}>{item.nom}</p>
        <div className="mt-2 flex items-center justify-end gap-0.5 border-t border-slate-100 pt-2">
          {!item.published ? (
            <button
              type="button"
              onClick={onTogglePublish}
              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-green-50 hover:text-green-600"
              title="Publier"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onTogglePublish}
              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              title="Dépublier"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={item.hostingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-700"
            title="Ouvrir le lien"
          >
            <Eye className="h-3.5 w-3.5" />
          </a>
          {editHref && (
            <Link
              href={editHref}
              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-700"
              title="Modifier"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export const MEDIATHEQUE_COMPACT_GRID =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3";

export const MEDIATHEQUE_DEFAULT_GRID =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";
