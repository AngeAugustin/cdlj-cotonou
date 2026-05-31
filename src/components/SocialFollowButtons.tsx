import { Facebook } from "lucide-react";
import { FACEBOOK_URL, TIKTOK_URL } from "@/config/social-links";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
    </svg>
  );
}

export function SocialFollowButtons() {
  return (
    <div className="flex items-center gap-3">
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0e65d9] text-white text-sm font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md shadow-blue-500/20"
      >
        <Facebook className="w-4 h-4" /> Facebook
      </a>
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md shadow-slate-900/20"
      >
        <TikTokIcon className="w-4 h-4" /> TikTok
      </a>
    </div>
  );
}

export function SocialIconLinks({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook CDLJ"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white transition-all hover:bg-[#0e65d9] hover:-translate-y-0.5 shadow-sm"
      >
        <Facebook className="w-4 h-4" />
      </a>
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok CDLJ"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:bg-black hover:-translate-y-0.5 shadow-sm"
      >
        <TikTokIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
