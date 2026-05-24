/* ============================================================
   TEXTES
   ============================================================
   Affiche la liste des textes critiques depuis data/texts.json.

   Deux vues, comme pour la galerie :
   - Vue liste (par défaut) : aperçu de chaque texte avec auteur,
     date et extrait
   - Vue détail : ?texte=<id> affiche le texte complet

   Si le tableau est vide, on affiche un message "Bientôt".
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
 * Formate un nom d'auteur + son rôle entre parenthèses si fourni.
 */
function formatAuthor(item) {
  const author = escapeHtml(item.author || '');
  const role = item.author_role
    ? ` <span class="text-card__role">(${escapeHtml(item.author_role)})</span>`
    : '';
  return author + role;
}


/**
 * Génère la carte d'aperçu d'un texte dans la vue liste.
 */
function renderTextCard(item) {
  const id = encodeURIComponent(item.id || '');
  const title = escapeHtml(item.title || 'Sans titre');
  const author = formatAuthor(item);
  const year = item.year ? escapeHtml(String(item.year)) : '';
  const source = item.source ? escapeHtml(item.source) : '';
  const excerpt = item.excerpt
    ? `<p class="text-card__excerpt">« ${escapeHtml(item.excerpt)} »</p>`
    : '';

  return `
    <article class="text-card">
      <h2 class="text-card__title">
        <a class="text-card__link" href="?texte=${id}">${title}</a>
      </h2>
      <p class="text-card__meta">
        <span class="text-card__author">${author}</span>
        ${year ? `<span class="text-card__year"> · ${year}</span>` : ''}
        ${source ? `<span class="text-card__source"> · ${source}</span>` : ''}
      </p>
      ${excerpt}
      <a class="text-card__readmore" href="?texte=${id}">Lire le texte →</a>
    </article>
  `;
}


/**
 * Vue détail : affiche le texte complet.
 * Le contenu de "text" est en texte brut ; on découpe par double saut
 * de ligne pour en faire des paragraphes.
 */
function renderTextDetail(item) {
  const title = escapeHtml(item.title || 'Sans titre');
  const author = formatAuthor(item);
  const year = item.year ? escapeHtml(String(item.year)) : '';
  const source = item.source ? escapeHtml(item.source) : '';
  const paragraphs = (item.text || '')
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0)
    .map(p => `<p>${escapeHtml(p.trim())}</p>`)
    .join('');

  return `
    <article class="text-detail">
      <a class="text-detail__back" href="textes.html">← Tous les textes</a>
      <h1>${title}</h1>
      <p class="text-detail__meta">
        <span>${author}</span>
        ${year ? `<span> · ${year}</span>` : ''}
        ${source ? `<span> · ${source}</span>` : ''}
      </p>
      <div class="text-detail__body">
        ${paragraphs || '<p><em>Texte à venir.</em></p>'}
      </div>
    </article>
  `;
}


async function init() {
  const container = document.getElementById('texts');
  if (!container) return;

  try {
    const response = await fetch('./data/texts.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const list = data.texts || [];

    const params = new URLSearchParams(window.location.search);
    const textId = params.get('texte');

    if (textId) {
      // Vue détail
      const item = list.find(t => t.id === textId);
      if (!item) {
        container.innerHTML = `
          <p class="exhibitions__empty">
            Texte introuvable. <a href="textes.html">Retour à la liste</a>
          </p>
        `;
        return;
      }
      container.innerHTML = renderTextDetail(item);
      document.title = `${item.title} — Lucillien Tavernier`;
      return;
    }

    // Vue liste
    if (list.length === 0) {
      container.innerHTML = `
        <p class="exhibitions__empty">
          Les premiers textes seront prochainement publiés ici.
        </p>
      `;
      return;
    }

    // Tri par année décroissante (la plus récente d'abord).
    // Un texte sans année est placé à la fin.
    const sorted = [...list].sort((a, b) => {
      const ya = parseInt(a.year, 10) || -Infinity;
      const yb = parseInt(b.year, 10) || -Infinity;
      return yb - ya;
    });

    container.innerHTML = `
      <div class="text-list">
        ${sorted.map(renderTextCard).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Erreur de chargement des textes :', err);
    container.innerHTML = `
      <p class="exhibitions__empty" style="color:#ff6b6b">
        Erreur lors du chargement des textes.
      </p>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
