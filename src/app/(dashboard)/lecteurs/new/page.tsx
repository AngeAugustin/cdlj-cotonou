import { LecteurForm } from "@/modules/lecteurs/components/LecteurForm";
import connectToDatabase from "@/lib/mongoose";
import { Vicariat } from "@/modules/vicariats/model";
import { Paroisse } from "@/modules/paroisses/model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewLecteurPage() {
  await connectToDatabase();
  const vicariats = await Vicariat.find().sort({ name: 1 }).lean();
  const paroisses = await Paroisse.find().sort({ name: 1 }).lean();

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-amber-900">Enregistrer un Lecteur</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour ajouter un nouveau membre lecteur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LecteurForm 
            vicariats={vicariats.map(v => ({ ...v, _id: v._id.toString() }))}
            paroisses={paroisses.map(p => ({ ...p, _id: p._id.toString() }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
