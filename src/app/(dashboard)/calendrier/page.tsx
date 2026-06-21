"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/page-shell";
import { BirthdayCalendar } from "@/modules/calendrier/components/BirthdayCalendar";
import { CalendrierFilters } from "@/modules/calendrier/components/CalendrierFilters";
import { type ApiLecteur, gradeLabel, refId } from "@/modules/lecteurs/lecteurViewUtils";
import { isDioceseScopeReader } from "@/lib/rolePermissions";

function scopeDescription(roles: string[]): string {
  if (isDioceseScopeReader(roles)) {
    return "Anniversaires de tous les lecteurs du diocèse.";
  }
  if (roles.includes("VICARIAL")) {
    return "Anniversaires des lecteurs de votre vicariat.";
  }
  return "Anniversaires des lecteurs de votre paroisse.";
}

export default function CalendrierPage() {
  const { data: session, status } = useSession();
  const roles: string[] = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];

  const [list, setList] = useState<ApiLecteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [vicariatFilter, setVicariatFilter] = useState("");
  const [paroisseFilter, setParoisseFilter] = useState("");

  const canFilter = isDioceseScopeReader(roles);
  const description = useMemo(() => scopeDescription(roles), [roles]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/lecteurs");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les lecteurs");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadList();
  }, [status, loadList]);

  const vicariatOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of list) {
      const v = l.vicariatId;
      if (v && typeof v === "object" && "name" in v) map.set(String(v._id), v.name);
    }
    return [...map.entries()]
      .map(([_id, name]) => ({ _id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [list]);

  const paroisseOptions = useMemo(() => {
    const map = new Map<string, { name: string; vicariatId: string }>();
    for (const l of list) {
      const p = l.paroisseId;
      if (p && typeof p === "object" && "name" in p) {
        map.set(String(p._id), { name: p.name, vicariatId: refId(l.vicariatId) });
      }
    }
    return [...map.entries()]
      .map(([_id, { name, vicariatId }]) => ({ _id, name, vicariatId }))
      .filter((p) => !vicariatFilter || p.vicariatId === vicariatFilter)
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [list, vicariatFilter]);

  const onVicariatFilterChange = (value: string) => {
    setVicariatFilter(value);
    setParoisseFilter("");
  };

  const filteredList = useMemo(() => {
    if (!canFilter) return list;

    const q = searchTerm.trim().toLowerCase();
    return list.filter((l) => {
      if (vicariatFilter && refId(l.vicariatId) !== vicariatFilter) return false;
      if (paroisseFilter && refId(l.paroisseId) !== paroisseFilter) return false;
      if (!q) return true;
      const blob = `${l.nom} ${l.prenoms} ${gradeLabel(l)}`.toLowerCase();
      return blob.includes(q);
    });
  }, [list, canFilter, searchTerm, vicariatFilter, paroisseFilter]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <DashboardPageShell title="Calendrier" description={description}>
      {canFilter ? (
        <CalendrierFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          vicariatFilter={vicariatFilter}
          onVicariatFilterChange={onVicariatFilterChange}
          paroisseFilter={paroisseFilter}
          onParoisseFilterChange={setParoisseFilter}
          vicariatOptions={vicariatOptions}
          paroisseOptions={paroisseOptions}
        />
      ) : null}

      {loadError ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      ) : null}

      <BirthdayCalendar lecteurs={filteredList} loading={loading} />
    </DashboardPageShell>
  );
}
