"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type SidebarNavScrollProps = {
  children: ReactNode;
  className?: string;
};

export function SidebarNavScroll({ children, className = "" }: SidebarNavScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight - clientHeight;

    if (overflow <= 1) {
      setThumb({ height: 0, top: 0, visible: false });
      return;
    }

    const ratio = clientHeight / scrollHeight;
    const height = Math.max(clientHeight * ratio, 28);
    const maxTop = clientHeight - height;
    const top = (scrollTop / overflow) * maxTop;

    setThumb({ height, top, visible: true });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateThumb();

    const observer = new ResizeObserver(updateThumb);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    el.addEventListener("scroll", updateThumb, { passive: true });
    window.addEventListener("resize", updateThumb);

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateThumb);
      window.removeEventListener("resize", updateThumb);
    };
  }, [updateThumb, children]);

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop };
  };

  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const drag = dragRef.current;
    if (!el || !drag) return;

    const { scrollHeight, clientHeight } = el;
    const overflow = scrollHeight - clientHeight;
    const ratio = clientHeight / scrollHeight;
    const height = Math.max(clientHeight * ratio, 28);
    const maxTop = clientHeight - height;

    if (maxTop <= 0) return;

    const deltaY = e.clientY - drag.startY;
    const scrollDelta = (deltaY / maxTop) * overflow;
    el.scrollTop = drag.startScrollTop + scrollDelta;
  };

  const onThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className={`relative min-h-0 flex-1 ${className}`}>
      <div
        ref={scrollRef}
        className="sidebar-nav-scroll h-full overflow-y-auto overflow-x-hidden"
      >
        {children}
      </div>

      {thumb.visible ? (
        <div
          role="presentation"
          aria-hidden
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
          className="absolute right-1.5 z-20 w-1 rounded-full cursor-pointer touch-none
                     bg-gradient-to-b from-amber-300/70 to-amber-600/80
                     shadow-[0_0_8px_rgba(251,191,36,0.35)]
                     hover:from-amber-200/85 hover:to-amber-500/90
                     active:from-amber-100 active:to-amber-400
                     transition-[opacity,background] duration-150"
          style={{
            height: `${thumb.height}px`,
            top: `${thumb.top}px`,
          }}
        />
      ) : null}
    </div>
  );
}
