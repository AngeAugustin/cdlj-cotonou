export function PublicPageSkeleton() {
  return (
    <div className="animate-pulse bg-slate-50 min-h-[60vh] py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-8">
        <div className="space-y-4 max-w-2xl">
          <div className="h-6 w-28 rounded-full bg-slate-200" />
          <div className="h-12 w-full max-w-lg rounded-xl bg-slate-200" />
          <div className="h-5 w-full max-w-xl rounded-lg bg-slate-100" />
          <div className="h-5 w-2/3 max-w-md rounded-lg bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
              <div className="h-48 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MediathequeGridSkeleton({ compact = false }: { compact?: boolean }) {
  const count = compact ? 8 : 6;
  return (
    <div className={`animate-pulse ${compact ? "" : "py-10 sm:py-12 md:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/80"}`}>
      <div className="max-w-7xl mx-auto w-full">
        {!compact && (
          <div className="space-y-3 mb-8">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-8 w-72 max-w-full rounded-lg bg-slate-200" />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewsSectionSkeleton() {
  return (
    <div className="animate-pulse py-10 sm:py-12 md:py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="space-y-3 mb-8">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-8 w-80 max-w-full rounded-lg bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
              <div className="h-48 sm:h-52 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-4/5 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewsListSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="rounded-3xl bg-white border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 h-[300px] md:h-[500px] bg-slate-200" />
        <div className="w-full md:w-1/2 p-8 md:p-16 space-y-4">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="h-10 w-full rounded-lg bg-slate-200" />
          <div className="h-5 w-full rounded bg-slate-100" />
          <div className="h-5 w-5/6 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
            <div className="h-60 bg-slate-200" />
            <div className="p-6 space-y-3">
              <div className="h-6 w-4/5 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
