import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "span",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

/** Sanitize TipTap / article HTML before storage or render. */
export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Force safe links
    ADD_ATTR: ["target"],
  }).replace(/<a /gi, '<a rel="noopener noreferrer" ');
}
