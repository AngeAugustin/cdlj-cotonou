"use client";

import { Search } from "lucide-react";

type FilterOption = { _id: string; name: string };

type CalendrierFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  vicariatFilter: string;
  onVicariatFilterChange: (value: string) => void;
  paroisseFilter: string;
  onParoisseFilterChange: (value: string) => void;
  vicariatOptions: FilterOption[];
  paroisseOptions: FilterOption[];
};

export function CalendrierFilters({
  searchTerm,
  onSearchChange,
  vicariatFilter,
  onVicariatFilterChange,
  paroisseFilter,
  onParoisseFilterChange,
  vicariatOptions,
  paroisseOptions,
}: CalendrierFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/20 md:flex-row md:items-center md:justify-between">
      <div className="group relative w-full md:max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-900" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou grade…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-900/20"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center md:w-auto">
        <select
          className="h-12 flex-1 appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 font-medium text-slate-700 focus:border-amber-900 focus:outline-none md:w-48"
          value={vicariatFilter}
          onChange={(e) => onVicariatFilterChange(e.target.value)}
        >
          <option value="">Tous les vicariats</option>
          {vicariatOptions.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className="h-12 flex-1 appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 font-medium text-slate-700 focus:border-amber-900 focus:outline-none md:w-48"
          value={paroisseFilter}
          onChange={(e) => onParoisseFilterChange(e.target.value)}
        >
          <option value="">Toutes les paroisses</option>
          {paroisseOptions.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
