"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye, Heart, MessageCircle, Loader2, Trash2, MapPin,
} from "lucide-react";
import type { EngagementStats } from "@/modules/actualites/engagement/repository";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatLocation(city: string | null, country: string | null, region: string | null) {
  const parts = [city, region, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Inconnu";
}

function LocationTable({
  title,
  rows,
}: {
  title: string;
  rows: { country: string; city: string | null; count: number }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <h4 className="text-sm font-bold text-slate-800 mb-2">{title}</h4>
        <p className="text-xs text-slate-400">Aucune donnée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <h4 className="text-sm font-bold text-slate-800 mb-3">{title}</h4>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {rows.map((row) => (
          <div
            key={`${row.country}-${row.city ?? ""}`}
            className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-100"
          >
            <span className="text-slate-600">
              {row.city ? `${row.city}, ` : ""}{row.country}
            </span>
            <span className="font-bold text-slate-800 tabular-nums">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActualiteEngagementPanel({
  actualiteId,
  onToast,
}: {
  actualiteId: string;
  onToast?: (message: string, type?: "success" | "error") => void;
}) {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/actualites/${actualiteId}/engagement`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setStats(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible de charger les statistiques";
      setError(message);
      onToast?.(message, "error");
    } finally {
      setLoading(false);
    }
  }, [actualiteId, onToast]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/actualites/${actualiteId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setStats((prev) =>
        prev
          ? {
              ...prev,
              commentCount: Math.max(0, prev.commentCount - 1),
              comments: prev.comments.filter((c) => c.id !== commentId),
            }
          : prev
      );
      onToast?.("Commentaire supprimé");
    } catch {
      onToast?.("Erreur lors de la suppression", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Chargement des statistiques…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center text-red-700 text-sm">
        {error ?? "Statistiques indisponibles."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Vues", value: stats.viewCount, icon: Eye, color: "text-blue-700 bg-blue-50 border-blue-100" },
          { label: "Likes", value: stats.likeCount, icon: Heart, color: "text-red-700 bg-red-50 border-red-100" },
          { label: "Commentaires", value: stats.commentCount, icon: MessageCircle, color: "text-amber-800 bg-amber-50 border-amber-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-2xl border px-5 py-5 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-3xl font-extrabold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <LocationTable title="Vues par localisation" rows={stats.viewsByLocation} />
        <LocationTable title="Likes par localisation" rows={stats.likesByLocation} />
        <LocationTable title="Commentaires par localisation" rows={stats.commentsByLocation} />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900 mb-4">
          Commentaires ({stats.comments.length})
        </h3>
        {stats.comments.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Aucun commentaire pour cet article.</p>
        ) : (
          <ul className="space-y-3">
            {stats.comments.map((comment) => (
              <li
                key={comment.id}
                className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="font-semibold text-sm text-slate-800">{comment.authorName}</span>
                    <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {formatLocation(comment.city, comment.country, comment.region)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingId === comment.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 transition"
                  title="Supprimer le commentaire"
                >
                  {deletingId === comment.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400">
        La localisation (pays, ville/région) est estimée à partir de l&apos;adresse IP du visiteur.
      </p>
    </div>
  );
}
