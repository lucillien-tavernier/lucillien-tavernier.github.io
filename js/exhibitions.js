/* ============================================================
   EXPOSITIONS & RÉSIDENCES
   ============================================================
   Affiche la liste des expositions, résidences et programmes
   depuis data/exhibitions.json, regroupés par année.

   Layout :
   - 1 encart par année (du plus récent au plus ancien)
   - À l'intérieur, chaque entrée affiche son type en chapeau, son
     titre en gros à gauche, et les infos (lieu, ville, description)
     sur la même ligne à droite en desktop, empilées en mobile.
   ============================================================ */


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
 * Regroupe les items par année et retourne un tableau d'années
 * triées du plus récent au plus ancien, avec leurs items.
 * @param {object[]} items
 * @returns {{year: string, items: object[]}[]}
 */
function groupByYear(items) {
  const byYear = new Map();
  for (const item of items) {
    const year = String(item.year || 'Sans date');
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(item);
  }
  // Tri descendant des années (les chaînes "2025" > "2024" fonctionnent)
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0], 'fr', { numeric: true }))
    .map(([year, list]) => ({ year, items: list }));
}


/**
 * Génère le HTML d'une entrée (expo, résidence, programme, etc.).
 * Layout type "CV" : titre + type sur la même ligne (type en gris,
 * séparé par un tiret cadratin), lieu en gris en dessous.
 */
function renderItem(item) {
  const type = item.type ? escapeHtml(item.type) : '';
  const title = escapeHtml(item.title || '');
  const infoBits = [];
  if (item.location) infoBits.push(escapeHtml(item.location));
  if (item.city) infoBits.push(escapeHtml(item.city));
  const info = infoBits.join(' — ');
  const description = item.description
    ? `<p class="exh-item__description">${escapeHtml(item.description)}</p>`
    : '';
  const link = item.url
    ? ` <a class="exh-item__url" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="En savoir plus sur ${title} (nouvel onglet)">↗</a>`
    : '';
  // Le type vient en suffixe du titre, séparé par un tiret cadratin
  const typeSuffix = type
    ? ` <span class="exh-item__type">— ${type}</span>`
    : '';

  return `
    <article class="exh-item">
      <h3 class="exh-item__title">${title}${typeSuffix}${link}</h3>
      ${info ? `<p class="exh-item__location">${info}</p>` : ''}
      ${description}
    </article>
  `;
}


/**
 * Génère un groupe d'année. Pas d'encart cadré : une fine ligne dorée
 * en haut sert de séparateur entre les années (style CV minimaliste).
 * L'année est rendue en gros chiffre doré à gauche, les items à droite.
 */
function renderYearGroup(group) {
  const items = group.items.map(renderItem).join('');
  return `
    <section class="exh-year">
      <div class="exh-year__year">${escapeHtml(group.year)}</div>
      <div class="exh-year__items">
        ${items}
      </div>
    </section>
  `;
}


async function init() {
  const container = document.getElementById('exhibitions');
  if (!container) return;

  try {
    const response = await fetch('./data/exhibitions.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const list = data.items || data.exhibitions || []; // compat ancien format

    if (list.length === 0) {
      container.innerHTML = `
        <p class="exhibitions__empty">
          Le calendrier des expositions est en cours de mise à jour.<br>
          Pour toute demande, n'hésite pas à utiliser les coordonnées en bas de page.
        </p>
      `;
      return;
    }

    const groups = groupByYear(list);
    container.innerHTML = groups.map(renderYearGroup).join('');
  } catch (err) {
    console.error('Erreur de chargement des expositions :', err);
    container.innerHTML = `
      <p class="exhibitions__empty" style="color:#ff6b6b">
        Erreur lors du chargement des expositions.
      </p>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
