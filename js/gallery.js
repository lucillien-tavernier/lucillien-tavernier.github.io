/* ============================================================
   GALLERY
   ============================================================
   Génère la galerie des œuvres sur la page Travaux à partir
   du fichier data/works.json.

   Deux modes d'affichage :
   - Vue "séries" (par défaut) : une grille de vignettes, une par série
   - Vue "détail" : toutes les œuvres d'une série, accessible via
     l'URL ?serie=<id> (ex: travaux.html?serie=caprice)

   Une fois la galerie générée, on appelle la lightbox pour câbler
   les clics sur les images.
   ============================================================ */


/**
 * Récupère les données du fichier works.json.
 * @returns {Promise<object>} L'objet parsé depuis le JSON
 */
async function loadWorks() {
  const response = await fetch('./data/works.json');
  if (!response.ok) {
    throw new Error(`Impossible de charger works.json (HTTP ${response.status})`);
  }
  return response.json();
}


/**
 * Extrait une année (entier) à partir d'une chaîne libre.
 * Exemples :
 *   "2024"        → 2024
 *   "2022-2024"   → 2024 (on prend l'année la plus tardive du range)
 *   "en cours"    → Infinity (les pièces en cours sont mises en premier)
 *   undefined     → -Infinity (au pire, en dernier)
 * @param {string|undefined} str
 * @returns {number}
 */
function parseYear(str) {
  if (!str || typeof str !== 'string') return -Infinity;
  if (/en cours/i.test(str)) return Infinity;
  const matches = str.match(/\d{4}/g);
  if (!matches) return -Infinity;
  return Math.max(...matches.map(Number));
}


/**
 * Détermine l'année de référence d'une série pour le tri.
 * Priorité : champ "period" de la série, sinon max des "year" de ses œuvres.
 */
function getSeriesYear(series) {
  const fromPeriod = parseYear(series.period);
  if (fromPeriod !== -Infinity) return fromPeriod;
  if (Array.isArray(series.works) && series.works.length > 0) {
    return Math.max(...series.works.map(w => parseYear(w.year)));
  }
  return -Infinity;
}


/**
 * Trie une liste par année décroissante (du plus récent au plus ancien).
 * @param {Array} items
 * @param {(item: object) => number} getYear
 * @returns {Array} une copie triée (le tableau d'origine n'est pas muté)
 */
function sortByYearDesc(items, getYear) {
  return [...items].sort((a, b) => getYear(b) - getYear(a));
}


/**
 * Trouve l'image de couverture d'une série.
 * Règle : si "cover" est défini dans le JSON, on l'utilise ;
 * sinon on prend automatiquement la première œuvre de la série.
 * @param {object} series
 * @returns {string} chemin de l'image
 */
function getCoverImage(series) {
  if (series.cover) return series.cover;
  if (series.works && series.works.length > 0) return series.works[0].src;
  return ''; // pas d'image dispo (cas très rare)
}


/**
 * Compose automatiquement la légende d'une œuvre à partir de ses
 * métadonnées (titre, année, matériaux, dimensions).
 * Exemple : "Caprice n°1, 2023, chêne et silex, 32 × 18 × 14 cm"
 * @param {object} work
 * @returns {string}
 */
function composeCaption(work) {
  const parts = [];
  if (work.title) parts.push(work.title);
  if (work.year) parts.push(work.year);
  if (work.materials && work.materials.length > 0) {
    parts.push(work.materials.join(', '));
  }
  if (work.dimensions) parts.push(work.dimensions);
  return parts.join(', ');
}


/**
 * Petite utilité : échappe les caractères HTML dangereux dans une chaîne
 * avant de l'injecter dans du HTML (sécurité de base).
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/**
 * VUE SÉRIES — génère le HTML d'une grille de vignettes (une par série).
 * Chaque vignette est cliquable et mène à la vue détail de la série.
 * @param {object[]} seriesList
 * @returns {string} HTML
 */
function renderSeriesGrid(seriesList) {
  const cards = seriesList.map(series => {
    const cover = escapeHtml(getCoverImage(series));
    const title = escapeHtml(series.title);
    const period = series.period ? escapeHtml(series.period) : '';
    const description = series.description ? escapeHtml(series.description) : '';
    const id = encodeURIComponent(series.id);

    return `
      <article class="series-card">
        <img class="series-card__image"
             src="${cover}"
             alt="Aperçu de la série ${title}"
             loading="lazy">
        <div class="series-card__body">
          <h2 class="series-card__title">
            <a class="series-card__link" href="?serie=${id}">${title}</a>
          </h2>
          ${period ? `<p class="series-card__meta">${period}</p>` : ''}
          ${description ? `<p class="series-card__description">${description}</p>` : ''}
        </div>
      </article>
    `;
  }).join('');

  return `
    <h1 class="section__title">Travaux</h1>
    <div class="series-grid">
      ${cards}
    </div>
  `;
}


/**
 * VUE DÉTAIL — génère le HTML pour toutes les œuvres d'une série.
 * @param {object} series
 * @returns {string} HTML
 */
function renderSeriesDetail(series) {
  const works = series.works.map((work, index) => {
    const src = escapeHtml(work.src);
    const alt = escapeHtml(work.alt);
    const title = work.title ? escapeHtml(work.title) : '';
    const caption = escapeHtml(composeCaption(work));

    return `
      <figure class="work">
        <button class="work__image-wrapper"
                type="button"
                data-lightbox-index="${index}"
                aria-label="Agrandir : ${alt}">
          <img class="work__image"
               src="${src}"
               alt="${alt}"
               loading="lazy">
        </button>
        <figcaption class="work__caption">
          ${title ? `<span class="work__title">${title}</span>` : ''}
          <span>${caption}</span>
        </figcaption>
      </figure>
    `;
  }).join('');

  const period = series.period ? escapeHtml(series.period) : '';
  const description = series.description ? escapeHtml(series.description) : '';

  return `
    <div class="series-detail__header">
      <h1>${escapeHtml(series.title)}</h1>
      ${period ? `<p class="series-detail__period">${period}</p>` : ''}
      ${description ? `<p class="series-detail__description">${description}</p>` : ''}
    </div>
    <div class="works-grid">
      ${works}
    </div>
    <!-- Bouton retour flottant : reste accessible en bas de l'écran
         pendant toute la navigation dans la série, peu importe où l'on
         a scrollé. Le label texte est caché en mobile (flèche seule). -->
    <a class="series-detail__back series-detail__back--floating"
       href="travaux.html"
       aria-label="Retour aux séries">
      <span class="series-detail__back-text">Retour aux séries</span>
    </a>
  `;
}


/**
 * Point d'entrée : décide quelle vue afficher en fonction de l'URL.
 * - ?serie=<id> → vue détail
 * - sinon       → vue séries
 */
async function init() {
  const container = document.getElementById('gallery');
  if (!container) return; // on n'est pas sur la page Travaux

  try {
    const data = await loadWorks();
    const params = new URLSearchParams(window.location.search);
    const seriesId = params.get('serie');

    if (seriesId) {
      // Vue détail d'une série
      const series = data.series.find(s => s.id === seriesId);
      if (!series) {
        container.innerHTML = `
          <p style="text-align:center; color:#a09e98">
            Série introuvable.
            <a href="travaux.html">Retour aux séries</a>
          </p>
        `;
        return;
      }
      // Tri des œuvres de la série par année décroissante. On crée un
      // objet série dérivé (sans muter l'original) avec les œuvres triées
      // — important pour que l'index passé à la lightbox corresponde
      // exactement à l'ordre rendu dans le DOM.
      const sortedWorks = sortByYearDesc(series.works || [], w => parseYear(w.year));
      const sortedSeries = { ...series, works: sortedWorks };
      container.innerHTML = renderSeriesDetail(sortedSeries);
      // On met à jour le titre de l'onglet du navigateur
      document.title = `${series.title} — Lucillien Tavernier`;
      // On déclenche la lightbox (initialisée par lightbox.js) avec
      // les œuvres dans le même ordre que le DOM.
      if (window.initLightbox) {
        window.initLightbox(sortedWorks);
      }
    } else {
      // Vue séries — triées par année décroissante (la plus récente d'abord)
      const sortedSeries = sortByYearDesc(data.series, getSeriesYear);
      container.innerHTML = renderSeriesGrid(sortedSeries);
    }
  } catch (err) {
    console.error('Erreur de chargement de la galerie :', err);
    container.innerHTML = `
      <p style="text-align:center; color:#ff6b6b">
        Erreur lors du chargement des œuvres. Vérifie que tu utilises
        bien un serveur local (voir README).
      </p>
    `;
  }
}

// On attend que la nav et le footer soient chargés (et que le DOM soit prêt)
// avant de générer la galerie.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
