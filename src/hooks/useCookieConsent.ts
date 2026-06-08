"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  getClientConsent,
  type ConsentStatus,
} from "@/lib/cookie-consent";

export function useCookieConsent(): ConsentStatus {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    setConsent(getClientConsent());

    const onConsent = (e: Event) => {
      setConsent((e as CustomEvent<ConsentStatus>).detail);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return consent;
}
