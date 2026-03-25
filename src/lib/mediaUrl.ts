/** URL utilisable par le navigateur pour un fichier sous /public (évite soucis de résolution relative). */
export function absolutePublicUrl(href: string | undefined | null): string | undefined {
  if (href == null || href === "") return undefined;
  const h = href.trim();
  if (!h) return undefined;
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  if (typeof window !== "undefined" && h.startsWith("/")) {
    return `${window.location.origin}${h}`;
  }
  return h;
}
