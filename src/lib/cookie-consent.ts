export const CONSENT_COOKIE = "cdlj_cookie_consent";
export const CONSENT_EVENT = "cdlj:cookie-consent";

export type ConsentStatus = "accepted" | "rejected" | null;

const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export function getClientConsent(): ConsentStatus {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=(accepted|rejected)`)
  );
  return (match?.[1] as ConsentStatus) ?? null;
}

export function setClientConsent(status: "accepted" | "rejected") {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${status}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: status }));
}
