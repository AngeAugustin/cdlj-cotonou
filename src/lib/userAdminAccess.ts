/** Comptes autorisés à créer, modifier et supprimer des utilisateurs. */
export function canManageUsers(roles: string[] | undefined): boolean {
  const r = roles ?? [];
  return r.includes("SUPERADMIN") || r.includes("DIOCESAIN");
}
