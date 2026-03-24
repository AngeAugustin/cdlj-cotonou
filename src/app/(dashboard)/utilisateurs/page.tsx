"use client";

import { useState } from "react";
import { Shield, Plus, Search, Edit2, Trash2, Mail, Phone, Hash, X, Check, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const AVAILABLE_ROLES = ["SUPERADMIN", "DIOCESAIN", "VICARIAL", "PAROISSIAL"];

type UserNode = {
  id: number;
  name: string;
  firstname: string;
  email: string;
  phone: string;
  numero: string;
  roles: string[];
};

export default function UtilisateursPage() {
  // Liste vide (Pas de données mockées)
  const [usersList, setUsersList] = useState<UserNode[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  
  // Champs du formulaire
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [generatedMatricule, setGeneratedMatricule] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      if (selectedRoles.length < 3) {
        setSelectedRoles([...selectedRoles, role]);
      }
    }
  };

  const openModalForCreate = () => {
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    setGeneratedMatricule(`USR-${randomChars}-${randomDigits}`);
    
    setEditUserId(null);
    setNom("");
    setPrenom("");
    setEmail("");
    setPhone("");
    setSelectedRoles([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: UserNode) => {
    setEditUserId(user.id);
    setGeneratedMatricule(user.numero); // Garde son matricule existant
    setNom(user.name);
    setPrenom(user.firstname);
    setEmail(user.email);
    setPhone(user.phone || "");
    setSelectedRoles(user.roles);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteUserId(id);
  };

  const confirmDelete = () => {
    if (deleteUserId !== null) {
      setUsersList(usersList.filter(user => user.id !== deleteUserId));
      showToast("Utilisateur supprimé avec succès", "success");
      setDeleteUserId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du numéro de téléphone s'il est renseigné
    if (phone && !/^01\d{8}$/.test(phone)) {
      showToast("Le numéro doit contenir 10 chiffres et commencer par 01.", "error");
      return;
    }

    if(nom && prenom && email && selectedRoles.length > 0) {
      if (editUserId !== null) {
        // Mode Modification
        setUsersList(usersList.map(user => {
          if (user.id === editUserId) {
            return {
              ...user,
              name: nom.toUpperCase(),
              firstname: prenom,
              email,
              phone,
              roles: selectedRoles
            };
          }
          return user;
        }));
        showToast("Utilisateur modifié avec succès", "success");
      } else {
        // Mode Création
        const newUser: UserNode = {
          id: Date.now(), // ID unique simulé
          name: nom.toUpperCase(),
          firstname: prenom,
          email,
          phone,
          numero: generatedMatricule,
          roles: selectedRoles
        };
        setUsersList([newUser, ...usersList]);
        showToast("Utilisateur créé avec succès", "success");
      }
      setIsModalOpen(false);
    } else {
      showToast("Veuillez remplir le nom, prénom, email et un rôle stipulé.", "error");
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Utilisateurs & Rôles</h1>
          <p className="text-slate-500 mt-2 text-lg">Gérez les accès administrateurs et membres du bureau de la CDLJ.</p>
        </div>
        <Button 
          onClick={openModalForCreate}
          className="h-12 px-8 rounded-2xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-xl shadow-amber-900/20"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouvel Utilisateur
        </Button>
      </div>

      {/* Barre de Recherche et Filtres */}
      {usersList.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou matricule..." 
              className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Liste des Utilisateurs */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden min-h-[400px]">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <Shield className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun utilisateur enregistré</h3>
            <p className="text-slate-500 max-w-sm mb-6">Ajoutez un administrateur depuis l'interface système pour peupler cette liste.</p>
            <Button 
              onClick={openModalForCreate}
              variant="outline"
              className="px-6 rounded-xl border-slate-200 text-amber-900 font-bold hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajouter un compte administrateur
            </Button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[10px] font-extrabold tracking-widest text-slate-500">
                <th className="p-6 font-semibold">Identité</th>
                <th className="p-6 font-semibold hidden md:table-cell">Contact</th>
                <th className="p-6 font-semibold">Rôles assignés</th>
                <th className="p-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-amber-900 bg-amber-100 shrink-0">
                        {user.firstname.charAt(0)}{user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-base">{user.name} {user.firstname}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{user.numero}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Mail className="w-4 h-4 text-slate-400" /> {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Phone className="w-4 h-4 text-slate-400" /> {user.phone || "Non renseigné"}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map(role => (
                        <span key={role} className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          role === 'SUPERADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                          role === 'DIOCESAIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          role === 'VICARIAL' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModalForEdit(user)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                        title="Révoquer accès"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                     <div className="flex items-center justify-end gap-2 lg:hidden">
                      <button 
                        onClick={() => openModalForEdit(user)}
                        className="p-2 text-amber-600 bg-amber-50 rounded-xl"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user.id)}
                        className="p-2 text-red-600 bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Custom Modal for User Creation/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editUserId ? "Modifier l'Utilisateur" : "Créer un Utilisateur"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Autorisation système</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Matricule Auto-généré (Lecture seule) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Matricule Attribué</label>
                  <div className="font-mono font-bold text-amber-900 text-lg tracking-widest">{generatedMatricule}</div>
                </div>
                <div className="p-2 bg-amber-900/10 text-amber-900 rounded-lg">
                  <Hash className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nom</label>
                  <input required type="text" value={nom} onChange={(e)=>setNom(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all uppercase" placeholder="Nom de famille" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Prénom(s)</label>
                  <input required type="text" value={prenom} onChange={(e)=>setPrenom(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all capitalize" placeholder="Prénom(s)" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => {
                        const onlyNumbers = e.target.value.replace(/\D/g, '');
                        setPhone(onlyNumbers.substring(0, 10));
                      }}
                      pattern="^01\d{8}$"
                      maxLength={10}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 outline-none transition-all" 
                      placeholder="01XXXXXXXX" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Adresse Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all" placeholder="email@cdlj.tg" />
                  </div>
                </div>
              </div>

              {/* Roles Selection */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-700">Rôles Système (Max 3)<span className="text-red-500 ml-1">*</span></label>
                  <span className="text-xs font-bold text-slate-400">{selectedRoles.length}/3 sélectionnés</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_ROLES.map(role => {
                    const isSelected = selectedRoles.includes(role);
                    const isDisabled = !isSelected && selectedRoles.length >= 3;
                    return (
                      <div 
                        key={role}
                        onClick={() => !isDisabled && handleRoleToggle(role)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-amber-900 bg-amber-50' 
                            : isDisabled 
                              ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                              : 'border-slate-100 hover:border-amber-900/30 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                          isSelected ? 'bg-amber-900 border-amber-900 text-white' : 'bg-white border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`font-bold text-sm select-none ${isSelected ? 'text-amber-900' : 'text-slate-600'}`}>{role}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="h-12 px-6 rounded-xl font-bold text-slate-600 hover:bg-slate-200 w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" disabled={selectedRoles.length === 0} className="h-12 px-8 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-900/20 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                {editUserId ? "Enregistrer les modifications" : "Créer l'utilisateur"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Suppression */}
      <Dialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-center text-base">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-center">
              Êtes-vous sûr de vouloir révoquer l'accès système de cet utilisateur définitivement ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Supprimer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none border ${
          toast.type === "success" 
            ? "bg-slate-900 border-slate-800 text-white" 
            : "bg-red-50 border-red-200 text-red-900"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
