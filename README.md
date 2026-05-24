# Site vitrine — Lucillien Tavernier

Site web statique, fait main en HTML / CSS / JavaScript, sans framework.

## Démarrer le site en local

Le site utilise `fetch()` pour charger ses contenus (JSON, partials HTML),
ce qui ne fonctionne pas si on ouvre directement le `index.html` dans le
navigateur. Il faut lancer un petit serveur web local. Trois options :

**Option A — Python (déjà installé sur la plupart des Mac et Linux)**

```bash
cd lucillien-tavernier
python3 -m http.server 8000
```

Puis on ouvre <http://localhost:8000> dans le navigateur.

**Option B — VSCode**

Installer l'extension *Live Server*, faire clic droit sur `index.html`
→ *Open with Live Server*.

**Option C — Node.js (si déjà installé)**

```bash
npx serve lucillien-tavernier
```

## Structure du projet

```
lucillien-tavernier/
├── index.html                # Page d'accueil (diaporama hero)
├── travaux.html              # Galerie des œuvres
├── demarche.html             # Démarche artistique
├── biographie.html           # Expositions, résidences, lauréats, festivals
├── textes.html               # Textes critiques sur le travail
│
├── css/
│   ├── style.css             # Tout le style du site
│   └── fonts.css             # Déclaration des polices locales (Cormorant, Inter)
│
├── fonts/                    # Fichiers WOFF2 des polices (auto-hébergées)
│
├── js/
│   ├── partials.js           # Charge la nav et le footer dans chaque page
│   ├── hero-slideshow.js     # Diaporama de la page d'accueil
│   ├── gallery.js            # Génère la galerie depuis works.json
│   ├── lightbox.js           # Ouvre une image en plein écran au clic
│   ├── exhibitions.js        # Affiche les expos depuis exhibitions.json
│   └── texts.js              # Affiche les textes depuis texts.json
│
├── partials/
│   ├── nav.html              # La navigation (à éditer pour changer le menu)
│   └── footer.html           # Le footer (contact, copyright)
│
├── data/
│   ├── works.json            # ⭐ Source de vérité des œuvres
│   ├── exhibitions.json      # ⭐ Expositions, résidences, programmes
│   └── texts.json            # ⭐ Textes critiques sur le travail
│
├── images/
│   ├── works/                # Photos des œuvres, organisées par série
│   ├── home/                 # Images pour la page d'accueil
│   └── icons/                # Icônes SVG (Instagram, mail, etc.)
│
└── documents/
    └── portfolio-tavernier.pdf  # PDF d'archive, plus lié depuis le site
```

## Modifier le contenu

### Ajouter une nouvelle œuvre dans une série existante

1. Mettre la photo dans le bon dossier : par exemple
   `images/works/caprice/ma-nouvelle-piece.jpg`
2. Ouvrir `data/works.json`
3. Dans le tableau `"works"` de la série concernée, ajouter un objet :

```json
{
  "id": "ma-nouvelle-piece",
  "src": "images/works/caprice/ma-nouvelle-piece.jpg",
  "alt": "Description courte de l'image pour les lecteurs d'écran",
  "title": "Titre de l'œuvre",
  "year": "2025",
  "materials": ["chêne", "pierre"],
  "dimensions": "20 × 30 × 15 cm"
}
```

Sauvegarder, recharger la page Travaux : la nouvelle œuvre apparaît.

### Ajouter une nouvelle série

1. Créer un nouveau dossier dans `images/works/` (en minuscules,
   avec des tirets au lieu d'espaces, ex: `nouvelle-serie/`)
2. Y mettre les photos
3. Dans `data/works.json`, ajouter un objet dans le tableau `"series"` :

```json
{
  "id": "nouvelle-serie",
  "title": "Nom affiché de la série",
  "period": "2025",
  "description": "Quelques lignes pour présenter la série.",
  "materials": ["bois", "métal"],
  "cover": "images/works/nouvelle-serie/image-de-couverture.jpg",
  "works": [
    {
      "src": "images/works/nouvelle-serie/01.jpg",
      "alt": "...",
      "title": "..."
    }
  ]
}
```

### Champs disponibles pour une œuvre

| Champ | Obligatoire ? | Description |
|---|---|---|
| `src` | **oui** | Chemin de l'image |
| `alt` | **oui** | Description pour lecteurs d'écran (voir ci-dessous) |
| `title` | non | Titre de l'œuvre |
| `year` | non | Année (`"2024"`) |
| `materials` | non | Tableau de matériaux (`["chêne", "pierre"]`) |
| `technique` | non | Technique employée (`"taille directe"`) |
| `dimensions` | non | Format texte libre (`"20 × 30 × 15 cm"`) |
| `edition` | non | `"pièce unique"`, `"3/5"`… |
| `location` | non | Lieu actuel / collection |
| `exhibition` | non | Exposition dans laquelle la pièce a été montrée |
| `status` | non | `"disponible"`, `"vendu"`, `"non disponible"` |
| `credit` | non | Crédit photo |
| `description` | non | Notes complémentaires (courtes) |
| `text` | non | **Texte long** (essai, contextualisation). S'affiche à côté de l'image dans la lightbox. Pour faire un retour à la ligne entre paragraphes, mettre une ligne vide. |
| `id` | non | Identifiant unique (utile plus tard pour des liens directs) |

### Champs disponibles pour une série

| Champ | Obligatoire ? | Description |
|---|---|---|
| `id` | **oui** | Identifiant en kebab-case (`"caprice"`, `"outil-d-or"`) |
| `title` | **oui** | Titre affiché |
| `works` | **oui** | Tableau des œuvres de la série |
| `period` | non | Période (`"2024"` ou `"2022-2024"`) |
| `description` | non | Présentation de la série |
| `materials` | non | Matériaux principaux |
| `cover` | non | Image de couverture (sinon = première œuvre) |

### La légende sous chaque image

Pas besoin d'écrire de légende à la main : le site la compose
automatiquement à partir de `title`, `year`, `materials` et
`dimensions`, dans cet ordre. Exemple :

```
Caprice n°1, 2024, chêne et roche, 20 × 25 × 20 cm
```

### Ajouter une exposition / résidence / programme

Ouvrir `data/exhibitions.json` et ajouter un objet dans le tableau `items` :

```json
{
  "year": "2025",
  "type": "Exposition",
  "title": "Titre",
  "location": "Nom du lieu",
  "city": "Ville",
  "description": "Précisions (optionnel)",
  "url": "https://lien-externe-optionnel.fr"
}
```

Le champ `type` peut être ce que tu veux : `Exposition`, `Résidence`,
`Festival`, `Programme`, `Lauréat`, etc. Il s'affiche en chapeau.
Les items sont regroupés automatiquement par année.

### Ajouter un texte critique

Ouvrir `data/texts.json` et ajouter un objet dans le tableau `texts` :

```json
{
  "id": "slug-unique-du-texte",
  "title": "Titre du texte",
  "author": "Nom de l'auteur",
  "author_role": "critique d'art",
  "year": "2025",
  "source": "Catalogue d'exposition Nexus",
  "excerpt": "Une phrase qui donne envie de lire la suite, affichée dans la liste.",
  "text": "Le texte complet ici.\n\nLes paragraphes sont séparés par une ligne vide."
}
```

### Modifier les coordonnées de contact

Éditer `partials/footer.html` (Instagram, email, téléphone, adresse).
La modification s'applique automatiquement à toutes les pages.

### Modifier le diaporama de la page d'accueil

Le diaporama est configuré directement dans `index.html`, dans
l'attribut `data-images` du `<div id="hero-slideshow">`. Format :
un tableau JSON d'objets `{src, alt}`.

Pour **ajouter ou retirer une image** : éditer simplement le tableau.
Exemple pour ajouter une nouvelle image :

```html
data-images='[
  {"src": "./images/home/brijunis.jpg", "alt": "Description courte"},
  {"src": "./images/works/caprice/cailloux-1.jpg", "alt": "Autre description"},
  {"src": "./images/home/nouvelle-image.jpg", "alt": "Ma nouvelle image"}
]'
```

⚠️ Dans les `alt`, utiliser **l'apostrophe typographique `’`** (et non
l'apostrophe droite `'`) pour ne pas casser l'attribut HTML.

Pour **changer la durée d'affichage** de chaque image, éditer
`js/hero-slideshow.js`, ligne `const INTERVAL_MS = 4000;` (en
millisecondes — 4000 = 4 secondes).

## À propos des `alt` (description d'image)

Le champ `alt` est **essentiel pour l'accessibilité** : il décrit
l'image pour les personnes qui utilisent un lecteur d'écran (cécité,
malvoyance), et s'affiche aussi quand l'image ne charge pas.

**Bonnes pratiques :**
- Décrire ce qu'on voit, factuellement (« Sculpture en bois posée sur
  un socle en béton »)
- **Ne pas** commencer par « image de » ou « photo de »
  (le lecteur d'écran le dit déjà)
- Rester concis (1 phrase)
- Si l'image est purement décorative (un fond, une icône à côté d'un
  texte), mettre `alt=""` — le lecteur d'écran la sautera

## Conseils sur les images

- **Format** : JPG pour les photos d'œuvres, PNG si transparence
- **Pas de HEIC ni de NEF** : ces formats Apple/RAW ne sont pas
  supportés par les navigateurs. Les convertir en JPG d'abord.
- **Poids** : viser moins de 500 Ko par image pour des temps de
  chargement raisonnables. Outils gratuits :
  [Squoosh](https://squoosh.app) ou [TinyJPG](https://tinyjpg.com)
- **Nom de fichier** : minuscules, tirets au lieu d'espaces
  (`mon-oeuvre.jpg`, pas `Mon Oeuvre.JPG`)

## Déploiement (plus tard)

Le site est conçu pour fonctionner tel quel sur GitHub Pages :
tous les chemins sont relatifs, aucune dépendance externe à part
les polices Google Fonts. Il suffira de pousser le dossier
`lucillien-tavernier/` dans un repo et d'activer GitHub Pages.
