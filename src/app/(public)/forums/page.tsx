import Link from "next/link";
import { MessageSquare, Users, BookOpen, Award, ChevronRight, Lock } from "lucide-react";

export default function ForumsPage() {
  const FORUMS = [
    {
      id: 1,
      title: "Forum Général de la CDLJ",
      description: "L'espace ouvert à tous les membres de la communauté diocésaine. Discussions libres sur la vie de la CDLJ, les actualités, les partages spirituels et les questions générales.",
      members: "Tous les membres",
      access: "Ouvert",
      icon: <Users className="w-8 h-8 text-amber-900" />,
      iconColor: "bg-amber-100",
      badge: "bg-amber-100 text-amber-800",
      link: "#"
    },
    {
      id: 2,
      title: "Forum des Vicariaux",
      description: "Réservé aux responsables et membres des bureaux vicarials. Coordination des activités, transmission des directives diocésaines et organisation logistique inter-vicariats.",
      members: "Responsables vicarials",
      access: "Restreint",
      icon: <Lock className="w-8 h-8 text-emerald-900" />,
      iconColor: "bg-emerald-100",
      badge: "bg-emerald-100 text-emerald-800",
      link: "#"
    },
    {
      id: 3,
      title: "Forum des Formateurs",
      description: "Espace d'échange exclusif entre les formateurs et les chargés de formation. Partage de modules pédagogiques, préparation des évaluations de grades et bonnes pratiques liturgiques.",
      members: "Formateurs & CASF",
      access: "Restreint",
      icon: <BookOpen className="w-8 h-8 text-blue-900" />,
      iconColor: "bg-blue-100",
      badge: "bg-blue-100 text-blue-800",
      link: "#"
    },
    {
      id: 4,
      title: "Forum des Commissionnaires",
      description: "Dédié aux commissionnaires de la CDLJ. Suivi des missions, coordination des tâches de service et organisation des cérémonies officielles au sein du diocèse.",
      members: "Commissionnaires",
      access: "Restreint",
      icon: <Award className="w-8 h-8 text-purple-900" />,
      iconColor: "bg-purple-100",
      badge: "bg-purple-100 text-purple-800",
      link: "#"
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        <div className="text-center md:text-left mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/50 text-amber-900 font-semibold text-sm mb-4 border border-amber-200/50">
            Discussions
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 text-balance">
            Rejoignez nos <span className="text-amber-900">Forums</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            Échangez, posez vos questions, et tissez des liens puissants avec les autres membres de la Communauté Diocésaine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {FORUMS.map(forum => (
            <div key={forum.id} className="group flex items-start gap-6 p-8 bg-white border border-slate-100/80 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`p-4 rounded-2xl ${forum.iconColor} shadow-inner shrink-0 group-hover:scale-110 transition-transform`}>
                {forum.icon}
              </div>

              <div className="flex flex-col flex-1 h-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-amber-900 transition-colors leading-tight">
                    {forum.title}
                  </h3>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${forum.badge}`}>
                    {forum.access}
                  </span>
                </div>
                <p className="text-slate-500 mb-6 leading-relaxed flex-1 text-sm">
                  {forum.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {forum.members}
                  </span>
                  <Link href={forum.link} className="flex items-center gap-1.5 text-sm font-bold text-amber-900 hover:gap-2.5 transition-all">
                    Rejoindre <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action at bottom */}
        <div className="mt-20 p-10 bg-gradient-to-r from-amber-900 to-amber-800 rounded-3xl text-white text-center flex flex-col md:flex-row items-center justify-between shadow-2xl overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="text-left mb-6 md:mb-0 relative z-10 w-full md:w-2/3">
            <h4 className="text-3xl font-bold mb-2">CDLJ COTONOU</h4>
            <p className="text-amber-100/80 text-lg">Retrouvez-nous aussi en live sur notre serveur vocal communautaire pour les temps de prière en ligne.</p>
          </div>
          <Link href="#" className="whitespace-nowrap bg-white text-amber-900 px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-white/20 hover:scale-105 transition-all text-lg z-10">
            Rejoindre la communauté
          </Link>
        </div>
      </div>
    </div>
  );
}
