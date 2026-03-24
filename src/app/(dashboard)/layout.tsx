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

  const user = session.user as any;

  return (
    <SidebarShell user={{ name: user.name, roles: user.roles || ["PAROISSIAL"] }}>
      {children}
    </SidebarShell>
  );
}
