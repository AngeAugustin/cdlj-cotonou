"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Lock,
  MessageCircle,
  MessageSquare,
  Share2,
  Users,
} from "lucide-react";
import { FACEBOOK_URL } from "@/config/social-links";

export type CommunitySpace = {
  id: string;
  name: string;
  shortName: string;
  access: "Ouvert" | "Restreint";
  membersLabel: string;
  href?: string;
  external?: boolean;
};

export type CommunityPost = {
  id: string;
  spaceId: string;
  author: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
};

type ForumsCommunityFeedProps = {
  spaces: CommunitySpace[];
  posts: CommunityPost[];
};

const AVATAR_COLORS = [
  "bg-amber-800",
  "bg-sky-700",
  "bg-emerald-700",
  "bg-rose-700",
  "bg-violet-700",
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ForumsCommunityFeed({ spaces, posts }: ForumsCommunityFeedProps) {
  const safeSpaces =
    spaces.length > 0
      ? spaces
      : [
          {
            id: "general",
            name: "Forum Général",
            shortName: "Général",
            access: "Ouvert" as const,
            membersLabel: "Tous les membres",
            href: FACEBOOK_URL,
            external: true,
          },
        ];

  const [activeId, setActiveId] = useState(safeSpaces[0].id);
  const active = safeSpaces.find((s) => s.id === activeId) ?? safeSpaces[0];

  const feed = useMemo(() => {
    const filtered = posts.filter((p) => p.spaceId === active.id);
    return filtered.length > 0 ? filtered : posts.slice(0, 3);
  }, [posts, active.id]);

  useEffect(() => {
    if (safeSpaces.length < 2) return;
    const id = window.setInterval(() => {
      setActiveId((current) => {
        const idx = safeSpaces.findIndex((s) => s.id === current);
        const next = safeSpaces[(idx + 1) % safeSpaces.length];
        return next.id;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, [safeSpaces]);

  const isOpen = active.access === "Ouvert";

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_80px_-24px_rgba(69,26,3,0.28)] ring-1 ring-black/[0.04]">
        {/* App header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-amber-950 to-amber-900 px-4 py-3 text-amber-50">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Users className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight truncate">Communauté CDLJ</p>
            <p className="text-[11px] text-amber-100/70 truncate">
              Espaces · discussions · lecteurs juniors
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En ligne
          </span>
        </div>

        <div className="grid sm:grid-cols-[148px_1fr] min-h-[340px]">
          {/* Spaces sidebar */}
          <aside className="border-b sm:border-b-0 sm:border-r border-slate-100 bg-[#faf9f7] p-3">
            <p className="mb-2 px-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Espaces
            </p>
            <ul className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
              {safeSpaces.map((space) => {
                const selected = space.id === active.id;
                return (
                  <li key={space.id} className="shrink-0 sm:shrink">
                    <button
                      type="button"
                      onClick={() => setActiveId(space.id)}
                      className={`w-full text-left rounded-xl px-2.5 py-2 transition-colors ${
                        selected
                          ? "bg-amber-100/90 text-amber-950 shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {space.access === "Restreint" ? (
                          <Lock className="size-3.5 shrink-0 opacity-70" />
                        ) : (
                          <MessageSquare className="size-3.5 shrink-0 opacity-70" />
                        )}
                        <span className="text-xs font-semibold truncate">{space.shortName}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Feed */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Fil d&apos;actualité
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">{active.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{active.membersLabel}</p>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  isOpen
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-amber-50 border-amber-100 text-amber-900"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${isOpen ? "bg-emerald-500" : "bg-amber-600"}`}
                />
                {active.access}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 p-3 sm:p-4 bg-slate-50/60">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-2.5"
                >
                  {feed.map((post, index) => (
                    <article
                      key={post.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/30"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                            AVATAR_COLORS[index % AVATAR_COLORS.length]
                          }`}
                        >
                          {initials(post.author)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <p className="text-xs font-bold text-slate-900">{post.author}</p>
                            <p className="text-[10px] text-slate-400">{post.role}</p>
                            <p className="text-[10px] text-slate-300">· {post.time}</p>
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
                            {post.content}
                          </p>
                          <div className="mt-2.5 flex items-center gap-3 text-[11px] font-medium text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="size-3.5" />
                              {post.likes}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="size-3.5" />
                              {post.comments}
                            </span>
                            <span className="inline-flex items-center gap-1 ml-auto">
                              <Share2 className="size-3.5" />
                              Partager
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {active.href && active.external ? (
              <a
                href={active.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-amber-900 hover:bg-amber-50/60 transition-colors"
              >
                Ouvrir cet espace →
              </a>
            ) : (
              <div className="border-t border-slate-100 px-4 py-3 text-center text-xs font-medium text-slate-400">
                Accès réservé aux membres autorisés
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
