import Image from "next/image";
import { cn } from "@/lib/utils";

export type TeamMemberCardProps = {
  name: string;
  role: string;
  image: string;
  accent: string;
  pill: string;
  initials: string;
  variant?: "featured" | "standard" | "compact";
  indexLabel?: string;
  spiritual?: boolean;
  borderAccent?: string;
};

export function TeamMemberCard({
  name,
  role,
  image,
  accent,
  pill,
  initials,
  variant = "featured",
  indexLabel,
  spiritual = false,
  borderAccent = "border-l-amber-400",
}: TeamMemberCardProps) {
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "group flex items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm",
          "border-l-[3px] transition-all duration-300 hover:border-amber-200/70 hover:shadow-md",
          borderAccent,
        )}
      >
        <div className="relative h-[5.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80">
          <Image
            src={image}
            alt={name}
            fill
            sizes="72px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 to-transparent" />
        </div>
        <div className="flex min-w-0 flex-col justify-center py-0.5">
          <h3 className="text-sm font-bold leading-tight text-slate-800">{name}</h3>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {role}
          </span>
        </div>
      </article>
    );
  }

  const isFeatured = variant === "featured";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-white shadow-md transition-all duration-500",
        "hover:-translate-y-1 hover:shadow-xl",
        spiritual
          ? "border-amber-200/80 shadow-amber-950/10 hover:border-amber-300/60 hover:shadow-amber-900/15"
          : "border-slate-200/90 shadow-slate-900/5 hover:border-amber-200/50",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          isFeatured ? "aspect-[4/5]" : "aspect-[5/6]",
        )}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes={isFeatured ? "(max-width: 640px) 100vw, 360px" : "(max-width: 640px) 100vw, 280px"}
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
          unoptimized
        />

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            spiritual
              ? "from-amber-950/95 via-amber-950/50 to-amber-900/10"
              : "from-slate-950/95 via-slate-950/45 to-transparent",
          )}
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90",
            accent,
          )}
        />

        {spiritual && (
          <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/40 bg-amber-950/50 text-sm text-amber-200/90 backdrop-blur-md">
            ✦
          </span>
        )}

        {indexLabel && (
          <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-black tracking-widest text-white/80 backdrop-blur-md">
            {indexLabel}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5 pt-16">
          <p
            className={cn(
              "mb-2 font-black uppercase tracking-[0.2em] text-white/50",
              isFeatured ? "text-[10px]" : "text-[9px]",
            )}
          >
            {initials}
          </p>
          <h3
            className={cn(
              "font-extrabold leading-tight text-white",
              isFeatured ? "text-xl md:text-[1.35rem]" : "text-lg",
            )}
          >
            {name}
          </h3>
          <span
            className={cn(
              "mt-3 inline-flex max-w-full items-center rounded-full border px-3 py-1 font-bold uppercase tracking-wider backdrop-blur-sm",
              isFeatured ? "text-[11px]" : "text-[10px]",
              pill,
            )}
          >
            {role}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "absolute -right-6 -top-4 select-none font-black leading-none text-slate-900/[0.03] transition-transform duration-500 group-hover:translate-x-1",
          isFeatured ? "text-[8rem]" : "text-[6rem]",
        )}
        aria-hidden
      >
        {initials}
      </div>
    </article>
  );
}
