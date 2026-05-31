import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { NewsPostsAsync } from "@/components/news/NewsPostsAsync";
import { NewsListSkeleton } from "@/components/public/PublicPageSkeleton";

export const revalidate = 120;

export default function NewsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col mb-12 text-center md:text-left">
          <Badge className="bg-amber-100 text-amber-900 w-max mb-4 hover:bg-amber-200 mx-auto md:mx-0">
            A la une
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Blog & Actualités
          </h1>
          <p className="mt-4 text-xl text-slate-500 max-w-2xl">
            Tenez-vous informés des dernières nouveautés, événements et décisions de notre grande communauté de lecteurs.
          </p>
        </div>

        <Suspense fallback={<NewsListSkeleton />}>
          <NewsPostsAsync />
        </Suspense>
      </div>
    </div>
  );
}
