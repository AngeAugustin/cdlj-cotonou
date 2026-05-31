/**
 * Normalise un document lecteur (lean Mongoose) pour la réponse JSON client :
 * dates en ISO, _id en string, photo d’identité (camelCase ou snake_case), refs peuplées.
 */
export function serializeLecteur(doc: unknown): unknown {
  if (!doc || typeof doc !== "object") return doc;
  const row = doc as Record<string, unknown>;
  const out: Record<string, unknown> = { ...row };

  const dn = row.dateNaissance;
  if (dn != null) {
    if (dn instanceof Date && !Number.isNaN(dn.getTime())) {
      out.dateNaissance = dn.toISOString();
    } else if (typeof dn === "string" && dn.trim()) {
      out.dateNaissance = dn.trim();
    } else if (typeof dn === "number" && Number.isFinite(dn)) {
      const asDate = new Date(dn);
      if (!Number.isNaN(asDate.getTime())) out.dateNaissance = asDate.toISOString();
    } else if (typeof dn === "object" && dn !== null && "$date" in dn) {
      const raw = (dn as { $date: unknown }).$date;
      if (typeof raw === "number" && Number.isFinite(raw)) {
        const asDate = new Date(raw);
        if (!Number.isNaN(asDate.getTime())) out.dateNaissance = asDate.toISOString();
      } else {
        out.dateNaissance = String(raw);
      }
    }
  }

  if (row._id != null) out._id = String(row._id);

  const pid =
    (typeof row.photoIdentite === "string" && row.photoIdentite.trim()) ||
    (typeof row.photo_identite === "string" && row.photo_identite.trim()) ||
    "";
  if (pid) out.photoIdentite = pid;

  const normRef = (ref: unknown) => {
    if (ref && typeof ref === "object" && ref !== null) {
      const r = ref as Record<string, unknown>;
      const copy = { ...r };
      if (r._id != null) copy._id = String(r._id);
      return copy;
    }
    return ref;
  };
  if (row.vicariatId !== undefined) out.vicariatId = normRef(row.vicariatId);
  if (row.paroisseId !== undefined) out.paroisseId = normRef(row.paroisseId);
  if (row.gradeId !== undefined) out.gradeId = normRef(row.gradeId);

  return out;
}

function toIso(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value.trim();
  return String(value);
}

/** Normalise l’historique de participations pour la réponse JSON client. */
export function serializeParticipationHistory(rows: unknown): unknown[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    const r = row as Record<string, unknown>;
    const activiteRaw = r.activite;
    let activite: Record<string, unknown> | null = null;
    if (activiteRaw && typeof activiteRaw === "object") {
      const a = activiteRaw as Record<string, unknown>;
      activite = {
        _id: a._id != null ? String(a._id) : undefined,
        nom: a.nom,
        dateDebut: toIso(a.dateDebut),
        dateFin: toIso(a.dateFin),
        lieu: a.lieu,
        terminee: a.terminee,
        montant: a.montant,
      };
    }
    return {
      paidAt: toIso(r.paidAt),
      activite,
    };
  });
}
