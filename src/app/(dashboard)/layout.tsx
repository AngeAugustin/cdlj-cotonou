import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarShell from "@/components/SidebarShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user as { name?: string | null; roles?: string[] };
  const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : ["PAROISSIAL"];

  return (
    <SidebarShell user={{ name: user.name, roles }}>
      {children}
    </SidebarShell>
  );
}
