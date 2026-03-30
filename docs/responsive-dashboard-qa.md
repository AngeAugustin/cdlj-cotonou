# Responsive Dashboard QA

## Viewports de validation
- Mobile: 360x800 et 390x844
- Tablette: 768x1024 et 820x1180
- Desktop: 1280x800 et 1440x900

## Parcours critiques
- Connexion puis accès à `/dashboard`
- Ouverture du menu mobile et navigation vers `/lecteurs`, `/activites`, `/utilisateurs`
- Consultation + action principale sur chaque page

## Checklist shell
- Le menu est accessible via le bouton hamburger sous `lg`
- Le menu se ferme sur overlay, bouton fermer, et clic sur un lien
- Le header garde profil + notifications + recherche sans overflow
- Le contenu principal reste scrollable sans clipping

## Checklist listes
- `utilisateurs`: cartes mobile lisibles + actions modifier/supprimer disponibles
- `lecteurs`: cartes mobile lisibles + accès au détail disponible
- Sur tablette/desktop, le tableau reste la vue principale
- Aucun overflow horizontal bloquant sur les cartes mobiles

## Accessibilite pratique
- Cibles tactiles >= 40px sur actions primaires
- Focus visible sur boutons et liens de navigation
- Contraste texte/action conservé sur fonds dégradés

## Plan de deploiement
1. Lot shell responsive (navigation + header)
2. Lot pages prioritaires (dashboard, lecteurs, activites, utilisateurs)
3. Lot stabilisation (retours QA multi-breakpoints et ajustements)
