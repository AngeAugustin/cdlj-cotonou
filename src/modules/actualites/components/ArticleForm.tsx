"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { RichTextEditorHandle } from "@/components/RichTextEditor";
import { Loader2, AlertCircle, UploadCloud, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPanel } from "@/components/dashboard/page-shell";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

export type Actualite = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image?: string;
  category: string;
  author: string;
  authorRole?: string;
  readTime?: string;
  tags?: string[];
  featured: boolean;
  published: boolean;
  createdAt: string;
};

export const ACTUALITE_CATEGORIES = [
  "Événement Annuel", "Décisions", "Célébration", "Formation",
  "Communiqué", "Assemblée Générale", "Activité", "Autre",
] as const;

type FormState = {
  title: string;
  excerpt: string;
  body: string;
  image: string;
  category: string;
  author: string;
  authorRole: string;
  readTime: string;
  tags: string;
  featured: boolean;
};

function parseTagsInput(input: string): string[] {
  return input.split(",").map((t) => t.trim()).filter(Boolean);
}

function tagsToInput(tags?: string[]): string {
  return (tags ?? []).join(", ");
}

function emptyForm(): FormState {
  return normalizeFormState({});
}

function normalizeFormState(partial: Partial<FormState>): FormState {
  return {
    title: partial.title ?? "",
    excerpt: partial.excerpt ?? "",
    body: partial.body ?? "",
    image: partial.image ?? "",
    category: partial.category ?? "",
    author: partial.author ?? "",
    authorRole: partial.authorRole ?? "",
    readTime: partial.readTime ?? "",
    tags: partial.tags ?? "",
    featured: partial.featured ?? false,
  };
}

function actualiteToFormState(editItem: Actualite): FormState {
  return normalizeFormState({
    title: editItem.title,
    excerpt: editItem.excerpt,
    body: bodyFromActualite(editItem),
    image: editItem.image ?? "",
    category: editItem.category,
    author: editItem.author,
    authorRole: editItem.authorRole ?? "",
    readTime: editItem.readTime ?? "",
    tags: tagsToInput(editItem.tags),
    featured: editItem.featured,
  });
}

function bodyFromActualite(editItem: Actualite): string {
  const raw = (editItem as unknown as { body?: string | string[] }).body;
  if (Array.isArray(raw)) {
    return raw.map((p) => `<p>${p}</p>`).join("");
  }
  return raw || "";
}

function ImageUpload({
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200">
          <img src={value} alt="couverture" className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 w-full h-44 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 rounded-xl cursor-pointer transition-all group"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Cliquez ou glissez une image ici</p>
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
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

function ArticleFormFields({
  form,
  set,
  editorRef,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  editorRef: React.RefObject<RichTextEditorHandle | null>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 lg:items-stretch">
      <div className="px-6 py-6 sm:px-8 flex flex-col gap-6 min-h-0">
        <div className="shrink-0">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Titre de l&apos;article <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="Titre accrocheur…"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-base font-semibold outline-none
                       focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition placeholder:font-normal placeholder:text-sm"
          />
        </div>

        <div className="shrink-0">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Résumé <span className="text-red-500">*</span>
            <span className="text-slate-400 font-normal ml-2">(affiché dans les aperçus)</span>
          </label>
          <textarea
            value={form.excerpt ?? ""}
            onChange={(e) => set("excerpt", e.target.value)}
            required
            rows={2}
            placeholder="Une phrase ou deux qui résument l'article…"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                       focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition resize-none"
          />
        </div>

        <div className="flex min-h-[280px] flex-1 flex-col">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 shrink-0">
            Contenu de l&apos;article <span className="text-red-500">*</span>
          </label>
          <div className="min-h-0 flex-1 flex flex-col">
            <RichTextEditor
              ref={editorRef}
              content={form.body ?? ""}
              onChange={(html) => set("body", html)}
              placeholder="Rédigez le contenu de votre article ici…"
              fillHeight
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 bg-slate-50/60">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Image de couverture</label>
          <ImageUpload value={form.image ?? ""} onChange={(url) => set("image", url)} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category ?? ""}
            onChange={(e) => set("category", e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                       focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 bg-white transition"
          >
            <option value="">Sélectionner…</option>
            {ACTUALITE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Auteur <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.author ?? ""}
            onChange={(e) => set("author", e.target.value)}
            required
            placeholder="Nom de l'auteur"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                       focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Tags
            <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
          </label>
          <input
            type="text"
            value={form.tags ?? ""}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="Ex. formation, CDLJ, jeunesse"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                       focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition"
          />
          <p className="mt-1.5 text-xs text-slate-400">Séparez les tags par des virgules.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Temps de lecture
            <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={form.readTime ? String(parseInt(form.readTime, 10) || "") : ""}
              onChange={(e) => {
                const v = e.target.value;
                set("readTime", v ? `${v} min de lecture` : "");
              }}
              placeholder="1 – 60"
              className="w-28 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900/30 transition"
            />
            <span className="text-sm text-slate-500">min de lecture</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-3.5 px-4 bg-white rounded-xl border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-700">À la une</p>
            <p className="text-xs text-slate-400">Affiché en tête de page</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.featured}
            onClick={() => set("featured", !form.featured)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200
              ${form.featured ? "bg-amber-500" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
              ${form.featured ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ArticleFormFooter({
  publishMode,
  submitting,
  onCancel,
  onDraft,
  onPublish,
}: {
  publishMode: "draft" | "publish";
  submitting: boolean;
  onCancel: () => void;
  onDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="px-6 py-5 sm:px-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-3xl">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0
          ${publishMode === "publish" ? "bg-green-500" : "bg-slate-400"}`} />
        <span className="text-xs font-semibold text-slate-500">
          {publishMode === "publish" ? "Sera publié" : "Sera enregistré comme brouillon"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border-slate-200"
        >
          Annuler
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onDraft}
          className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 gap-2"
        >
          {submitting && publishMode === "draft" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Enregistrer brouillon
        </Button>

        <Button
          type="button"
          disabled={submitting}
          onClick={onPublish}
          className="bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold gap-2"
        >
          {submitting && publishMode === "publish" && <Loader2 className="w-4 h-4 animate-spin" />}
          <Send className="w-4 h-4" />
          Publier
        </Button>
      </div>
    </div>
  );
}

export function ArticleForm({
  editItem = null,
  onCancel,
  onSuccess,
  onError,
}: {
  editItem?: Actualite | null;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onError?: (message: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const publishIntentRef = useRef<"draft" | "publish">("draft");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft");

  useEffect(() => {
    if (editItem) {
      setForm(actualiteToFormState(editItem));
      const mode = editItem.published ? "publish" : "draft";
      setPublishMode(mode);
      publishIntentRef.current = mode;
    }
  }, [editItem]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const bodyHtml = editorRef.current?.getHTML() ?? form.body ?? "";
      const { tags: tagsInput, ...formRest } = form;
      const published = publishIntentRef.current === "publish";
      const payload = {
        ...formRest,
        title: form.title ?? "",
        excerpt: form.excerpt ?? "",
        body: bodyHtml,
        category: form.category ?? "",
        author: form.author ?? "",
        tags: parseTagsInput(tagsInput ?? ""),
        image: form.image || undefined,
        authorRole: form.authorRole || undefined,
        readTime: form.readTime || undefined,
        published,
      };

      const url = editItem ? `/api/actualites/${editItem._id}` : "/api/actualites";
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
          ? "Article modifié avec succès"
          : published
            ? "Article publié avec succès"
            : "Article enregistré comme brouillon"
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      if (onError) onError(message);
      else onSuccess(message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestSubmit = () => formRef.current?.requestSubmit();

  const formContent = (
    <>
      <form ref={formRef} onSubmit={handleSubmit}>
        <ArticleFormFields form={form} set={set} editorRef={editorRef} />
      </form>
      <ArticleFormFooter
        publishMode={publishMode}
        submitting={submitting}
        onCancel={onCancel}
        onDraft={() => {
          publishIntentRef.current = "draft";
          setPublishMode("draft");
          requestSubmit();
        }}
        onPublish={() => {
          publishIntentRef.current = "publish";
          setPublishMode("publish");
          requestSubmit();
        }}
      />
    </>
  );

  return (
    <DashboardPanel className="overflow-hidden">
      {formContent}
    </DashboardPanel>
  );
}
