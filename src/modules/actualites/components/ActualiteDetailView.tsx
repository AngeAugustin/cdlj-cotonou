import Link from "next/link";
import {
  Calendar, Tag, Clock, ImageOff, Eye, Heart, MessageCircle,
  BarChart3, Edit2, ExternalLink,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Actualite } from "./ArticleForm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export function ActualiteDetailView({
  article,
  showActions = true,
}: {
  article: Actualite;
  showActions?: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
      {article.image ? (
        <div className="relative h-56 sm:h-72 w-full overflow-hidden">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-r from-amber-800 to-amber-900 flex items-center justify-center">
          <ImageOff className="w-10 h-10 text-white/40" />
        </div>
      )}

      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
            <Tag className="w-3 h-3" /> {article.category}
          </span>
          <span
            className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${
              article.published
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {article.published ? "Publié" : "Brouillon"}
          </span>
          {article.featured && (
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700">
              À la une
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
          <span>{article.author}{article.authorRole && ` · ${article.authorRole}`}</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-700" />
            {formatDate(article.createdAt)}
          </span>
          {article.readTime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-700" />
              {article.readTime}
            </span>
          )}
          {article.published && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-700" />
                {article.viewCount ?? 0} vues
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-amber-700" />
                {article.likeCount ?? 0} likes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-amber-700" />
                {article.commentCount ?? 0} commentaires
              </span>
            </>
          )}
        </div>

        {showActions && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={`/actualites/${article._id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5")}
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </Link>
            <Link
              href={`/actualites/${article._id}/stats`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5")}
            >
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </Link>
            {article.published && article.slug && (
              <Link
                href={`/news/${article.slug}`}
                target="_blank"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl gap-1.5")}
              >
                <ExternalLink className="w-4 h-4" />
                Voir en public
              </Link>
            )}
          </div>
        )}

        {(article.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags!.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-lg text-slate-600 font-medium italic border-l-4 border-amber-700 pl-4 mb-8">
          {article.excerpt}
        </p>

        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>
    </div>
  );
}
