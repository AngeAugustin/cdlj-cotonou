"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink, Loader2, Send, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPanel } from "@/components/dashboard/page-shell";
import { MEDIATHEQUE_CATEGORIES, MOIS_LABELS } from "@/modules/mediatheque/constants";

export type MediathequeItem = {
  _id: string;
  nom: string;
  categorie: string;
  mois: number;
  annee: number;
  coverImage?: string;
  hostingLink: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  nom: string;
  categorie: string;
  mois: number;
  annee: number;
  coverImage: string;
  hostingLink: string;
};

function emptyForm(): FormState {
  const now = new Date();
  return {
    nom: "",
    categorie: "",
    mois: now.getMonth() + 1,
    annee: now.getFullYear(),
    coverImage: "",
    hostingLink: "",
  };
}

function itemToForm(item: MediathequeItem): FormState {
  return {
    nom: item.nom,
    categorie: item.categorie,
    mois: item.mois,
    annee: item.annee,
    coverImage: item.coverImage ?? "",
    hostingLink: item.hostingLink,
  };
}

function CoverUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur upload");
      onChange(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200">
          <img src={value} alt="Couverture" className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 rounded-xl cursor-pointer transition-all"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Image de couverture</p>
                <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP — max 5 Mo</p>
              </div>
            </>
          )}
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

export function MediathequeForm({
  editItem = null,
  onCancel,
  onSuccess,
  onError,
}: {
  editItem?: MediathequeItem | null;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onError?: (message: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft");

  useEffect(() => {
    if (editItem) {
      setForm(itemToForm(editItem));
      setPublishMode(editItem.published ? "publish" : "draft");
    }
  }, [editItem]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let link = form.hostingLink.trim();
      if (link && !/^https?:\/\//i.test(link)) {
        link = `https://${link}`;
      }

      const payload = {
        nom: form.nom.trim(),
        categorie: form.categorie,
        mois: form.mois,
        annee: form.annee,
        hostingLink: link,
        coverImage: form.coverImage || undefined,
        published: publishMode === "publish",
      };

      const url = editItem ? `/api/mediatheque/${editItem._id}` : "/api/mediatheque";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur serveur");
      }

      onSuccess(
        editItem
          ? "Médiathèque modifiée avec succès"
          : publishMode === "publish"
            ? "Médiathèque publiée avec succès"
            : "Médiathèque enregistrée comme brouillon"
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      if (onError) onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestSubmit = () => formRef.current?.requestSubmit();

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <DashboardPanel className="overflow-hidden">
      <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-6 sm:px-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            required
            placeholder="Ex. Session Diocésaine 2025"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categorie}
              onChange={(e) => set("categorie", e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20 bg-white"
            >
              <option value="">Sélectionner…</option>
              {MEDIATHEQUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mois <span className="text-red-500">*</span>
              </label>
              <select
                value={form.mois}
                onChange={(e) => set("mois", Number(e.target.value))}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20 bg-white"
              >
                {MOIS_LABELS.map((label, i) => (
                  <option key={label} value={i + 1}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Année <span className="text-red-500">*</span>
              </label>
              <select
                value={form.annee}
                onChange={(e) => set("annee", Number(e.target.value))}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20 bg-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Image de couverture
          </label>
          <CoverUpload value={form.coverImage} onChange={(url) => set("coverImage", url)} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Lien d&apos;hébergement <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={form.hostingLink}
              onChange={(e) => set("hostingLink", e.target.value)}
              required
              placeholder="https://drive.google.com/… ou lien vers vos fichiers"
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Lien vers Google Drive, OneDrive ou tout autre espace où sont hébergés vos fichiers (photos, vidéos, documents).
          </p>
        </div>
      </form>

      <div className="px-6 py-5 sm:px-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-3xl">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${publishMode === "publish" ? "bg-green-500" : "bg-slate-400"}`} />
          <span className="text-xs font-semibold text-slate-500">
            {publishMode === "publish" ? "Sera visible sur la page publique" : "Sera enregistré comme brouillon"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="rounded-xl">
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => { setPublishMode("draft"); requestSubmit(); }}
            className="rounded-xl gap-2"
          >
            {submitting && publishMode === "draft" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Brouillon
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => { setPublishMode("publish"); requestSubmit(); }}
            className="bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold gap-2"
          >
            {submitting && publishMode === "publish" && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            Publier
          </Button>
        </div>
      </div>
    </DashboardPanel>
  );
}
