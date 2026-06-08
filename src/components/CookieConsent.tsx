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
      className="fixed inset-x-0 bottom-0 z-[300] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 p-5 sm:p-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
            <Cookie className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="cookie-consent-title" className="text-base font-extrabold text-slate-900">
              Cookies et confidentialité
            </h2>
            <p id="cookie-consent-desc" className="mt-2 text-sm text-slate-600 leading-relaxed">
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
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 sm:pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={reject}
              className="rounded-xl border-slate-200 text-slate-700"
            >
              Refuser
            </Button>
            <Button
              type="button"
              onClick={accept}
              className="rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-semibold"
            >
              Accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
