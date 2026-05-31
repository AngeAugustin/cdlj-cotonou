import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  totalItems: number;
  show: boolean;
  itemLabel?: string;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

export function ListPagination({
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  totalItems,
  show,
  itemLabel = "élément",
  onPrevious,
  onNext,
  className = "",
}: ListPaginationProps) {
  if (!show) return null;

  const plural = totalItems > 1 ? "s" : "";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6 ${className}`.trim()}
    >
      <p className="text-sm text-slate-500 font-medium">
        Affichage{" "}
        <span className="font-bold text-slate-800">
          {pageStart}–{pageEnd}
        </span>{" "}
        sur <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel}
        {plural}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={onPrevious}
          className="h-9 rounded-xl border-slate-200 font-bold text-slate-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </Button>
        <span className="text-sm font-bold text-slate-600 px-2 tabular-nums">
          Page {currentPage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={onNext}
          className="h-9 rounded-xl border-slate-200 font-bold text-slate-700"
        >
          Suivant
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
