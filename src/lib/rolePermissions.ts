export const ROLE_DIRECTION_SPIRITUELLE = "DIRECTION_SPIRITUELLE" as const;

export type AppRole =
  | "SUPERADMIN"
  | "DIOCESAIN"
  | "VICARIAL"
  | "PAROISSIAL"
  | typeof ROLE_DIRECTION_SPIRITUELLE;

const OPERATIONAL_ROLES = ["SUPERADMIN", "DIOCESAIN", "VICARIAL", "PAROISSIAL"] as const;

const KNOWN_ROLES: readonly AppRole[] = [
  "SUPERADMIN",
  "DIOCESAIN",
  "VICARIAL",
  "PAROISSIAL",
  ROLE_DIRECTION_SPIRITUELLE,
];

/** Ramène une valeur brute (espaces, tirets, variantes) vers un rôle canonique. */
export function canonicalizeRole(role: string): string {
  const compact = role.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (KNOWN_ROLES.includes(compact as AppRole)) return compact;

  const collapsed = compact.replace(/_/g, "");
  if (
    (compact.includes("DIRECTION") || collapsed.includes("DIRECTION")) &&
    (compact.includes("SPIRITUEL") || compact.includes("SPIRITUAL") || collapsed.includes("SPIRITUEL"))
  ) {
    return ROLE_DIRECTION_SPIRITUELLE;
  }

  return compact;
}

export function normalizeRoles(roles: string[] | undefined): string[] {
  const out: string[] = [];
  for (const role of roles ?? []) {
    const canonical = canonicalizeRole(role);
    if (canonical && !out.includes(canonical)) out.push(canonical);
  }
  return out;
}

export function isDirectionSpirituelle(roles: string[] | undefined): boolean {
  return normalizeRoles(roles).includes(ROLE_DIRECTION_SPIRITUELLE);
}

/** Accès diocésain en lecture (tous les lecteurs, stats globales). */
export function isDioceseScopeReader(roles: string[] | undefined): boolean {
  const r = normalizeRoles(roles);
  return (
    r.includes("SUPERADMIN") ||
    r.includes("DIOCESAIN") ||
    r.includes(ROLE_DIRECTION_SPIRITUELLE)
  );
}

export function isDioceseManager(roles: string[] | undefined): boolean {
  const r = normalizeRoles(roles);
  return r.includes("SUPERADMIN") || r.includes("DIOCESAIN");
}

/** Compte exclusivement consultatif (Direction spirituelle sans rôle opérationnel). */
export function isReadOnlyRole(roles: string[] | undefined): boolean {
  const r = normalizeRoles(roles);
  if (!r.includes(ROLE_DIRECTION_SPIRITUELLE)) return false;
  return !r.some((role) => (OPERATIONAL_ROLES as readonly string[]).includes(role));
}

export function canManageLecteurs(roles: string[] | undefined): boolean {
  const r = normalizeRoles(roles);
  return r.some((role) => (OPERATIONAL_ROLES as readonly string[]).includes(role));
}

export function canViewLecteurs(roles: string[] | undefined): boolean {
  const r = normalizeRoles(roles);
  return (
    canManageLecteurs(r) ||
    r.includes(ROLE_DIRECTION_SPIRITUELLE)
  );
}

export function canViewActivites(roles: string[] | undefined): boolean {
  return canViewLecteurs(roles);
}

export function canManageActivites(roles: string[] | undefined): boolean {
  return isDioceseManager(roles);
}

export function canViewEvaluations(roles: string[] | undefined): boolean {
  const r = normalizeRoles(roles);
  return isDioceseManager(r) || r.includes(ROLE_DIRECTION_SPIRITUELLE);
}

export function canManageEvaluations(roles: string[] | undefined): boolean {
  return isDioceseManager(roles);
}

export function canManageActualites(roles: string[] | undefined): boolean {
  return isDioceseManager(roles);
}

export function refId(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "_id" in v) return String((v as { _id: unknown })._id);
  return "";
}

export function canAccessLecteur(
  user: { roles?: string[]; parishId?: string; vicariatId?: string },
  lecteur: { paroisseId?: unknown; vicariatId?: unknown }
): boolean {
  const roles = normalizeRoles(user.roles);
  if (isDioceseScopeReader(roles)) return true;

  const pid = refId(lecteur.paroisseId);
  const vid = refId(lecteur.vicariatId);

  if (roles.includes("VICARIAL") && user.vicariatId && vid === String(user.vicariatId)) return true;
  if (roles.includes("PAROISSIAL") && user.parishId && pid === String(user.parishId)) return true;
  return false;
}

export function formatRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPERADMIN: "Super administrateur",
    DIOCESAIN: "Diocésain",
    VICARIAL: "Vicarial",
    PAROISSIAL: "Paroissial",
    DIRECTION_SPIRITUELLE: "Direction spirituelle",
  };
  return labels[role.toUpperCase()] ?? role;
}

export function primaryRoleLabel(roles: string[] | undefined): string {
  const order: AppRole[] = [
    "SUPERADMIN",
    "DIOCESAIN",
    "VICARIAL",
    "PAROISSIAL",
    ROLE_DIRECTION_SPIRITUELLE,
  ];
  const normalized = normalizeRoles(roles);
  for (const r of order) {
    if (normalized.includes(r)) return formatRoleLabel(r);
  }
  return formatRoleLabel(normalized[0] ?? "PAROISSIAL");
}

const FORBIDDEN_PATH_PREFIXES = [
  "/paroisses",
  "/vicariats",
  "/assemblees",
  "/cotisations",
  "/grades",
  "/gestion-mediatheque",
  "/utilisateurs",
] as const;

export function isSpiritualDirectionForbiddenPath(pathname: string): boolean {
  if (FORBIDDEN_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname === "/lecteurs/new" || /^\/lecteurs\/[^/]+\/edit/.test(pathname)) return true;
  if (pathname === "/activites/new" || /^\/activites\/[^/]+\/edit/.test(pathname)) return true;
  if (/^\/activites\/[^/]+\/participer/.test(pathname)) return true;
  if (pathname === "/actualites/new" || /^\/actualites\/[^/]+\/edit/.test(pathname)) return true;
  if (/^\/actualites\/[^/]+\/stats/.test(pathname)) return true;
  return false;
}
