import { ApiConnectionError } from "fedapay";

function flattenFedapayFieldErrors(errors: unknown): string[] {
  if (!errors || typeof errors !== "object") return [];
  const lines: string[] = [];
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      for (const item of value) lines.push(`${field}: ${String(item)}`);
    } else if (value != null) {
      lines.push(`${field}: ${String(value)}`);
    }
  }
  return lines;
}

/** Message lisible depuis une erreur inconnue (y compris FedaPay ApiConnectionError, qui n'étend pas Error). */
export function getErrorMessage(error: unknown, fallback = "Erreur serveur"): string {
  if (error instanceof ApiConnectionError) {
    const parts: string[] = [];
    const apiMessage =
      typeof error.errorMessage === "string" && error.errorMessage.trim()
        ? error.errorMessage.trim()
        : typeof error.message === "string"
          ? error.message.trim()
          : "";
    if (apiMessage) parts.push(apiMessage);
    parts.push(...flattenFedapayFieldErrors(error.errors));
    if (parts.length) return parts.join(" — ");
  }

  if (error instanceof Error) {
    return error.message.trim() || fallback;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}
