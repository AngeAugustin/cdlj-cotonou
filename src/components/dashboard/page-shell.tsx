import type { ReactNode } from "react";

type DashboardPageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardPageShell({ title, description, actions, children }: DashboardPageShellProps) {
  return (
    <div className="w-full space-y-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm md:text-base text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="ml-auto flex shrink-0 items-center justify-end gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function DashboardPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/20 ${className}`.trim()}>
      {children}
    </div>
  );
}
