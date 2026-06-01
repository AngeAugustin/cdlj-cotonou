type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Injecte un bloc JSON-LD schema.org dans le `<head>` via le rendu serveur. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
