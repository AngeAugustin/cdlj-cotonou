import { MediathequeService } from "@/modules/mediatheque/service";
import { MediathequePublicGrid, type PublicMediathequeItem } from "@/components/mediatheque/MediathequePublicGrid";

export default async function MediathequePage() {
  let items: PublicMediathequeItem[] = [];

  try {
    const service = new MediathequeService();
    const data = await service.getMediatheques(true);
    items = data.map((d) => ({
      _id: String(d._id),
      nom: d.nom,
      categorie: d.categorie,
      mois: d.mois,
      annee: d.annee,
      coverImage: d.coverImage,
      hostingLink: d.hostingLink,
    }));
  } catch {
    items = [];
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Médiathèque
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Photos, vidéos & ressources
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-2xl">
            Retrouvez ici les archives visuelles et documentaires de la Communauté Diocésaine des Lecteurs Juniors.
          </p>
        </div>

        <MediathequePublicGrid items={items} compact />
      </div>
    </div>
  );
}
