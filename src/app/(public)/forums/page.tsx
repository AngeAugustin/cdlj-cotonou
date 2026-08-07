import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Lock,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  ForumsCommunityFeed,
  type CommunityPost,
  type CommunitySpace,
} from "@/components/forums/ForumsCommunityFeed";
import { SocialFollowButtons } from "@/components/SocialFollowButtons";
import { JsonLd } from "@/components/seo/JsonLd";
import { FACEBOOK_URL } from "@/config/social-links";
import { PAGE_SEO } from "@/config/page-seo";
import { SITE_NAME_FULL } from "@/config/seo";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo-schemas";

const seo = PAGE_SEO.forums;

export const metadata = createPageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/forums",
  keywords: [...seo.keywords],
});

const PRINCIPLES = [
  {
    title: "Échanges ouverts",
    description:
      "Un espace général pour toute la communauté : actualités, partages spirituels et questions du quotidien.",
    icon: Users,
  },
  {
    title: "Coordination claire",
    description:
      "Des forums dédiés aux responsables pour transmettre les directives et organiser les activités.",
    icon: MessageSquare,
  },
  {
    title: "Formation partagée",
    description:
      "Les formateurs y préparent modules, évaluations de grades et bonnes pratiques liturgiques.",
    icon: BookOpen,
  },
] as const;

const FORUMS = [
  {
    id: "general",
    title: "Forum Général de la CDLJ",
    description:
      "L'espace ouvert à tous les membres. Discussions libres sur la vie de la CDLJ, les actualités, les partages spirituels et les questions générales.",
    members: "Tous les membres",
    access: "Ouvert" as const,
    icon: Users,
    link: FACEBOOK_URL,
    external: true,
  },
  {
    id: "vicariaux",
    title: "Forum des Vicariaux",
    description:
      "Réservé aux responsables et membres des bureaux vicariaux. Coordination des activités, transmission des directives et organisation inter-vicariats.",
    members: "Responsables vicariaux",
    access: "Restreint" as const,
    icon: Lock,
    link: "#",
    external: false,
  },
  {
    id: "formateurs",
    title: "Forum des Formateurs",
    description:
      "Espace d'échange entre formateurs et chargés de formation. Modules pédagogiques, préparation des évaluations et bonnes pratiques liturgiques.",
    members: "Formateurs & CASF",
    access: "Restreint" as const,
    icon: BookOpen,
    link: "#",
    external: false,
  },
  {
    id: "commissionnaires",
    title: "Forum des Commissionnaires",
    description:
      "Dédié aux commissionnaires. Suivi des missions, coordination des services et organisation des cérémonies officielles au diocèse.",
    members: "Commissionnaires",
    access: "Restreint" as const,
    icon: Award,
    link: "#",
    external: false,
  },
] as const;

const COMMUNITY_SPACES: CommunitySpace[] = FORUMS.map((forum) => ({
  id: forum.id,
  name: forum.title,
  shortName:
    forum.id === "general"
      ? "Général"
      : forum.id === "vicariaux"
        ? "Vicariaux"
        : forum.id === "formateurs"
          ? "Formateurs"
          : "Commission",
  access: forum.access,
  membersLabel: forum.members,
  href: forum.external ? forum.link : undefined,
  external: forum.external,
}));

const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "g1",
    spaceId: "general",
    author: "Sr Grâce",
    role: "Bureau diocésain",
    time: "il y a 2 h",
    content:
      "Rappel : la session diocésaine approche. Partagez vos disponibilités et vos idées d'animation dans cet espace.",
    likes: 24,
    comments: 8,
  },
  {
    id: "g2",
    spaceId: "general",
    author: "Fr Lionel",
    role: "Organisateur",
    time: "il y a 5 h",
    content:
      "Belle célébration dimanche dernier. Merci à tous les lecteurs qui ont servi avec foi et fraternité.",
    likes: 41,
    comments: 12,
  },
  {
    id: "v1",
    spaceId: "vicariaux",
    author: "Fr Alexis",
    role: "CASF",
    time: "il y a 1 h",
    content:
      "Directives pour les bureaux vicariaux : merci de remonter les listes de présence avant vendredi.",
    likes: 9,
    comments: 4,
  },
  {
    id: "v2",
    spaceId: "vicariaux",
    author: "Fr Bienheureux",
    role: "Secrétariat",
    time: "il y a 3 h",
    content:
      "Point coordination Akpakpa / Calavi : créneau de synchro proposé samedi matin.",
    likes: 6,
    comments: 3,
  },
  {
    id: "f1",
    spaceId: "formateurs",
    author: "Fr Landry",
    role: "Coordonnateur",
    time: "il y a 40 min",
    content:
      "Module grades : les supports de préparation sont prêts. On valide le déroulé ensemble ce soir.",
    likes: 15,
    comments: 7,
  },
  {
    id: "f2",
    spaceId: "formateurs",
    author: "Sr Jarnelle",
    role: "Formation",
    time: "il y a 4 h",
    content:
      "Retour sur le weekend des animateurs : points forts et axes d'amélioration à capitaliser.",
    likes: 11,
    comments: 5,
  },
  {
    id: "c1",
    spaceId: "commissionnaires",
    author: "Fr Kenneth",
    role: "Commission",
    time: "il y a 2 h",
    content:
      "Organisation cérémonie : répartition des rôles et check-list logistique partagée.",
    likes: 8,
    comments: 2,
  },
  {
    id: "c2",
    spaceId: "commissionnaires",
    author: "Fr Lionel",
    role: "Organisateur",
    time: "hier",
    content:
      "Merci à l'équipe pour le service impeccable lors de la dernière célébration diocésaine.",
    likes: 18,
    comments: 4,
  },
];

export default function ForumsPage() {
  return (
    <div className="bg-[#f7f5f1] min-h-screen relative overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Forums", path: "/forums" },
          ]),
          webPageSchema({
            name: seo.title,
            description: seo.description,
            path: "/forums",
          }),
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                linear-gradient(rgba(120, 53, 15, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(120, 53, 15, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse 75% 60% at 30% 15%, black 15%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 75% 60% at 30% 15%, black 15%, transparent 70%)",
            }}
          />
          <div className="absolute top-0 left-0 w-[36rem] h-[28rem] rounded-full bg-amber-200/30 blur-[100px]" />
          <div className="absolute top-24 right-0 w-[28rem] h-[24rem] rounded-full bg-orange-100/40 blur-[90px]" />
        </div>

        <div
          className="absolute inset-x-0 top-[8%] flex justify-center pointer-events-none select-none"
          aria-hidden
        >
          <span className="font-extrabold tracking-[-0.04em] text-[20vw] sm:text-[14vw] lg:text-[10rem] leading-none text-amber-950/[0.04]">
            Forums
          </span>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-900 transition-colors mb-8 sm:mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs sm:text-sm font-medium">
                Espaces d&apos;échange CDLJ
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-slate-900 text-balance">
                Des forums pour{" "}
                <span className="text-amber-800">vivre</span> la communauté
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl text-pretty">
                Échangez avec les lecteurs juniors, responsables vicariaux, formateurs et
                commissionnaires de la {SITE_NAME_FULL} via nos espaces de discussion.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold bg-amber-950 text-white hover:bg-amber-900 shadow-md shadow-amber-950/15 transition-colors"
                >
                  Rejoindre le forum général
                </a>
                <Link
                  href="/about"
                  className="group inline-flex items-center justify-center rounded-xl h-12 px-6 text-sm font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  En savoir plus
                  <ArrowRight className="ml-2 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <ForumsCommunityFeed spaces={COMMUNITY_SPACES} posts={COMMUNITY_POSTS} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Principes ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 mb-4">
              Architecture
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Des échanges utiles et structurés
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Trois principes simples pour une vie communautaire claire et efficace.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PRINCIPLES.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-sm shadow-slate-200/40"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Forums ───────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
              Rejoindre un forum
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              Choisissez le forum adapté à votre rôle. Le forum général est ouvert à tous ;
              les autres espaces restent réservés aux missions concernées.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {FORUMS.map(({ id, title, description, members, access, icon: Icon, link, external }) => {
              const isOpen = access === "Ouvert";
              const content = (
                <>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-700 to-amber-950 text-amber-50 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                        isOpen
                          ? "text-emerald-800 bg-emerald-50 border-emerald-100"
                          : "text-amber-800/80 bg-amber-50 border-amber-100"
                      }`}
                    >
                      {access}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-900 transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed mb-5">
                    {description}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-auto pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {members}
                    </span>
                    {isOpen ? (
                      <span className="inline-flex items-center text-sm font-semibold text-amber-900">
                        Rejoindre
                        <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                        Accès réservé
                      </span>
                    )}
                  </div>
                </>
              );

              const className =
                "group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 hover:border-amber-300/70 hover:shadow-lg hover:shadow-amber-950/5 transition-all h-full";

              if (external) {
                return (
                  <a
                    key={id}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={id} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance">
            Prêt à rejoindre la conversation ?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Suivez la CDLJ sur Facebook et TikTok pour les actualités, les échanges et la vie
            de la communauté.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SocialFollowButtons />
          </div>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm font-semibold text-amber-900 hover:text-amber-800 transition-colors"
            >
              Accéder au Portail
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
