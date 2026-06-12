/** Message lisible depuis une erreur inconnue (y compris FedaPay ApiConnectionError, qui n'étend pas Error). */
export function getErrorMessage(error: unknown, fallback = "Erreur serveur"): string {
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
