"use client";

import { signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck, Users, Activity, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Force la déconnexion dès qu'on atterrit sur la page de login par mégarde
  useEffect(() => {
    // Supprime silencieusement la session existante pour forcer l'utilisateur à se reconnecter
    signOut({ redirect: false });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Identifiants incorrects. Veuillez réessayer.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Branding (Light Theme) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 overflow-hidden">
        {/* Decorative subtle background elements */}
        <div className="absolute top-0 right-0 w-[40rem] h-[50rem] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-slate-200/50 blur-[100px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 w-full px-6 lg:px-10 flex flex-col h-full justify-between py-12">
          {/* Removed Retour button as requested */}

          <div className="space-y-12">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="relative h-20 w-20 shrink-0 block hover:opacity-80 transition-opacity">
                  <Image
                    src="https://i.postimg.cc/zGGW7CSV/EM.png"
                    alt="EM Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </Link>
                <Link href="/" className="relative h-16 w-16 shrink-0 block hover:opacity-80 transition-opacity">
                  <Image
                    src="https://i.postimg.cc/BnnDpTc2/CDLJ.png"
                    alt="CDLJ Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </Link>
              </div>

              <div className="flex flex-col justify-center border-l-2 border-slate-200 pl-4">
                <span className="text-sm font-medium text-slate-600 leading-snug">
                  Aumônerie de l'Enfance Missionnaire de Cotonou
                </span>
                <span className="text-base font-bold text-amber-900 leading-snug">
                  Communauté Diocésaine des Lecteurs Juniors (CDLJ)
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Portail <span className="text-amber-900">Intranet Diocésain</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                Accès exclusif réservé aux bureaux vicarials, paroissiaux et aux administrateurs de la CDLJ de Cotonou.
              </p>

              {/* Animated Features Grid */}
              <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
                {/* Sécurité */}
                <div className="flex flex-col items-center text-center gap-3 bg-white p-5 rounded-3xl shadow-xl shadow-amber-900/5 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-20" style={{ animationDuration: '3s' }}></span>
                    <div className="relative inline-flex h-full w-full items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Chiffrement</span>
                    <span className="text-xs text-slate-500 leading-snug mt-1">Données sécurisées et restreintes.</span>
                  </div>
                </div>

                {/* Communauté */}
                <div className="flex flex-col items-center text-center gap-3 bg-white p-5 rounded-3xl shadow-xl shadow-amber-900/5 border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-20" style={{ animationDuration: '4s', animationDelay: '1s' }}></span>
                    <div className="relative inline-flex h-full w-full items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Réseau</span>
                    <span className="text-xs text-slate-500 leading-snug mt-1">+10k Membres interconnectés.</span>
                  </div>
                </div>

                {/* Synchronisation (Prends 2 colonnes) */}
                <div className="sm:col-span-2 flex flex-col items-center text-center gap-3 bg-gradient-to-r from-amber-900 to-amber-800 p-6 rounded-3xl shadow-xl shadow-amber-900/20 hover:shadow-amber-900/40 hover:-translate-y-1 transition-all duration-300">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-40" style={{ animationDuration: '2.5s', animationDelay: '2s' }}></span>
                    <div className="relative inline-flex h-full w-full items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                      <Activity className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Opérations centralisées</span>
                    <span className="text-xs text-amber-100/80 leading-snug mt-1">Supervision diocésaine et vicariale en temps réel.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/60">
            <p className="text-slate-400 text-sm font-medium">
              © {new Date().getFullYear()} CDLJ WEBAPP. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form (Dark/Amber Theme) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-amber-900 to-amber-950">
        {/* Soft blobs for the dark panel */}
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-amber-800/40 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-amber-700/20 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Bon retour !</h2>
            <p className="text-amber-100/80">
              Veuillez saisir vos identifiants pour accéder à votre espace de gestion.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-50 font-semibold px-1">Email professionnel</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-200/50 group-focus-within:text-white transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-14 bg-white/10 border-white/20 text-white placeholder:text-amber-100/50 focus-visible:ring-white/20 focus-visible:border-white transition-all shadow-sm rounded-2xl"
                    placeholder="admin@cdlj.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="text-amber-50 font-semibold">Mot de passe</Label>
                  <Link href="#" className="font-medium text-sm text-amber-200 hover:text-white transition-colors">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-amber-200/50 group-focus-within:text-white transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-amber-100/50 focus-visible:ring-white/20 focus-visible:border-white transition-all shadow-sm rounded-2xl"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-amber-200/50 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white hover:bg-amber-50 text-amber-900 font-extrabold text-lg rounded-2xl shadow-xl shadow-black/10 hover:shadow-white/20 transition-all duration-300 group"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authentification...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Accéder à l'interface</span>
                  <ArrowLeft className="h-5 w-5 rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </Button>
          </form>

          {/* Mobile Back Link removed */}
        </div>
      </div>
    </div>
  );
}
