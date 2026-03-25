import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LecteurForm } from "@/modules/lecteurs/components/LecteurForm";
import connectToDatabase from "@/lib/mongoose";
import { Vicariat } from "@/modules/vicariats/model";
import { Paroisse } from "@/modules/paroisses/model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewLecteurPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { roles?: string[]; parishId?: string; vicariatId?: string } | undefined;
  const roles: string[] = user?.roles ?? [];
  const isParoissial = roles.includes("PAROISSIAL");

  await connectToDatabase();

  let vicariats: { _id: string; name: string }[] = [];
  let paroisses: { _id: string; name: string; vicariatId: string }[] = [];

  if (isParoissial && user?.vicariatId && user?.parishId) {
    const [vList, pList] = await Promise.all([
      Vicariat.find({ _id: user.vicariatId }).sort({ name: 1 }).lean(),
      Paroisse.find({ _id: user.parishId }).sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: v._id.toString(), name: v.name }));
    paroisses = pList.map((p) => ({ _id: p._id.toString(), name: p.name, vicariatId: String(p.vicariatId) }));
  } else {
    const [vList, pList] = await Promise.all([
      Vicariat.find().sort({ name: 1 }).lean(),
      Paroisse.find().sort({ name: 1 }).lean(),
    ]);
    vicariats = vList.map((v) => ({ _id: v._id.toString(), name: v.name }));
    paroisses = pList.map((p) => ({ _id: p._id.toString(), name: p.name, vicariatId: String(p.vicariatId) }));
  }

  const lockParishVicariat =
    isParoissial && user?.parishId && user?.vicariatId
      ? {
          paroisseId: String(user.parishId),
          vicariatId: String(user.vicariatId),
          paroisseName: paroisses[0]?.name,
          vicariatName: vicariats[0]?.name,
        }
      : undefined;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Card className="border-slate-100 shadow-xl shadow-slate-200/20 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-900/5 to-transparent border-b border-slate-100">
          <CardTitle className="text-2xl text-amber-900">Enregistrer un lecteur</CardTitle>
          <CardDescription className="text-base">
            Renseignez les informations prévues par le référentiel : identité, scolarité, contacts, photo d&apos;identité. Le numéro
            unique est généré automatiquement à l&apos;enregistrement.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <LecteurForm mode="create" vicariats={vicariats} paroisses={paroisses} lockParishVicariat={lockParishVicariat} />
        </CardContent>
      </Card>
    </div>
  );
}
