import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarShell from "@/components/SidebarShell";
import { normalizeRoles, primaryRoleLabel } from "@/lib/rolePermissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user as {
    name?: string | null;
    roles?: string[];
    paroisseName?: string | null;
  };
  const roles = normalizeRoles(
    Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : ["PAROISSIAL"]
  );

  return (
    <SidebarShell
      user={{
        name: user.name,
        roles,
        roleLabel: primaryRoleLabel(roles),
        paroisseName: user.paroisseName ?? null,
      }}
    >
      {children}
    </SidebarShell>
  );
}
