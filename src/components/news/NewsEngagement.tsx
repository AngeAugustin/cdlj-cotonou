"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, Loader2, Send, MapPin, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { setClientConsent } from "@/lib/cookie-consent";

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  country: string | null;
  city: string | null;
};

type EngagementData = {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  comments: Comment[];
};

function formatCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLocation(city: string | null, country: string | null) {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return null;
}

function ConsentNotice({
  consent,
  onAccept,
}: {
  consent: "pending" | "rejected";
  onAccept: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4 mb-6">
      <div className="flex gap-3">
        <Cookie className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">
            {consent === "pending"
              ? "Cookies requis pour interagir"
              : "Cookies refusés"}
          </p>
          <p className="text-sm text-amber-900/80 mt-1 leading-relaxed">
            {consent === "pending"
              ? "Acceptez les cookies pour enregistrer votre vue, liker ou commenter cet article."
              : "Vous avez refusé les cookies d'engagement. Vous pouvez consulter les commentaires, mais pas interagir."}{" "}
            <Link href="/confidentialite" className="underline font-medium">
              Politique de confidentialité
            </Link>
          </p>
          {consent === "pending" && (
            <Button
              type="button"
              size="sm"
              onClick={onAccept}
              className="mt-3 bg-amber-900 hover:bg-amber-800 text-white rounded-lg"
            >
              Accepter les cookies
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewsEngagement({ slug }: { slug: string }) {
  const consent = useCookieConsent();
  const canInteract = consent === "accepted";
  const consentBlocked = consent === "rejected" || consent === null;

  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadEngagement = useCallback(async () => {
    const res = await fetch(`/api/public/actualites/${encodeURIComponent(slug)}/engagement`);
    if (!res.ok) throw new Error("Impossible de charger les interactions");
    return res.json() as Promise<EngagementData>;
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (consent === "accepted") {
          await fetch(`/api/public/actualites/${encodeURIComponent(slug)}/view`, { method: "POST" });
        }
        const engagement = await loadEngagement();
        if (!cancelled) setData(engagement);
      } catch {
        if (!cancelled) setError("Impossible de charger les interactions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => { cancelled = true; };
  }, [slug, consent, loadEngagement]);

  const handleLike = async () => {
    if (!canInteract || !data || data.hasLiked || liking) return;
    setLiking(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/actualites/${encodeURIComponent(slug)}/like`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Erreur");
      setData((prev) =>
        prev
          ? {
              ...prev,
              hasLiked: true,
              likeCount: json.likeCount ?? prev.likeCount + (json.added ? 1 : 0),
            }
          : prev
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors du like");
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInteract || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/actualites/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Erreur");
      setData((prev) =>
        prev
          ? {
              ...prev,
              commentCount: json.commentCount ?? prev.commentCount + 1,
              comments: [json.comment, ...prev.comments],
            }
          : prev
      );
      setAuthorName("");
      setContent("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-16 flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Chargement…
      </div>
    );
  }

  if (!data) {
    return error ? (
      <p className="mt-16 text-center text-sm text-red-600">{error}</p>
    ) : null;
  }

  return (
    <section className="mt-16 border-t border-slate-100 pt-12">
      {consentBlocked && (
        <ConsentNotice
          consent={consent === "rejected" ? "rejected" : "pending"}
          onAccept={() => setClientConsent("accepted")}
        />
      )}

      <div className="flex flex-wrap items-center gap-6 mb-10">
        <div className="flex items-center gap-2 text-slate-600">
          <Eye className="w-5 h-5 text-amber-700" />
          <span className="font-semibold tabular-nums">{data.viewCount}</span>
          <span className="text-sm">vue{data.viewCount !== 1 ? "s" : ""}</span>
        </div>

        <button
          type="button"
          onClick={handleLike}
          disabled={!canInteract || data.hasLiked || liking}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all
            ${data.hasLiked
              ? "bg-red-50 text-red-600 border border-red-100 cursor-default"
              : canInteract
                ? "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                : "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
            }`}
        >
          {liking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className={`w-4 h-4 ${data.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
          )}
          <span className="tabular-nums">{data.likeCount}</span>
          <span>{data.hasLiked ? "Merci !" : "J'aime"}</span>
        </button>

        <div className="flex items-center gap-2 text-slate-600">
          <MessageCircle className="w-5 h-5 text-amber-700" />
          <span className="font-semibold tabular-nums">{data.commentCount}</span>
          <span className="text-sm">commentaire{data.commentCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-6">
            Commentaires ({data.comments.length})
          </h2>

          {data.comments.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
              Soyez le premier à commenter cet article.
            </p>
          ) : (
            <ul className="space-y-4">
              {data.comments.map((comment) => {
                const location = formatLocation(comment.city, comment.country);
                return (
                  <li
                    key={comment.id}
                    className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{comment.authorName}</p>
                          <p className="text-xs text-slate-400">{formatCommentDate(comment.createdAt)}</p>
                        </div>
                      </div>
                      {location && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 shrink-0">
                          <MapPin className="w-3 h-3" />
                          {location}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          {canInteract ? (
            <form
              onSubmit={handleComment}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-extrabold text-slate-900 mb-1">Laisser un commentaire</h3>
              <p className="text-xs text-slate-400 mb-5">
                Pas de compte requis. Un cookie anonyme identifie votre navigateur.
              </p>

              {error && (
                <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                maxLength={60}
                placeholder="Votre prénom"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none mb-4
                           focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30"
              />

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Commentaire <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                maxLength={2000}
                rows={4}
                placeholder="Partagez votre avis…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none mb-4 resize-none
                           focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30"
              />

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publier
              </Button>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm text-slate-500">
              <p className="font-semibold text-slate-700 mb-2">Commentaires désactivés</p>
              <p>
                Acceptez les cookies d&apos;engagement via la bannière en bas de page pour publier un
                commentaire ou liker l&apos;article.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
