import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarShell from "@/components/SidebarShell";
import connectToDatabase from "@/lib/mongoose";
import { Paroisse } from "@/modules/paroisses/model";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user as { name?: string | null; roles?: string[]; parishId?: string | null };
  const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : ["PAROISSIAL"];
  let paroisseName: string | null = null;

  if (user.parishId) {
    await connectToDatabase();
    const parish = await Paroisse.findById(user.parishId).select({ name: 1 }).lean<{ name?: string } | null>();
    paroisseName = parish?.name ?? null;
  }

  return (
    <SidebarShell user={{ name: user.name, roles, paroisseName }}>
      {children}
    </SidebarShell>
  );
}
