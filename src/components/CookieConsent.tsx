"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONSENT_EVENT,
  getClientConsent,
  setClientConsent,
  type ConsentStatus,
} from "@/lib/cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getClientConsent() === null);
  }, []);

  useEffect(() => {
    const onConsent = (e: Event) => {
      const status = (e as CustomEvent<ConsentStatus>).detail;
      if (status) setVisible(false);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  const accept = () => {
    setClientConsent("accepted");
    setVisible(false);
  };

  const reject = () => {
    setClientConsent("rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-4 right-4 z-[300] w-[calc(100vw-2rem)] max-w-sm sm:max-w-md pointer-events-none"
    >
      <div className="pointer-events-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 p-5 animate-in slide-in-from-bottom-4 slide-in-from-right-4 fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="cookie-consent-title" className="text-sm font-extrabold text-slate-900 leading-snug">
              Cookies et confidentialité
            </h2>
          </div>
        </div>

        <p id="cookie-consent-desc" className="mt-3 text-sm text-slate-600 leading-relaxed">
          Nous utilisons un cookie technique anonyme pour compter les vues, les likes et les
          commentaires sur nos actualités, ainsi qu&apos;une estimation de localisation (pays /
          ville) basée sur votre adresse IP. Vous pouvez accepter ou refuser ces cookies
          non essentiels.{" "}
          <Link
            href="/confidentialite"
            className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-800"
          >
            En savoir plus
          </Link>
        </p>

        <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={reject}
            className="rounded-xl border-slate-200 text-slate-700 flex-1"
          >
            Refuser
          </Button>
          <Button
            type="button"
            onClick={accept}
            className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-semibold flex-1"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
