import { DashboardPageShell, DashboardPanel } from "@/components/dashboard/page-shell";

export function DashboardLoading() {
  return (
    <DashboardPageShell
      title="Chargement…"
      description="Préparation de votre tableau de bord."
    >
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DashboardPanel className="lg:col-span-2 h-80 bg-slate-100">
            <span className="sr-only">Chargement</span>
          </DashboardPanel>
          <DashboardPanel className="h-80 bg-slate-100">
            <span className="sr-only">Chargement</span>
          </DashboardPanel>
        </div>
      </div>
    </DashboardPageShell>
  );
}
