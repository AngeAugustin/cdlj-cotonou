import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type NewspaperStory = {
  title: string;
  category: string;
  excerpt?: string;
  date?: string;
  image?: string;
  slug?: string;
};

type NewsRetroNewspaperProps = {
  stories: NewspaperStory[];
};

const FALLBACK_STORIES: NewspaperStory[] = [
  {
    title: "La communauté célèbre la Parole",
    category: "À la une",
    excerpt:
      "Assemblées, formations et célébrations rythment la vie des lecteurs juniors à Cotonou.",
    date: "Édition du jour",
  },
  {
    title: "Weekend de formation des animateurs",
    category: "Formation",
    excerpt: "Les animateurs se retrouvent pour grandir dans le service liturgique.",
  },
  {
    title: "Vie des vicariats",
    category: "Territoire",
    excerpt: "Les quinze vicariats forains relaient la mission diocésaine.",
  },
];

function StoryLink({
  story,
  className,
  children,
}: {
  story: NewspaperStory;
  className?: string;
  children: ReactNode;
}) {
  if (story.slug) {
    return (
      <Link href={`/news/${story.slug}`} className={className} prefetch>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

export function NewsRetroNewspaper({ stories }: NewsRetroNewspaperProps) {
  const items = stories.length > 0 ? stories : FALLBACK_STORIES;
  const [lead, ...rest] = items;
  const sideStories = rest.slice(0, 2);
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      {/* Soft drop / aged shadow */}
      <div
        className="absolute -inset-1 translate-x-1 translate-y-1 rounded-sm bg-amber-950/10 blur-[2px]"
        aria-hidden
      />

      <article
        className="relative overflow-hidden rounded-sm border border-amber-950/15 bg-[#f3e6c4] px-4 py-4 sm:px-5 sm:py-5 shadow-[0_22px_50px_-18px_rgba(69,26,3,0.35)] rotate-[-1.25deg] hover:rotate-0 transition-transform duration-500"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 12% 18%, rgba(120,80,30,0.07), transparent 42%),
            radial-gradient(ellipse at 88% 78%, rgba(90,60,20,0.08), transparent 40%),
            linear-gradient(180deg, rgba(255,255,255,0.22), transparent 28%)
          `,
        }}
      >
        {/* Paper fiber texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />

        <div className="relative font-serif text-amber-950">
          {/* Masthead */}
          <header className="text-center border-b-2 border-double border-amber-950/40 pb-3 mb-3">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-amber-900/70">
              Archidiocèse de Cotonou · Lecteurs Juniors
            </p>
            <h2 className="mt-1 text-2xl sm:text-[1.85rem] font-black tracking-tight leading-none">
              Le Journal CDLJ
            </h2>
            <div className="mt-2 flex items-center justify-between gap-2 text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-900/65 border-y border-amber-950/25 py-1.5">
              <span>Vol. I — N° {String(items.length).padStart(2, "0")}</span>
              <span className="truncate">{lead.date || today}</span>
              <span>Édition</span>
            </div>
          </header>

          {/* Lead story */}
          <StoryLink story={lead} className="group block">
            <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-amber-800/80 mb-1.5">
              {lead.category}
            </p>
            <h3 className="text-xl sm:text-2xl font-black leading-[1.15] tracking-tight group-hover:text-amber-900 transition-colors">
              {lead.title}
            </h3>

            <div className="mt-3 flex gap-3">
              {lead.image ? (
                <div className="relative w-[38%] shrink-0 aspect-[4/3] overflow-hidden border border-amber-950/20 bg-amber-100/50 grayscale-[30%] contrast-[1.05]">
                  <Image
                    src={lead.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="180px"
                    priority
                  />
                </div>
              ) : null}
              <p className="text-[12px] sm:text-[13px] leading-relaxed text-amber-950/80 line-clamp-5">
                {lead.excerpt || "Retrouvez les actualités de la communauté diocésaine."}
              </p>
            </div>
          </StoryLink>

          {/* Secondary columns */}
          {sideStories.length > 0 ? (
            <div className="mt-4 pt-3 border-t border-amber-950/25 grid grid-cols-2 gap-3">
              {sideStories.map((story) => (
                <StoryLink
                  key={`${story.category}-${story.title}`}
                  story={story}
                  className="group min-w-0"
                >
                  <p className="text-[9px] font-sans font-bold uppercase tracking-[0.14em] text-amber-800/75 mb-1">
                    {story.category}
                  </p>
                  <h4 className="text-[13px] sm:text-sm font-bold leading-snug group-hover:text-amber-900 transition-colors line-clamp-3">
                    {story.title}
                  </h4>
                  {story.excerpt ? (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-amber-950/70 line-clamp-3">
                      {story.excerpt}
                    </p>
                  ) : null}
                </StoryLink>
              ))}
            </div>
          ) : null}

          <footer className="mt-4 pt-2 border-t border-amber-950/20 text-center text-[9px] uppercase tracking-[0.2em] text-amber-900/50 font-sans">
            Sel &amp; Lumière — nous sommes
          </footer>
        </div>
      </article>
    </div>
  );
}
