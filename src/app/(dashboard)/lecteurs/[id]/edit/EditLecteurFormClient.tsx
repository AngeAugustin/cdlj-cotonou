"use client";

import { useRouter } from "next/navigation";
import { LecteurForm, type LecteurFormInitial } from "@/modules/lecteurs/components/LecteurForm";

type EditLecteurFormClientProps = {
  lecteurId: string;
  initialData: LecteurFormInitial;
  lockParishVicariat?: {
    paroisseId: string;
    vicariatId: string;
    paroisseName?: string;
    vicariatName?: string;
  };
  lockGradeId: boolean;
  vicariats: { _id: string; name: string }[];
  paroisses: { _id: string; name: string; vicariatId: string }[];
};

export function EditLecteurFormClient({
  lecteurId,
  initialData,
  lockParishVicariat,
  lockGradeId,
  vicariats,
  paroisses,
}: EditLecteurFormClientProps) {
  const router = useRouter();

  return (
    <LecteurForm
      key={lecteurId}
      mode="edit"
      variant="page"
      lecteurId={lecteurId}
      initialData={initialData}
      lockParishVicariat={lockParishVicariat}
      lockGradeId={lockGradeId}
      vicariats={vicariats}
      paroisses={paroisses}
      onSuccess={() => {
        router.push(`/lecteurs/${lecteurId}`);
        router.refresh();
      }}
      onCancel={() => router.push("/lecteurs")}
    />
  );
}
