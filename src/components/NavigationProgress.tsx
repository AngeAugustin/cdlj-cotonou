"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank") return;

      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname) return;

      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-amber-100"
      aria-hidden="true"
    >
      <div className="h-full w-1/3 bg-amber-900 animate-[navigation-progress_0.9s_ease-in-out_infinite]" />
    </div>
  );
}
