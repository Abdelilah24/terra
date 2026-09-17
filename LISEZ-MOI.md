# Terra Sud — site vitrine HTML

Site statique en HTML/CSS/JS, sans dépendance de build. Ouvrez simplement `index.html`
dans un navigateur, ou déposez le dossier sur n'importe quel hébergement.

## Pages

| Fichier | Page |
|---|---|
| `index.html` | Accueil (héro, recherche, services, circuits, destinations, offre, avis, blog) |
| `a-propos.html` | À propos (histoire, chiffres, valeurs, équipe) |
| `circuits.html` | Listing (colonne « Filtrer par », tri, affichage grille ou liste) |
| `destinations.html` | Les onze régions, chacune liée au listing pré-filtré |
| `circuit-details.html` | Détail d'un circuit (galerie, programme jour par jour, encadré de réservation, avis) |
| `blog.html` | Blog (grille d'articles + barre latérale) |
| `article.html` | Article de blog complet |
| `contact.html` | Contact (coordonnées, formulaire de devis, carte) |

## Structure

```
terra-sud-site/
├── index.html … contact.html
└── assets/
    ├── css/style.css   ← toute la charte (couleurs, composants, responsive)
    └── js/main.js      ← menu mobile, filtres, compteurs, animations
```

### Jaquette complète du site actuel (relevé des sitemaps)

Le site de l'agence tourne sur **le gabarit Travolo** — les sitemaps
`travolo_header`, `travolo_footer` et `travolo_off_build` le montrent —
avec l'extension **WP Travel Engine** (panier, wishlist, compte client).

| Ce qu'il contient | Nombre |
|---|---|
| Fiches produit (`/trip/`) | **82** |
| Destinations (`/destinations/`) | **18** |
| Sous-familles de trek (`/activities/treks-randonnees/…`) | **9** |
| Activités principales (`/activities/`) | 4 |
| Niveaux de difficulté (`/trip-difficulty/`) | **2** — easy, medium |
| Types de voyage (`/trip-types/`) | 15 termes, soit 5 en trois langues |
| Versions linguistiques | FR (défaut), `/en/`, `/es/` |

### Taxonomies reprises à l'identique

Le moteur travaille désormais sur **trois axes**, comme le site actuel :

| Axe | Attribut de fiche | Paramètre d'URL | Valeurs |
|---|---|---|---|
| Destination | `data-dest` | `?dest=` | les 18 slugs de `/destinations/` |
| Activité (sous-famille de trek) | `data-activite` | `?activite=` | les 9 slugs de `/activities/treks-randonnees/` |
| Activité principale | `data-category` | `?type=` | `treks-randonnees`, `voyages-tours-prives`, `excursions`, `themes-events` |
| Difficulté | `data-level` | `?niveau=` | `easy`, `medium` (« Sportif » supprimé) |

`FIELDS` dans `assets/js/main.js` a été étendu et l'axe `activite` ajouté au
filtrage. Le sous-menu « Treks & Randonnées » filtre par **activité**, pas par
destination : c'est ainsi que le site actuel est organisé.

### Pages ajoutées

`pourquoi-partir-avec-nous.html`, `mentions-legales.html`, `conditions-de-vente.html`
— les trois existent sur le site actuel et manquaient ici. Les liens du pied de page,
jusqu'ici inertes, y renvoient. Les mentions légales et les CGV sont **structurelles** :
RC, IF, ICE, capital, hébergeur, barèmes d'annulation restent à compléter.

### Fiches portées à dix-sept

Ajoutées pour qu'aucune entrée de menu ne renvoie une liste vide :
Saghro & Siroua (7 j), Tafraoute & Anti-Atlas (6 j), grande traversée de l'Atlas (21 j),
randonnée atlantique d'Essaouira (4 j), Fès & Moyen Atlas (5 j).
**Textes et photos à remplacer** : seuls la structure, les durées, les niveaux et l'ordre
de prix sont réalistes.

### Ce qui n'a pas été repris

Panier, wishlist, compte client et paiement en ligne (WP Travel Engine) : le site que nous
construisons est une vitrine statique. Les versions `/en/` et `/es/` non plus — le sélecteur
de langue est prêt, les pages traduites restent à produire.


## Réservation : formulaires et parcours (sections 45 et 46)

### Phase 1 — les formulaires deviennent exploitables

Avant : **29 champs, zéro attribut `name`**. Aucun backend n'aurait pu lire
quoi que ce soit, et l'encadré de réservation n'identifiait même pas le circuit.

Chaque formulaire porte maintenant :

| | |
|---|---|
| `method="post"` et `action` | `/api/reservation`, `/api/devis`, `/api/question`, `/api/newsletter` |
| `name` sur chaque champ | `nom`, `email`, `telephone`, `date_depart`, `voyageurs`, `message`… |
| Champs techniques cachés | `_token` (CSRF, à injecter côté serveur), `sujet`, `page`, `locale` |
| Identité du produit | `circuit_slug` et `circuit_titre` sur les formulaires liés à un circuit |
| Piège à robots | champ `site_web` hors écran — rempli, la soumission est acceptée en apparence et jetée |

### États de formulaire (section 45)

Aucun n'existait. Il y en a maintenant quatre :

- **champ en erreur** — bordure terre cuite, libellé coloré, message sous le champ ;
  l'erreur n'apparaît qu'**après une première tentative**, puis se corrige à la frappe ;
- **bouton en cours d'envoi** — `.is-loading`, disque tournant, clic neutralisé ;
- **retour** — `.form-note--ok`, `--ko`, `--demo` ;
- **page de confirmation** — `merci.html`, avec référence, date et objet lus dans l'URL
  (`merci.html?ref=TS-2027-0148&sujet=reservation`).

### Contrat attendu du backend

```
POST /api/…            multipart/form-data
200  { "message": "…" }                    → note de succès
200  { "redirect": "merci.html?ref=…" }    → redirection
422  { "erreurs": { "email": "…" } }       → erreurs replacées sous les champs
```

`MODE_DEMO = true` en tête du bloc « Formulaires » dans `assets/js/main.js` :
tant qu'il vaut `true`, tout est validé et affiché mais **rien n'est envoyé**.
Passez-le à `false` le jour où les points d'entrée répondent — rien d'autre à changer.

### Phase 2 — le parcours de réservation

`reservation.html` : quatre étapes sur une page, récapitulatif collant à droite.

| Étape | Contenu |
|---|---|
| 1 — Départ | liste de départs datés : prix propre à la date, places restantes, état (garanti / dernières places / complet — désactivé) |
| 2 — Voyageurs | adultes, enfants (coefficient tarifaire), bébés ; compteurs bornés ; quatre options, au dossier ou par personne |
| 3 — Informations | contact, fiches participants **générées d'après le nombre de voyageurs**, régimes et contact d'urgence |
| 4 — Paiement | acompte 30 % ou total, moyen de règlement, acceptation des CGV et de l'obligation d'assurance |

**Aucun tarif n'est écrit dans le JavaScript.** Tout vient du HTML : `data-prix`
sur chaque départ et chaque option, `data-tarif` sur chaque tranche d'âge,
`data-unite="personne|dossier"`, `data-part` sur le mode de règlement. Un backend
qui rend cette page n'a qu'à produire ces attributs — le calcul suit.

Vérifié : 2 adultes à 379 € + 1 enfant à −25 % + camp de luxe (45 €/pers.)
+ transfert (35 €/dossier) = **1 212 €**, acompte **364 €**.

L'encadré de la fiche circuit ne duplique plus le formulaire : il résume les
conditions de départ et mène au parcours.

### Ce qui reste hors périmètre

Panier multi-produits, compte client, historique de réservations, paiement en ligne
réel, gestion des stocks de places : tout cela relève du backend à venir. La façade
est prête à s'y brancher.


## Consolidation : feuille de style, accessibilité, contrastes

La feuille s'était construite par ajouts successifs — 47 sections empilées, chacune
corrigeant la précédente. Trois chantiers l'ont remise d'aplomb, chacun vérifié
par la mesure plutôt que par relecture.

### 1. Élagage de la feuille de style

Le risque, en réorganisant une CSS, est de déplacer une règle et de changer sans
s'en apercevoir qui l'emporte dans la cascade. On a donc commencé par se donner
un filet : un relevé des **styles calculés** de chaque élément porteur de classe —
une cinquantaine de propriétés plus les pseudo-éléments `::before` et `::after` —
sur les 15 pages et 3 largeurs, soit **7 419 empreintes**. Toute modification se
juge par la comparaison avant / après de ce relevé.

Deux approches ont été essayées :

| Approche | Gain | Verdict |
|---|---|---|
| Fusionner les règles portant le même sélecteur | −3,3 Ko | **Rejetée** : 1 000 différences. Remonter une règle change son rang face aux *autres* sélecteurs. |
| Supprimer les déclarations mortes | −3,3 Ko | **Retenue** : 0 différence. |

La seconde ne déplace rien. Elle supprime uniquement la déclaration qu'une règle
**au sélecteur identique et dans le même contexte** redéclare plus bas : celle-là
ne pouvait jamais gagner. Résultat :

```
déclarations mortes supprimées : 248
règles devenues vides, retirées :  70
règles : 1 142 → 1 071     déclarations : ~3 591 → 3 302
éléments comparés : 7 419  |  différences : 0
```

Un **index des sélecteurs définis plusieurs fois** a été ajouté en tête du fichier :
60 sélecteurs avec leurs numéros de ligne, la dernière ligne citée étant celle qui
l'emporte. « Laquelle des huit définitions de `.hero-card` s'applique ? » devient une
recherche et non une enquête. À régénérer après modification (`index_css.py`).

### 2. Accessibilité du parcours de réservation

- Le fil d'étapes est un `<nav aria-label="Progression de la réservation">` ; l'étape
  courante porte `aria-current="step"`.
- Chaque étape est un `role="group"` nommé, et les étapes déjà franchies sont des
  **boutons atteignables au clavier** — les suivantes restent désactivées.
- Les groupes de choix (départs, options, paiement) sont des `fieldset` avec une
  `legend` réservée aux lecteurs d'écran.
- Les compteurs de voyageurs et le total sont en `aria-live="polite"` : la
  modification est annoncée sans déplacer le focus.
- Au changement d'étape, le focus se porte sur le titre de l'étape et une zone
  discrète annonce « Étape 2 sur 4 — Voyageurs et options ».

### 3. Contrastes portés au niveau AA

Le seuil WCAG 2.1 AA est de 4,5:1 pour le texte courant, 3:1 au-delà de 24 px.
L'audit a relevé 18 cas distincts sous le seuil. **La correction a été remontée à la
palette** plutôt qu'ajoutée en surcouche :

| Jeton | Avant | Après | Sur blanc |
|---|---|---|---|
| `--primary` | `#c05a33` | `#b4512d` | 4,42 → **5,05** |
| `--muted` (gris chaud) | `#98938b`, `#9a9a9a`, `#8b8b8b` | `#6f6a64` | 3,05 → **5,36** |
| `--muted-cool` (libellés) | `#8a8d99` | `#63666f` | 3,31 → **5,74** |

La terre cuite se resserre de quatre points de luminance — invisible à l'œil, mais
elle fait passer d'un coup le texte terre cuite sur blanc **et** le texte blanc sur
les boutons terre cuite, qui sont le même rapport. Vingt et une couleurs écrites en
dur sont devenues des jetons ; il ne reste dans la section 47 qu'une seule règle,
celle où la couleur dépend du fond (la terre cuite passe au crème sur aplat sombre).

Le texte posé sur une photo ne se mesure pas en remontant la chaîne des fonds. Les
316 zones concernées (en-tête transparent, cachets, badges) ont été mesurées **au
pixel** sur la capture rendue, le fond étant la médiane de la zone.

**Relevé final : 1 355 zones évaluées par la cascade, 316 au pixel, 0 sous le seuil.**

### 4. Listes déroulantes (section 48)

La liste bleue qui s'ouvrait au milieu d'une charte encre et terre cuite n'était
pas un oubli de style : **la liste ouverte d'un `<select>` est dessinée par le
système d'exploitation**, et aucune propriété CSS ne l'atteint. Pour la mettre à
la charte, il faut la redessiner.

Le parti pris : **ne pas remplacer le `<select>`**. Il reste le contrôle — son
étiquette, son ordre de tabulation, son état d'erreur, sa valeur et son
accessibilité ne bougent pas, et c'est toujours lui que lisent le moteur de
recherche et les formulaires. Le script n'intercepte que l'ouverture de la liste
native (`preventDefault` sur `mousedown`, plus les touches d'ouverture) pour
afficher le panneau maison et tenir les deux synchronisés. Si un navigateur
n'honore pas l'interception, la liste du système s'ouvre : moins jolie,
parfaitement fonctionnelle.

- **Sur écran tactile, rien n'est remplacé.** La roue d'iOS et la feuille
  d'Android se manient à un pouce, mieux que n'importe quel panneau maison. Le
  script s'arrête sur `(hover:hover) and (pointer:fine)`.
- **Le panneau est posé sur `<body>` en position fixe.** La barre du héro porte
  un `backdrop-filter`, qui redéfinit le bloc conteneur des éléments fixes : un
  panneau laissé dans la barre y serait rogné. Il se replace au défilement et au
  redimensionnement, et s'ouvre vers le haut quand le bas de l'écran manque.
- **Deux habillages.** Clair sur les pages, encre translucide sous la barre du
  héro — le panneau y prolonge la barre au lieu d'y coller un aplat blanc.
- **Clavier complet** : ↑ ↓, Début, Fin, Page préc./suiv., saisie des premières
  lettres, Entrée pour valider, Échap pour revenir au choix de départ, Tab pour
  valider et sortir. La valeur du `<select>` suit le parcours option par option,
  comme une liste native sous Windows, pour que les lecteurs d'écran annoncent
  chaque étape ; l'évènement `change` n'est émis qu'à la validation, une seule
  fois.
- **La coche marque le choix en vigueur, le surlignage marque le parcours** :
  deux informations différentes, deux signes différents.
- **Le chevron est dessiné** (SVG en ligne) et pivote à l'ouverture, au lieu de
  celui du système.
- **Champ de recherche au-delà de huit options** (`SEUIL_RECHERCHE` dans
  `main.js`). Dix-neuf destinations ne se parcourent pas à l'œil ; quatre durées
  si, et le champ y serait du bruit. Aujourd'hui seule la liste des destinations
  le déclenche — mais le seuil est automatique : toute liste qui grossit le
  recevra sans qu'on y retouche. La comparaison ignore accents et casse et
  cherche n'importe où dans le libellé : « vallee » trouve les trois vallées,
  « roses » trouve « Vallée des Roses & Dadès ». Le premier résultat est
  surligné pour qu'Entrée ait toujours une cible. Sans résultat, Entrée ne fait
  rien. Échap efface d'abord la recherche, puis ferme — le motif documenté pour
  une liste à filtre.
  Le champ prend le focus : le `<select>` perd alors `:focus`, et c'est la
  classe `.selectx-actif` qui porte l'allure « ouvert ». Piège au passage : dans
  le héro les champs sont aussi des `.field`, et l'aplat blanc prévu pour le
  formulaire de contact y rendait le texte, blanc lui aussi, invisible — d'où la
  règle qui rétablit le fond transparent sous la barre.

Piège rencontré, noté ici parce qu'il reviendra : plusieurs règles anciennes
posent `background` **en raccourci** (`transparent`, `#fff`, `var(--smoke)`).
Le raccourci remet `background-repeat` à `repeat` et `background-position` à
`0 0` — le chevron se répétait en frise, puis sautait en haut à gauche dès que
le champ prenait le focus. La section 48.1 réaffirme les deux valeurs avec la
même portée, plus bas dans la cascade.

### 5. Plus aucun appel à un serveur tiers (section 49)

Le site chargeait ses polices chez `fonts.googleapis.com` et ses icônes chez
`cdnjs.cloudflare.com`. Trois défauts, dans cet ordre d'importance :

1. **Une panne ou un blocage chez l'un des deux défigurait la page.** Ce n'est pas
   théorique : dans l'atelier où ce site a été construit, cdnjs était filtré — les
   882 icônes du site ne se sont jamais affichées pendant les mesures, et
   personne ne l'avait remarqué.
2. **Chaque visite prévenait deux serveurs étrangers.** L'adresse IP du visiteur
   suffit à en faire une donnée personnelle : un site européen qui appelle Google
   Fonts sans consentement a déjà été condamné pour cela.
3. Deux résolutions DNS et deux poignées de main TLS de plus avant le premier
   affichage.

Tout est désormais dans `assets/fonts/` :

| | Avant | Après |
|---|---|---|
| Polices de texte | Google Fonts, 10 fichiers | **7 fichiers, 88 Ko** — Jost et Archivo, licence SIL OFL |
| Icônes | cdnjs : 103 Ko de CSS + 302 Ko de police | **8 Ko** — Font Awesome 6 Free réduite aux icônes employées |
| Domaines contactés | 2 | **0** |

Le sous-ensemble est le point délicat : la police complète contient 2 060 icônes,
le site en utilise 56. `outils/sous-ensemble-icones.py` relit les pages, relève
les classes `fa-…` réellement écrites, découpe les trois polices en conséquence
et réécrit les règles de la section 49.

> **À relancer après tout ajout d'une icône dans le HTML.** Sans cela le glyphe
> n'existe pas dans la police livrée et la place reste vide.
>
> ```
> pip install fonttools brotli pyyaml
> npm pack @fortawesome/fontawesome-free@6 && tar xzf fortawesome-*.tgz
> python3 outils/sous-ensemble-icones.py
> ```
>
> Le script signale les icônes absentes de la version libre. C'est déjà arrivé
> une fois : `fa-tripadvisor` n'existe que dans la version payante. Le lien du
> pied de page porte pour l'instant une étoile ; le vrai pictogramme se prend
> dans la charte officielle de TripAdvisor, qui est de toute façon la seule
> source autorisée pour leur marque.

Seules les graisses appelées par la feuille sont livrées — Jost 500/600/700,
Archivo 400/500/600/700. Jost 400 n'était utilisée nulle part. Au passage,
`strong,b{font-weight:700}` : `bolder` est relatif, et dans un parent déjà en 600
il monte à 900 — le navigateur synthétisait alors une graisse non livrée.

**Mise en ligne :** sur un vrai serveur, ajoutez dans chaque `<head>` le
préchargement des deux polices du premier écran :

```html
<link rel="preload" href="assets/fonts/jost-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/archivo-400.woff2" as="font" type="font/woff2" crossorigin>
```

Elles ne sont pas dans les pages livrées à dessein : `crossorigin` déclenche un
contrôle CORS que le protocole `file://` refuse, et la console se remplissait
d'erreurs à chaque ouverture du site depuis le disque.

### 6. Visionneuse, sommaire et barre collante (sections 50 à 52)

**Les photos d'un circuit s'agrandissent.** Clic ou Entrée sur une image de la
galerie, flèches pour passer d'une photo à l'autre, Échap pour fermer ; le focus
est piégé dans la fenêtre tant qu'elle est ouverte et revient sur la photo
cliquée à la fermeture. Écrite en JavaScript simple : les visionneuses du marché
réclament jQuery, soit 90 Ko pour cent lignes de code.

**Les onglets de la fiche circuit sont devenus un sommaire (section 52).**
Aperçu, Itinéraire, Tarifs, Carte et Avis étaient cinq onglets : quatre
cinquièmes de la fiche restaient derrière un `display:none`. Trois défauts, dont
le dernier n'est pas cosmétique :

1. Le lecteur devait deviner qu'il y avait autre chose, puis cliquer pour
   l'obtenir. Sur une fiche produit, le programme jour par jour *est* l'argument
   de vente : le cacher derrière un onglet, c'est le cacher tout court.
2. Les moteurs de recherche voyaient quatre blocs masqués. Le texte qui porte
   les mots-clés du circuit — les étapes, les cols, les kasbahs — ne pesait rien.
3. La barre collante n'avait presque pas de course : l'onglet Aperçu ne faisant
   que 450 px, elle se collait pendant une demi-page puis repartait.

Les cinq sections s'enchaînent désormais, séparées par un filet. La barre reste
identique à l'œil mais change de nature : ce sont des **liens d'ancre**, et elle
**suit la lecture** — la section où l'on se trouve s'allume toute seule. Elle se
colle sous l'en-tête compact (72 px, 64 px sous 768) et accompagne toute la
fiche, du début de l'Aperçu à la fin des Avis.

- Le repérage se fait à l'`IntersectionObserver`, sur une bande de lecture
  haute d'un tiers d'écran placée juste sous la barre — pas en mesurant des
  coordonnées à chaque image du défilement.
- `scroll-margin-top` fait atterrir chaque titre visé **sous** l'en-tête et la
  barre, au lieu de le laisser passer derrière.
- Sans JavaScript, tout fonctionne : les sections sont visibles et les liens
  sont de vraies ancres. Seul l'allumage automatique disparaît.
- Sous 768 px les cinq entrées défilent sur une ligne au lieu d'en occuper deux,
  et l'entrée courante se recentre d'elle-même.

Un piège mérite d'être noté, parce qu'il touche tout `position:sticky` futur :
`html` et `body` portaient `overflow-x:hidden`, mis là contre un débordement
horizontal. Or `hidden` fait du bloc une zone de défilement, et `sticky` cesse
alors de fonctionner pour **toute** sa descendance — silencieusement. `clip`
coupe le débordement sans créer cette zone ; la section 51 fait la bascule, avec
repli sur `hidden` pour les navigateurs qui l'ignorent.

### 7. Les colonnes collantes, mesurées (section 53)

Débloquer `position:sticky` (section 51) a eu une conséquence imprévue : **trois
règles `sticky` écrites bien plus tôt dans le projet, jamais actives jusque-là
et donc jamais vérifiées, se sont réveillées d'un coup.** Deux se comportaient
mal. C'est le risque propre à une correction qui lève un blocage général : elle
ne change pas seulement ce qu'on visait.

La règle qui les gouverne toutes : **un élément collé plus haut que la place
qu'on lui laisse à l'écran cache son propre bas, définitivement.** Il ne bouge
plus, donc aucun défilement ne le rattrape.

| | Hauteur | Place à l'écran | Verdict |
|---|---|---|---|
| `.head-col` (accueil) | 392 px | 828 px | tient — conservé tel quel |
| `.booking-box` (fiche) | 509 px | 828 px | tient, mais **chevauchait** (voir ci-dessous) |
| `.filters` (circuits) | 1 781 px | 828 px | **950 px inaccessibles** |

**L'encadré de réservation.** C'était `.booking-box` seul qui était collé, avec
« Besoin d'aide ? » juste en dessous. Le premier se figeait, le second continuait
de monter, et son titre venait se poser sur « Départ garanti ». Ce n'est pas un
accident : un élément collé garde sa place dans le flux mais se peint plus bas
qu'elle, donc ses frères suivants le traversent nécessairement. C'est la colonne
entière qui se colle désormais — encadré d'aide compris, ils voyagent ensemble —
et seulement quand elle tient à l'écran (819 px de contenu ; en dessous de
940 px de hauteur de fenêtre, la colonne défile normalement, ce qui vaut mieux
qu'un bouton figé dont le bas serait coupé). **À revérifier si le contenu de
cette colonne s'allonge.**

**La colonne de filtres.** Une fois collée, les 950 px du bas — budget, niveau,
réinitialisation — devenaient inaccessibles : mesuré, le dernier bloc restait
bloqué à y = 1 672 quoi qu'on fasse. Elle garde son suivi du défilement mais
avec sa propre hauteur d'écran et son propre défilement interne.

Deux contrôles ont été ajoutés à la vérification et resteront :

- **aucun élément collé plus haut que sa place**, sauf s'il défile en interne ;
- **aucun chevauchement** entre un élément collé et ses frères suivants (en
  exigeant un recouvrement horizontal, faute de quoi deux colonnes côte à côte
  se signalent l'une l'autre).

### 8. La page respire (section 54)

Remarque du client : « le site paraît sombre ». Première réaction : ce sont les
couleurs assombries pour les contrastes (section 47). **Mesure : faux.** En
comparant la luminance moyenne des pages rendues avant et après ce changement de
palette, l'écart est de **0,13 sur 255, soit 0,08 %** — invisible. L'intuition
était bonne, la cause était ailleurs.

Le relevé des surfaces l'a montrée : **un tiers à la moitié de chaque page était
une surface sombre.**

| Page | Aplats et voiles sombres |
|---|---|
| Accueil | 41 % (héro 14,5 + section carte 10,6 + pied 10 + offre 6) |
| Destinations | 76 % (cartes 29,6 + pied 18,3 + section encre 16,9 + bandeau 11,5) |
| Blog, contact | 36 % (pied 22 + bandeau 14) |

Et surtout : les photographies ne servaient à rien, noyées sous un voile d'encre
à 78 % sur les bandeaux, 86 % au bas des cartes. Pour une agence de voyage, c'est
l'inverse de ce qu'on veut — **le paysage est l'argument de vente.**

**La contrainte.** On ne peut pas simplement éclaircir : du texte blanc sur une
photo *quelconque*, donc potentiellement très claire, exige un voile d'au moins
**59 % d'encre** pour tenir le seuil AA. Le calcul : (1−α)×255 + α×23 ≤ 118.
D'où la méthode : relever où se trouve le texte dans chaque bloc, tenir le
plancher **là et seulement là**, relâcher partout ailleurs.

| Bloc | Bande de texte relevée | Avant | Après |
|---|---|---|---|
| Héro accueil | 10 – 56 % de la hauteur | 68 % en haut, **34 % au titre**, 90 % en bas | 66 % sur la bande, 46 % et 44 % aux extrémités |
| Bandeau des pages | 46 – 100 % | 78-80 % plat | 34 % en haut, 66 % sur la bande |
| Carte destination | dès 28 % (mobile) | **14 % au milieu**, 86 % en bas | 66 % dès la bande, 72 % en bas |

Les valeurs en gras signalent un défaut qui existait déjà : le titre du héro et
le nom des destinations étaient posés sur un voile trop faible, et n'étaient
lisibles que par la grâce de photos sombres. Une seule photo claire et ils
disparaissaient. C'est corrigé du même geste.

**Le bandeau d'offre passe au crème.** Quatre aplats encre par page — en-tête,
offre, section carte, pied — c'est un de trop : le regard n'a plus de repos
entre eux. L'offre prend le crème de la charte, troisième couleur jusqu'ici
réduite à quelques filets, et son bouton reprend la terre cuite.

**Résultat mesuré** (photo neutre substituée aux vignettes de démonstration,
sans quoi la mesure serait faussée par des images sombres) :

```
luminance moyenne   164,4 → 173,6   (+5,6 %)
pixels très sombres  37,3 % → 32,3 %
dont à-propos       167,1 → 192,6   (+15,2 %)   très sombres 40,5 % → 26,1 %
```

**Vérification du pire cas.** Toutes les photos remplacées par du blanc pur — la
situation la plus défavorable possible — puis mesure au pixel des 142 zones de
texte posées sur une image : **0 sous le seuil**. Avant ce travail, le même test
en signalait 8.

### Ce que le gabarit Travolo n'a pas apporté

Le code source complet du gabarit a été examiné (`demo/`). Rien n'en a été repris,
pour des raisons qui valent d'être écrites :

- **Sa pile** : jQuery, Bootstrap, Slick, Isotope, magnific-popup, wow.js, soit
  plus de 600 Ko de JavaScript avant sa propre logique. Ce site en fait autant
  avec 50 Ko sans dépendance.
- **Sa page de réservation** (`tour-booking.html`) est une fiche produit avec un
  formulaire d'avis. Elle ne calcule aucun prix. Le parcours en quatre étapes
  construit ici lui est très supérieur.
- **Son bloc d'avis** note le confort, la nourriture et l'hygiène — critères
  d'hôtel. Les nôtres (organisation, guide, hébergement, rapport qualité-prix)
  correspondent au métier.
- **Ses polices d'icônes** sont du Font Awesome **Pro 5.13 sous licence
  commerciale**, techniquement incompatible avec notre balisage (`fa-solid`
  n'existe pas en version 5, et `fa-location-dot`, `fa-circle-check`,
  `fa-user-group` sont des noms apparus en version 6). D'où le choix de la
  version 6 Free, libre et déjà ciblée par le HTML.
- **Ses 40 Mo de photos de démonstration** ne montrent pas le Maroc et ne sont,
  comme presque toujours, pas cédées avec le gabarit pour un site en production.

Une seule idée en a été retenue : l'agrandissement des photos — reconstruit, pas
copié.

### Vérification

```
rendus vérifiés : 120 (15 pages × 8 largeurs de 320 à 1920 px)
débordements horizontaux : 0     erreurs JavaScript : 0
appels à un domaine tiers : 0    contrastes sous le seuil AA : 0
parcours de réservation : 3 adultes + 1 enfant, 2 options → 1 636 €
   3 × 379 + 379 × 0,75 + 45 × 4 personnes + 35 par dossier = 1 636 €
```

La comparaison des styles calculés avant / après a servi de garde-fou à chaque
étape. Le dernier relevé montre 3 352 éléments modifiés, ce qui inquiète jusqu'à
ce qu'on isole les causes : **2 942 le sont parce que les icônes s'affichent
enfin** (cdnjs était bloqué pendant toutes les mesures précédentes), le reste
étant la barre d'onglets collante et un décalage d'indices dû à l'insertion
d'un élément témoin. Aucune modification non voulue.

## Deux gabarits ajoutés : activité et destination (section 44)

Le site actuel expose **9 pages d'activité** et **18 pages de destination** ;
il n'en existait aucune ici, seulement un listing filtré. Ces deux gabarits
complètent le système de pages.

| Fichier | Rôle | Exemple |
|---|---|---|
| `activite.html` | page d'une sous-famille de trek | Massif du Toubkal & Haut Atlas de Marrakech |
| `destination.html` | page d'une région | Haut Atlas |

Ils réemploient les composants existants — `.trip-facts`, `.tour-card`,
`.sec-head--row`, `.row-split`, `.atlas-*`, `.offer` — et n'introduisent que
**trois composants nouveaux** :

| Composant | À quoi il sert |
|---|---|
| `.season` | calendrier de douze mois avec trois états (idéal / favorable / conditions exigeantes). C'est la première question d'un marcheur avant de réserver, et aucun composant ne savait y répondre. |
| `.link-index` | index de liens sur deux colonnes séparées par des filets, sans image : les pages sœurs sont une navigation, pas une vitrine. Variante `--ink` pour fond sombre. |
| `.atlas-svg--zoom` | détail cartographique recadré sur une région, tiré du même tracé que la carte d'accueil. `overflow:hidden` est indispensable : sans lui le tracé complet du pays déborde et traverse la page. |

### Propriétés exposées

**Page d'activité** : altitude max, niveau, durées, point de départ, hébergement,
heures de marche, portage, nombre d'itinéraires, calendrier de saison,
itinéraires du massif, les huit autres massifs.

**Page de destination** : temps depuis Marrakech, plage d'altitudes, meilleure saison,
conditions hivernales, niveaux, langues, ce qu'on y fait, situation sur la carte,
itinéraires de la région, régions à combiner.

### Accès

Ce sont des **gabarits**, pas des pages finies : un seul exemplaire de chaque.
Le sous-menu « Massif du Toubkal » et l'entrée « Toubkal & Haut Atlas » du pied
de page y mènent, pour qu'ils soient visibles. Les autres entrées continuent de
pointer vers le listing filtré.

### Limite de la construction actuelle

Les dix-sept fiches sont écrites à la main dans `circuits.html`. Le site actuel
en compte 82, plus 18 destinations et 9 activités, soit environ **110 pages**.
À la main, c'est impraticable, et toute retouche du design devrait être répétée
110 fois. Quatre voies possibles :

1. **JSON + JS** — un fichier de données, les cartes générées, `?trip=slug` sur la fiche.
   Reste statique, mais une seule URL pour toutes les fiches : SEO faible.
2. **Générateur statique** (Eleventy, Astro) — même fichier de données, mais
   110 pages HTML réelles à la compilation. URLs et SEO complets.
3. **Laravel** — modèles Trip / Activity / Destination, back-office, vues Blade.
4. **WordPress** — le site actuel tourne déjà sur Travolo + WP Travel Engine :
   notre design deviendrait un thème enfant.

Le design est prêt pour les quatre : la décision reste ouverte.


## Alignement sur l'activité réelle (terrasudadventures.com)

Le site actuel de l'agence a été relevé et le projet a été recalé dessus.

### Coordonnées et mentions — corrigées sur les 8 pages

| | Démonstration | Réel |
|---|---|---|
| Raison sociale | Terra Sud | **Terra Sud Services – Sarl** |
| Licence | — | **ODV-10945** (pied de page, tampon du héro) |
| Adresse | Avenue Mohammed V | **Imm. Soufiane N°1, Appt N°10, 4ᵉ étage, Av. Yacoub El Mansour, Guéliz — Marrakech** |
| Téléphones | +212 524 00 00 00 | **+212 661 34 80 05** · **+212 668 76 51 35** |
| E-mail | contact@terrasud.ma | **contact@terrasudadventures.com** |
| Réseaux | 4 icônes fictives | Facebook et Instagram réels, WhatsApp ; TripAdvisor et YouTube retirés (l'agence n'en a pas) |
| Langues | FR · EN · ES · AR | **FR · EN · ES** |
| Tampon | « Est. 2012 » (inventé) | **ODV-10945** |

### Navigation — par activité, comme sur le site actuel

`Accueil · Treks & Randonnées · Voyages & Tours privés · Excursions · Thèmes & Events · Contact`

« Treks & Randonnées » porte un sous-menu déroulant des neuf massifs
(Toubkal, M'Goun, Saghro & Siroua, Tafraoute & Anti-Atlas, désert, Rif, Moyen Atlas,
côte atlantique, grande traversée 21 jours). Chaque entrée ouvre le listing pré-filtré.
Sous 1199 px le sous-menu est masqué : l'entrée principale suffit dans le tiroir.

`À propos`, `Destinations` et le blog restent accessibles depuis le pied de page.

### Quatre familles de voyage

`trek` · `prive` · `excursion` · `theme` remplacent `desert / trek / culture / balneaire / excursion`
dans le moteur de recherche, les filtres du listing et l'attribut `data-category` des fiches.

### Prix en euros

Le site actuel vend en euros (75 € la journée Ourika, 458 € le Toubkal 4 jours,
669 € Fès–Merzouga 3 jours, 770 € le 6 jours chamelier). Le barème des quinze fiches a été
calé sur ces tarifs — ce ne sont **pas** des conversions du MAD, qui auraient donné des prix
trois fois trop bas. Tranches du filtre : moins de 150 € · 150–400 € · 400–800 € · plus de 800 €.

### Positionnement : le trek d'abord

Titre du héro, sur-titre (« Embarquons pour une nouvelle aventure », repris du site actuel),
ordre des cartes du héro et des fiches à la une, intitulés des sections : le trek et la
randonnée passent devant le circuit désert, comme dans l'activité réelle de l'agence.

### Trois fiches ajoutées

Saghro & Siroua (7 j), Tafraoute & Anti-Atlas (6 j) et la grande traversée de l'Atlas (21 j) :
sans elles, trois entrées du sous-menu ne renvoyaient aucun résultat. **Textes et photos à
remplacer** — seuls la structure, les durées et l'ordre de prix sont réalistes.


## Charte graphique — encre, terre cuite, crème

Trois valeurs, pas davantage. Le principe : **l'encre porte la structure, la terre cuite ne
sert qu'à signaler**. C'est le dosage, pas la teinte, qui distingue un site composé d'un
gabarit où une couleur d'accent est posée partout.

| Rôle | Valeur | Où elle est posée |
|---|---|---|
| Blanc | `#ffffff` | tout le corps du site |
| Encre | `#1b1d2a` | barre de navigation fixe, boutons au repos, bandeau défilant, encart d'offre, une carte de service sur deux, étiquettes, pied de page, titres |
| Terre cuite | `#b4512d` | uniquement les signaux : prix, remises, sur-titres, lien actif, survol des boutons, et les trois actions décisives (rechercher, voir le détail, réserver) |
| Crème | `#f2e4d5` | rehaut clair, exclusivement sur fond sombre : bouton « Réserver », actions des sections en encre, tampon |
| Gris | `#f4f4f5` · filets `#e4e4e6` | fonds d'encadrés et séparateurs — gris francs, sans reflet beige |

Le voile posé sur les photos est un gris encre neutre : la couleur vient de l'image, pas du
calque. **Angles** : les cartes portent un arrondi de 12 px en haut uniquement
(`--radius-top`), le reste du site est à angles droits.

| Rôle | Police |
|---|---|
| Titres h1–h3, prix, compteurs | **Jost** (`--font-display`) |
| Texte courant, h4–h6 | **Archivo** (`--font`) |
| Données et étiquettes | **Archivo** en capitales espacées, chiffres tabulaires (`--font-data`) |

**Rythme des sections** : les sections alternées restent blanches et se séparent par un filet
(`.bg-smoke`) ; le contraste vient de vraies sections en encre (`.bg-ink`).

Toutes ces valeurs sont des variables CSS en haut de `assets/css/style.css` :
changez-les à un seul endroit pour rehabiller le site entier.

## Identité « carnet de route »

Une couche identitaire propre à Terra Sud est définie en section 26 de `assets/css/style.css`.

| Élément | Où | Comment le modifier |
|---|---|---|
| **Typographie** | Jost (titres), Archivo (texte et données) | `--font-display`, `--font`, `--font-data` |
| **Sur-titres** `POURQUOI TERRA SUD ——` | classe `.eyebrow` | capitales espacées terre cuite suivies d'un filet |
| **Jalons d'itinéraire** (trait pointillé + losange) | `<div class="route-node"></div>` — **deux par page au maximum** | supprimez la div pour l'enlever |
| **Courbes de niveau** | `assets/img/contours-dark.svg` et `contours-light.svg` | fond des sections `.bg-smoke`, du pied de page et des bandeaux |
| **Tampon** | `.stamp` dans le héro et les bandeaux internes | masqué sous 1200 px |
| **Relevé de coordonnées** | `.coords` sous l'accroche du héro | |
| **Bandeau défilant** | `.ticker` entre la recherche et les services (accueil) | s'arrête au survol, désactivé si l'utilisateur réduit les animations |
| **Index N° des cartes** | `.tour-card::before`, `.post::before` | compteur CSS, se renumérote seul |
| **Boutons** | capitales espacées, simple changement de couleur au survol | section 26.2 |

Les données techniques (prix, durées, dates, fil d'Ariane, compteurs, étiquettes) sont en
capitales espacées à chiffres tabulaires : c'est ce qui donne au site son côté relevé de
terrain plutôt que catalogue.

## Affinage du design — section 36 de la feuille de style

Une passe de dépouillement : le site ne manquait pas d'éléments, il en répétait trop.

| Ce qui a changé | Pourquoi |
|---|---|
| **La carte circuit n'a plus de bouton** — la carte entière est le lien (`.tour-body h3 a::after`) | le bouton doublait un lien déjà présent et volait la vedette au prix |
| **Un seul point chaud par carte** : le prix reste terre cuite, la remise passe en filet | deux éléments de la même couleur côte à côte s'annulent |
| **Le `N°` quitte l'image** et redescend dans la fiche, à côté des étoiles | un seul coin occupé sur la photo : l'étiquette commerciale |
| **Héro allégé** : plus de cercles pointillés, deux tracés au lieu de cinq, voile en dégradé (clair au centre) | la photo redevient visible au lieu d'être un aplat gris |
| **Jalons d'itinéraire : deux par page** au lieu de cinq | une signature répétée cinq fois devient du papier peint |
| **Courbes de niveau : deux apparitions** (section sombre + pied de page) | idem |
| **Échelle typographique resserrée** : titres de section 39 px, titres de fiche 22 px en Archivo, chapôs 19 px | il manquait un cran entre 45 px et 20 px |
| **Deux sections sortent de l'axe central** : « Pourquoi Terra Sud » (titre à gauche, cartes 2×2 à droite, `.row-head`) et le blog (en-tête en ligne, `.sec-head--row`) | neuf sections centrées d'affilée, c'est la signature d'un site généré |
| **Une seule carte de service en encre** au lieu d'une sur deux | l'alternance en damier était décorative, pas signifiante |
| **Les chiffres rejoignent l'encart d'offre**, qui descend après les avis | les compteurs flottaient sans ancrage, et deux sections sombres se suivaient |
| **Trois circuits à la une** sur l'accueil au lieu de six | la section faisait 1 817 px à elle seule |
| **Deux formats d'image** : 16/10 (circuits, articles, cartes du héro) et 3/4 (destinations) | il y en avait quatre sur une seule page |

Résultat : accueil ramené de ≈ 8 040 px à ≈ 6 620 px, sans rien retirer d'utile.

### Deuxième passe — la carte des régions

| Ce qui a changé | Pourquoi |
|---|---|
| **La section « Destinations » devient une carte du Maroc** (`.atlas-split`, SVG tracé à la main) : onze losanges cliquables qui ouvrent le listing pré-filtré, un tracé pointillé Marrakech → Ouarzazate → Dadès → Merzouga, texte aligné à gauche | c'était la quatrième grille de cartes de la page ; c'est maintenant la seule section que le gabarit Travolo n'aurait jamais produite |
| Sous 860 px la carte est remplacée par **une liste à deux colonnes** (`.atlas-list`) | des étiquettes de 12 px dans une carte de 358 px ne se lisent pas |
| **« Lire la suite » supprimé** des cartes d'article, la carte entière est le lien | même raison que le bouton des circuits |
| **Le jalon quitte la section Circuits**, et deux sections qui se suivent se rapprochent (`.bg-smoke + .section`) | il y avait 300 px presque vides entre deux sections |
| **La carte de service en encre passe en dernière position** | en première, elle écrasait le titre juste à côté |
| **Les cartes du héro perdent leur cadre blanc** et passent en 4/3, avec un filet crème à l'intérieur | le cadre blanc de 8 px est une signature de gabarit |
| **Deux ornements retirés** : le grand guillemet des avis, le halo rond de l'encart d'offre | le premier ressemblait à un bug, le second venait de l'ancienne palette |

Pour modifier la carte : les coordonnées géographiques sont projetées une fois pour toutes dans
le SVG de `index.html`. Chaque point est un `<a class="atlas-pin">` — changez le `href`, le
`<title>` et le `<text>` pour renommer une région ; la liste mobile `.atlas-list` doit être
tenue à jour en parallèle.

**Note** : le tracé du territoire inclut les provinces du Sud, comme sur les cartes publiées au
Maroc. Le contour se fond vers le bas (masque `atlasFade`) pour garder le cadrage sur les
régions de départ.

### Troisième passe — les pages intérieures rattrapent l'accueil (section 38)

Les réglages faits sur la page d'accueil n'avaient pas été reportés sur les sept autres pages.

| Ce qui a changé | Où | Pourquoi |
|---|---|---|
| **Voile des photos allégé** : `0.12 → 0.55 → 0.90` devient `0 → 0.14 → 0.55 → 0.86`, plus une ombre portée sur le texte | `destinations.html` | les onze photos étaient invisibles : onze rectangles noirs identiques dans la page dont tout l'objet est de montrer les régions |
| **Le tampon descend en bas du bandeau** et disparaît sous 1360 px | les 7 pages intérieures | mesuré : il chevauchait le bouton « Réserver » de 14 px à 1440, et le bouton entrait de 130 px dans le tampon à 1280 et 1200 |
| **Discipline de la terre cuite** : pastilles sociales, dates du blog, boutons radio du listing, pastille « 14 ans » et bascule grille/liste passent en encre | `contact`, `blog`, `circuits`, `a-propos` | on comptait jusqu'à **8 aplats terre cuite** sur une page ; il en reste **1 à 3** |
| **L'action décisive porte la terre cuite sur chaque page** : le bouton d'envoi du devis et celui de la demande d'information rejoignent le bouton de réservation | `contact`, `circuit-details` | deux formulaires équivalents avaient deux couleurs différentes |
| **Plus de texte centré dans une carte** : `.contact-card` et `.team` passent à gauche | `contact`, `a-propos` | c'étaient les deux seules exceptions du site |
| **Les chiffres rejoignent le bloc d'appel final**, comme sur l'accueil | `a-propos` | la bande de compteurs flottait sur du blanc |
| **Largeur de ligne de l'article : 640 px** (≈ 75 signes) | `article.html` | mesuré : 784 px à 16 px ≈ 105 signes par ligne |
| **Le bouton « Voir les résultats » devient « Tout réinitialiser »** | `circuits.html` | les filtres s'appliquent à la coche : le bouton ne faisait rien |
| **Deux sections claires qui se suivent : 86 px au lieu de 110** (`.section + .section`) | tout le site | il y avait jusqu'à 300 px de blanc mort entre deux sections |


### Quatrième passe — la recherche monte dans le héro (section 39)

| Ce qui a changé | Pourquoi |
|---|---|
| **Le formulaire de recherche quitte sa section** et s'installe dans le héro, entre l'accroche et les cartes de destination | il occupait une section entière de 320 px pour une seule ligne de champs, posée dans du blanc sans attache ; il est maintenant l'aboutissement du héro et le premier geste possible |
| **Le bouton « Nos circuits » est supprimé** | il doublait l'entrée « Circuits » du menu située 200 px au-dessus, et la recherche fait mieux que « montrez-moi tout » |
| **Le relevé de coordonnées est supprimé** | le bandeau défilant juste en dessous affiche les mêmes coordonnées, pour onze régions : la même figure deux fois en 400 px |
| **L'accroche passe de trois lignes à deux** | avec le formulaire en dessous, la colonne centrale devenait trop longue |
| **Sous 767 px, la recherche se replie** derrière un bouton « Chercher un circuit » (`.search-toggle`, JS en fin de `main.js`) | quatre listes déroulantes empilées ajoutaient ~420 px au héro mobile |
| **Le tampon remonte** à 188 px du haut | la barre blanche traverse désormais le milieu du héro, là où il se trouvait |
| Le bouton « Chercher » reprend la terre cuite dans la barre blanche | la règle « fond sombre → crème » ne vaut plus une fois le bouton posé sur du blanc |
| Les champs reçoivent une couleur de texte explicite | dans le héro ils héritaient du blanc : les listes paraissaient vides |

Accueil : **6 290 px** (8 040 px au départ). Mobile : 11 403 px (12 058 px avant cette passe).


### Cinquième passe — héro (section 40)

| Ce qui a changé | Mesure |
|---|---|
| **Le tampon du héro disparaît sous 1360 px** (au lieu de 1199) | largeur réelle de la première ligne du titre : 1440 → 90 px d'écart · 1366 → 53 px · 1280 → 10 px · **1200 → 30 px de chevauchement** |
| **La barre de recherche passe de 1180 à 1000 px** | les largeurs empilées étaient 720 → 860 → 1180 (+19 % puis +37 %) ; elles font maintenant 720 → 860 → 1000 |
| **Colonnes du formulaire inégales** (`1.09 / 1.15 / .82 / .96`) | chaque liste est dimensionnée sur son intitulé le plus long : vérifié sans troncature de 800 à 1920 px |
| **Le haut du héro passe de 180 à 212 px** | l'en-tête se termine à 141 px ; le sur-titre commençait à 186 (45 px), il commence à 218 (77 px) |

Les cartes de destination du héro ont été retirées un temps puis remises : le héro fait
**940 px**, l'accueil **6 322 px**. Pour les retirer à nouveau, commenter le bloc
`.hero-cards` dans `index.html` et ajouter la classe `hero--compact` sur
`<section class="hero">` — la règle existe toujours en section 40.4.


### Sixième passe — la barre de recherche (section 41)

Deux défauts, pas un :

1. **Le blanc pur n'existait nulle part ailleurs** comme aplat de structure. Barre de
   navigation fixe, bandeau défilant, encart d'offre, pied de page : tous en encre.
   La barre blanche était le seul bloc de ce genre, et posé sur une photographie —
   elle paraissait collée dessus plutôt que dessinée avec elle.
2. **Fond `#fff` et champs `#f4f4f5`, soit 4 % d'écart** : les champs ne se lisaient pas
   comme des zones de saisie mais comme des taches pâles.

La barre passe en **encre translucide** (`rgba(23,25,36,.72)` + `backdrop-filter`), filet
crème, intitulés crème, champs sans cadre — un simple filet sous chaque valeur, texte blanc,
bouton terre cuite. Elle reprend les trois valeurs de la charte et laisse la photographie
transparaître. Un repli `@supports` densifie le fond là où `backdrop-filter` manque.

Les colonnes sont dimensionnées sur l'intitulé le plus long de chaque liste
(`1.09 / 1.15 / .82 / .96`) : vérifié sans troncature de 800 à 1920 px.


### Septième passe — les titres passent en Jost (section 42)

`--font-display` passe de **Bodoni Moda** (didone) à **Jost** (géométrique, squelette
Futura). Le réglage ne se transpose pas tel quel :

| Réglage | Bodoni Moda | Jost | Pourquoi |
|---|---|---|---|
| h1 | 62 px · graisse 600 · interligne 1.04 · crénage −.005em | **58 px · 500 · 1.08 · −.028em** | une géométrique a une hauteur d'x plus grande (même corps = plus de masse) et demande un crénage négatif franc aux grands corps, sinon les lettres rondes flottent |
| h2 | 45 px · 500 · 1.10 | **37 px · 500 · 1.14 · −.022em** | idem |
| h3 | 1.20 | **1.24 · −.014em** | |
| `font-optical-sizing` | utile (axe `opsz` de Bodoni) | sans objet | Jost n'a pas cet axe — la déclaration est conservée, sans effet ni nuisance |
| Prix, compteurs, noms sur photo | 600/700 | **600 · −.02em** | |
| Tampon | 500 · +.06em | **500 · +.10em** | une géométrique gravée demande plus d'air entre capitales |

**`text-wrap:balance`** a été ajouté sur les titres : Jost étant plus étroite, la première
ligne en tenait davantage et laissait un mot orphelin sur la seconde
(« … découvrez sa / beauté »). Les lignes sont désormais égalisées.

Les titres de fiche (`.tour-body h3`, `.post-body h3`, `.feature h3`) restent en **Archivo** :
Jost est réservée aux grands corps, aux chiffres et aux noms posés sur photo.

Le lien Google Fonts des huit pages a été mis à jour :
`family=Archivo:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600;700`.


## Moteur de recherche des circuits

Le même formulaire (`#tour-search`) sert sur l'accueil et sur le listing, avec quatre
critères qui filtrent réellement : **destination**, **type de voyage**, **durée**, **budget**.

- **Sur l'accueil** : le formulaire est dans le héro et porte `data-search-redirect="circuits.html"`. Il ne
  filtre rien sur place, il construit l'URL `circuits.html?dest=…&type=…&duree=…&budget=…`.
- **Sur le listing** : les critères sont lus dans l'URL au chargement, le formulaire se
  pré-remplit et les cartes sont filtrées sans rechargement. L'URL se met à jour à chaque
  recherche (`history.replaceState`), donc un résultat filtré est partageable par lien.
- Les **pastilles de catégorie** pilotent le champ « type » et restent synchronisées avec lui.
- Le **compteur** `#tour-count` est recalculé, la **pagination** disparaît dès qu'un filtre est
  actif, et un message « aucun résultat » propose de réinitialiser.

Chaque carte porte ses critères en attributs de données :

```html
<article class="tour-card" data-dest="merzouga" data-days="3" data-price="2400" data-category="desert">
```

Pour ajouter un circuit, il suffit de reproduire ces quatre attributs : le moteur le prend en
compte automatiquement, et l'index `N°` se renumérote seul.

**Cartes de destination** : les trois visuels du héro (`.hero-card`) sont des liens vers le
listing pré-filtré (`circuits.html?dest=merzouga`), comme les vignettes de la section
« Destinations ». Pour en changer, modifiez le `href`, le nom et le nombre de circuits.

## Ce qui vient du gabarit Travolo

La structure de plusieurs pages du gabarit a été reprise puis redessinée à notre charte :

| Page Travolo | Ce qu'on en a gardé | Où |
|---|---|---|
| Accueil | Recherche en bandeau, cartes de circuits, bandeau d'offre, avis, blog | `index.html` |
| Trips (listing) | Colonne « Filter By », modes d'affichage grille/liste | `circuits.html` |
| Trip Details | Onglets Overview / Itinerary / Cost / Map, fiche technique, points forts, circuits liés | `circuit-details.html` |
| Destinations | Archive des régions, chacune ouvrant le listing filtré | `destinations.html` |
| About / Contact | Compteurs, équipe, cartes de contact, carte | `a-propos.html`, `contact.html` |

Ce qui ne vient pas du gabarit et fait notre signature : la typographie Jost/Archivo, les
sur-titres numérotés, les jalons d'itinéraire, les courbes de niveau, le tampon, le relevé de
coordonnées, l'index `N°` des cartes, les angles droits et le dosage des couleurs.

**Listing — nouveautés** : filtres en boutons radio (destination, type, durée, budget, niveau),
application immédiate à la coche, tri par prix ou durée (`#tour-sort`), bascule grille/liste
mémorisée dans `localStorage`, compteur et message « aucun résultat ».

**Fiche circuit — nouveautés** : fiche technique en huit points, onglets
Aperçu / Itinéraire / Tarifs / Carte / Avis, points forts, détail des notes par critère
et formulaire de demande d'information.

## En-tête, logo et langues

- **En-tête transparent** : la barre supérieure et le menu sont posés par-dessus le héro
  (`.site-top`, `position:absolute`). Au-delà de 160 px de défilement, le script ajoute la
  classe `.stuck` : la barre devient fixe, se compacte et prend l'aplat terre cuite.
- **Logo** : `assets/img/logo-white.png` (version blanche), utilisé dans l'en-tête et le pied
  de page. Le fichier fourni contient une icône cassée à gauche du texte — à remplacer par le
  fichier d'origine (PNG ou SVG) sous le même nom.
- **Sélecteur de langue** : menu déroulant fonctionnel (ouverture, fermeture au clic extérieur
  ou avec `Échap`, coche sur la langue active, mémorisation dans `localStorage`). Il change
  aujourd'hui l'étiquette et l'attribut `lang` de la page. Quand les versions traduites
  existeront, décommentez la ligne indiquée dans `assets/js/main.js` :

  ```js
  window.location.href = '/' + opt.dataset.lang + '/';
  ```

## À faire avant la mise en ligne

1. **Remplacer les images.** Les visuels pointent vers `picsum.photos` (photos
   d'illustration aléatoires). Mettez vos propres photos dans `assets/img/` et
   remplacez les `src`.
2. **Remplacer les textes de démonstration** : coordonnées, prix, programmes, avis clients.
3. **Brancher les formulaires.** Ils sont en mode démonstration (`data-demo`) et
   n'envoient rien. Ajoutez un `action` vers votre script PHP ou votre service de formulaire.
4. **Carte Google Maps** : ajuster l'adresse dans l'`iframe` de `contact.html`.
5. **SEO** : les balises `<title>` et `<meta name="description">` sont déjà
   personnalisées par page — adaptez-les à vos mots-clés.

## Compatibilité

Chrome, Firefox, Safari, Edge (versions récentes). Responsive vérifié de 320 px à 1920 px (huit largeurs, quinze pages, 120 rendus). Contrastes conformes WCAG 2.1 AA. Aucun framework, aucune compilation nécessaire.
