import sanitizeHtml from "sanitize-html";

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

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "name", "target", "rel", "class"],
  span: ["class", "style"],
  p: ["class"],
  h1: ["class"],
  h2: ["class"],
  h3: ["class"],
  h4: ["class"],
  blockquote: ["class"],
  ul: ["class"],
  ol: ["class"],
  li: ["class"],
};

/** Sanitize TipTap / article HTML before storage or render. */
export function sanitizeArticleHtml(dirty: string): string {
  if (!dirty) return "";

  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
        },
      }),
    },
  });
}
