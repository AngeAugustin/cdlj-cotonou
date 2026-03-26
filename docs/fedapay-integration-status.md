# FedaPay Integration Status

## Objectif

Ce document fait le point sur l'integration FedaPay de l'application :

- ce qui a ete corrige
- ce qui a ete renforce
- ce qui reste encore a traiter
- les limites connues

Il sert de reference technique pour les futures evolutions du flux de paiement des activites.

## Resume Executif

Le flux a ete sensiblement durci par rapport a la version initiale.

Les points suivants sont maintenant couverts :

- limitation des doubles creations de paiement pour un meme panier
- reutilisation d'un paiement deja ouvert quand c'est pertinent
- prevention des paiements pour des lecteurs deja inscrits
- gestion du cas "pending trop long" avec passage en `non_finalized`
- traitement du cas "paiement confirme mais inscription metier non finalisee" avec statut `approved_pending_registration`
- reprise manuelle `SUPERADMIN` d'un paiement `approved_pending_registration`
- politique de remboursement total avec desinscription logique des lecteurs lies au paiement
- fallback webhook via `internalPaymentId`
- re-synchronisation des paiements ouverts lors de certaines lectures
- meilleure tracabilite du statut passerelle et de la raison metier

En revanche, l'integration n'est pas encore "100% industrialisee". Certains sujets restent a arbitrer ou a automatiser.

## Statuts Metier Disponibles

Le modele de paiement d'activite supporte maintenant les statuts suivants :

- `pending`
- `approved`
- `refunded`
- `declined`
- `canceled`
- `failed`
- `non_finalized`
- `approved_pending_registration`

### Sens de chaque statut

- `pending` : paiement cree, aucune resolution finale fiable disponible
- `approved` : paiement confirme et inscription des lecteurs finalisee
- `refunded` : paiement rembourse en totalite et participations liees marquees comme rembourrees
- `declined` : paiement refuse par la passerelle
- `canceled` : annulation explicitement confirmee par la passerelle
- `failed` : erreur technique pendant l'initialisation ou la preparation du paiement
- `non_finalized` : paiement reste sans issue finale exploitable apres delai d'attente
- `approved_pending_registration` : paiement confirme par la passerelle, mais finalisation metier en erreur ou en attente de regularisation

## Champs Techniques Ajoutes

Le paiement stocke maintenant des informations supplementaires :

- `requestFingerprint`
- `paymentUrl`
- `gatewayStatus`
- `statusReason`
- `timedOutAt`

### Utilite

- `requestFingerprint` : evite de recreer plusieurs paiements equivalents pour le meme panier
- `paymentUrl` : permet de reutiliser un checkout deja ouvert
- `gatewayStatus` : conserve le statut brut/normalise remonte par FedaPay
- `statusReason` : garde une explication metier ou technique sur la situation
- `timedOutAt` : trace le moment ou un paiement a ete considere comme non finalise

## Ce Qui A Ete Reellement Implemente

### 1. Idempotence cote `pay/init`

Le backend calcule maintenant une empreinte stable du panier de paiement a partir de :

- `activiteId`
- `paroisseId`
- `userId`
- la liste triee des lecteurs
- le montant total

Si un paiement equivalent existe deja :

- on le recharge
- on le resynchronise si besoin
- on le reutilise s'il est encore ouvert
- on evite la creation d'une nouvelle transaction FedaPay inutile

### 2. Prevention du double paiement sur des lecteurs deja inscrits

Avant de lancer un paiement, le backend verifie maintenant si des lecteurs du panier sont deja inscrits.

Si oui :

- la creation du paiement est refusee
- une erreur metier est renvoyee

### 3. Gestion des erreurs d'initialisation

Avant, un paiement local pouvait rester en `pending` si l'appel FedaPay echouait en cours de route.

Maintenant :

- si la creation client ou transaction echoue apres creation locale
- le paiement est bascule en `failed`
- une raison technique est enregistree dans `statusReason`

### 4. Fallback webhook via `internalPaymentId`

Le webhook ne depend plus uniquement de `fedapayTransactionId`.

Si le webhook arrive alors que le lien transaction locale n'a pas encore ete completement persiste :

- `custom_metadata.internalPaymentId` permet de retrouver le paiement local
- le traitement peut continuer proprement

### 5. Cas "paiement confirme mais inscription impossible"

Si FedaPay confirme le paiement mais que l'enregistrement des participations echoue :

- le paiement ne reste plus dans un statut ambigu
- il passe en `approved_pending_registration`
- la situation devient visible et regularisable

### 6. Timeout long sur un `pending`

Quand le paiement reste sans resolution exploitable apres delai :

- l'interface arrete d'attendre
- le backend peut basculer le paiement en `non_finalized`
- l'etat devient visible dans le back-office

### 7. Reconciliation a la lecture

Quand on consulte certains ecrans :

- les paiements encore ouverts peuvent etre resynchronises
- cela reduit les cas ou le statut reste bloque faute de webhook exploite a temps

### 8. UI des paiements

Le back-office affiche maintenant des libelles plus lisibles :

- `Approuve`
- `En attente`
- `Non finalise`
- `A finaliser`
- `Rembourse`
- `Annule`
- `Refuse`
- `Echec`

### 9. Reprise manuelle d'inscription

Pour les paiements en `approved_pending_registration`, un `SUPERADMIN` peut maintenant relancer la finalisation locale depuis l'onglet Paiements.

La reprise :

- relance la synchronisation du paiement concerne
- retente l'enregistrement des participations
- confirme le succes si le paiement repasse en `approved`
- laisse une anomalie visible si la finalisation echoue encore

### 10. Politique metier de remboursement

La regle metier est maintenant la suivante :

- seuls les remboursements totaux sont supportes
- un remboursement total annule l'effet metier du paiement
- les lecteurs lies au `paiementId` sont desinscrits logiquement
- les remboursements partiels ne sont pas supportes par la politique metier

Implementation V1 :

- le paiement passe en `refunded`
- les participations liees au paiement passent en statut `refunded`
- les listes et comptes de participants ne prennent plus en compte que les participations `active`
- si FedaPay remonte un remboursement partiel, une trace technique est conservee via `statusReason`

## Ce Qui A Ete Corrige Par Rapport Aux Findings Initiaux

### Findings couverts

Les sujets suivants ont ete pris en charge au moins partiellement ou completement :

- paiement capture mais inscription metier echouee
- absence d'idempotence sur l'initialisation
- paiements `pending` orphelins apres erreur d'init
- webhook incapable de retomber sur le paiement local sans `fedapayTransactionId`
- manque de distinction entre `pending`, `canceled` et "abandon utilisateur"

### Findings ameliores mais pas totalement closes

Les sujets suivants ont ete ameliores, mais pas totalement industrialises :

- gestion des retours tardifs FedaPay
- robustesse globale du traitement hors navigateur

## Ce Qui Reste

### 1. Job de reconciliation serveur periodique

Ce point est maintenant implemente.

Une route de job existe :

- `/api/jobs/reconcile-activite-payments`

Et un cron Vercel a ete ajoute :

- toutes les 10 minutes via `vercel.json`

Le job :

- balaie les paiements ouverts
- relance une synchronisation FedaPay quand un `fedapayTransactionId` est connu
- peut marquer en echec certains `pending` incoherents sans transaction FedaPay

### Authentification du job

Le job accepte :

- `Authorization: Bearer <CRON_SECRET>`
- ou `x-cron-secret: <CRON_SECRET>`
- ou `?secret=<CRON_SECRET>`

En local, si `CRON_SECRET` n'est pas defini, l'appel depuis `localhost` est accepte pour faciliter les tests.

### Lien avec l'idempotence

Le job de reconciliation ne remplace pas l'idempotence.

Les deux traitent des moments differents du cycle de vie :

- **idempotence sur `pay/init`** : empeche de creer plusieurs paiements pour le meme panier
- **reconciliation serveur** : traite les paiements deja crees qui sont restes ouverts, ambigus ou en anomalie

Autrement dit :

- l'idempotence agit **a l'entree**
- la reconciliation agit **apres creation**, quand la passerelle et le systeme local doivent etre remis en phase

### 2. Politique metier de remboursement

La politique est maintenant tranchee :

- un remboursement est obligatoirement total
- un remboursement total desinscrit les lecteurs lies au paiement
- les remboursements partiels ne sont pas supportes

Le systeme applique cette regle en marquant le paiement `refunded` et les participations liees `refunded`, sans suppression physique de l'historique.

### 3. Supervision operateur

Il manque encore un veritable dispositif d'exploitation :

- liste des paiements en `approved_pending_registration`
- filtres d'anomalie
- traces d'investigation plus visibles

### 4. Source de verite explicite

Le modele est deja beaucoup meilleur, mais il n'y a pas encore une distinction totalement formalisee entre :

- statut metier local
- statut brut FedaPay
- origine de la derniere resolution

Une evolution possible serait d'ajouter un champ type :

- `resolutionSource`

avec des valeurs comme :

- `webhook`
- `client_poll`
- `timeout_patch`
- `backoffice_refresh`
- `manual`

### 5. Gestion du duplicate customer FedaPay

La detection du client deja existant repose encore en partie sur un message d'erreur susceptible d'evoluer.

Ce point est fonctionnel, mais pas idealement robuste si FedaPay change :

- sa langue de message
- son format d'erreur
- sa structure SDK

## Recommandations de Suite

Ordre recommande pour la suite :

1. Ajouter une vue back-office d'anomalies de paiement
2. Tracer explicitement l'origine de resolution du paiement
3. Ajouter des alertes operateur sur les paiements en `approved_pending_registration`
4. Durcir encore le traitement du cas `partial_refund_not_supported`
5. Renforcer la gestion du duplicate customer FedaPay

## Conclusion

Le flux est maintenant nettement plus solide qu'au depart.

On a corrige les trous les plus dangereux pour une integration d'agregateur :

- duplication
- perte de lien webhook
- statuts ambigus
- absence de statut metier quand la passerelle dit "oui" mais que la finalisation locale rate

Le systeme n'est toutefois pas encore au niveau "plateforme de paiement totalement exploitable sans surveillance".

Ce qui reste a faire releve surtout de :

- l'exploitation
- la reconciliation automatique
- la gouvernance metier des cas limites
