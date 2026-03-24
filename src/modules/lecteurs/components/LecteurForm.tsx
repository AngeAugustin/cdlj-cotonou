// @ts-nocheck
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createLecteurSchema } from "../schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof createLecteurSchema>;

export function LecteurForm({
  vicariats = [],
  paroisses = []
}: {
  vicariats?: any[];
  paroisses?: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<any>({
    resolver: zodResolver(createLecteurSchema),
    defaultValues: {
      nom: "",
      prenoms: "",
      sexe: "M",
      anneeAdhesion: new Date().getFullYear(),
      niveau: "1ère étape",
      contact: "",
      contactUrgence: "",
      adresse: "",
      vicariatId: "",
      paroisseId: "",
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const res = await fetch("/api/lecteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      router.push("/lecteurs");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création du lecteur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prenoms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénoms</FormLabel>
                <FormControl>
                  <Input placeholder="Prénoms" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
             control={form.control}
             name="dateNaissance"
             render={({ field: { value, onChange, ...rest } }) => (
               <FormItem>
                 <FormLabel>Date de naissance</FormLabel>
                 <FormControl>
                   <Input 
                     type="date" 
                     value={value ? new Date(value).toISOString().split('T')[0] : ''} 
                     onChange={(e) => onChange(e.target.valueAsDate)} 
                     {...rest} 
                   />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />

          <FormField
            control={form.control}
            name="sexe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexe</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Sexe" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vicariatId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vicariat</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Sélectionner le vicariat" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vicariats.map(v => (
                       <SelectItem key={v._id.toString()} value={v._id.toString()}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paroisseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paroisse</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Sélectionner la paroisse" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paroisses.map(p => (
                       <SelectItem key={p._id.toString()} value={p._id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact personnel</FormLabel>
                <FormControl>
                  <Input placeholder="Numéro de téléphone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactUrgence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact d'urgence</FormLabel>
                <FormControl>
                  <Input placeholder="En cas d'urgence..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="adresse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse d'habitation</FormLabel>
                <FormControl>
                  <Input placeholder="Quartier, Repère" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anneeAdhesion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Année d'adhésion</FormLabel>
                <FormControl>
                   <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="niveau"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau</FormLabel>
                <FormControl>
                  <Input placeholder="ex: 1ère Période" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={loading} type="submit" className="w-full bg-amber-900 hover:bg-amber-800">
          {loading ? "Création en cours..." : "Enregistrer le lecteur"}
        </Button>
      </form>
    </Form>
  );
}
