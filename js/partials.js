/* ============================================================
   PARTIALS LOADER
   ============================================================
   Ce script charge la navigation (partials/nav.html) et le footer
   (partials/footer.html) dans chaque page du site, afin d'éviter
   de dupliquer leur HTML dans tous les fichiers de page.

   Fonctionnement :
   1. Au chargement de la page, on cherche les balises
      <div data-include="nav"></div> et <div data-include="footer"></div>
   2. On télécharge le HTML du partial correspondant
   3. On remplace la balise par son contenu
   4. On configure ensuite la nav (lien actif, bouton hamburger)
      et le footer (année courante)

   ⚠️ Important : ce script utilise fetch(), qui ne fonctionne PAS
   quand on ouvre la page directement avec le navigateur (file://).
   Il faut lancer un petit serveur local — voir le README.
   ============================================================ */


/**
 * Charge un partial HTML et remplace la balise hôte par son contenu.
 * @param {HTMLElement} hostElement - L'élément qui sera remplacé
 * @param {string} partialName - Nom du partial (ex: "nav", "footer")
 * @returns {Promise<void>}
 */
async function loadPartial(hostElement, partialName) {
  try {
    const response = await fetch(`./partials/${partialName}.html`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    // On utilise insertAdjacentHTML pour ajouter le HTML, puis on retire
    // la balise hôte (qui ne sert qu'à marquer l'emplacement).
    hostElement.insertAdjacentHTML('beforebegin', html);
    hostElement.remove();
  } catch (err) {
    console.error(`Impossible de charger le partial "${partialName}" :`, err);
    hostElement.innerHTML = `<p style="color:#ff6b6b">
      Erreur de chargement du partial "${partialName}". Vérifie que tu utilises
      bien un serveur local (voir README).
    </p>`;
  }
}


/**
 * Marque le lien de navigation correspondant à la page courante avec
 * aria-current="page" (utilisé par le CSS pour le souligner en doré).
 * On récupère l'identifiant de la page depuis data-page-id sur <body>.
 */
function markActiveNavLink() {
  const currentPageId = document.body.dataset.pageId;
  if (!currentPageId) return;

  // Comparaison case-insensitive : l'attribut data-page-id et les
  // data-nav-id peuvent être écrits indifféremment "accueil" ou "Accueil",
  // ça reste cohérent.
  const target = currentPageId.toLowerCase();
  document.querySelectorAll('.nav__menu a[data-nav-id]').forEach(link => {
    if (link.dataset.navId.toLowerCase() === target) {
      link.setAttribute('aria-current', 'page');
    }
  });
}


/**
 * Configure le bouton hamburger pour ouvrir/fermer le menu sur mobile.
 * Gère aussi la fermeture du menu quand on clique sur un lien (utile sur mobile)
 * et la mise à jour de l'attribut aria-expanded pour l'accessibilité.
 */
function setupNavToggle() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  // Fermer le menu quand on clique sur un lien (UX mobile)
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Ouvrir le menu');
    });
  });
}


/**
 * Met à jour l'année dans le copyright du footer pour qu'elle soit
 * toujours à jour automatiquement.
 */
function updateFooterYear() {
  const yearSpan = document.getElementById('footer-year');
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }
}


/**
 * Point d'entrée : charge les partials puis configure les comportements.
 * Émet un événement "partials:loaded" une fois tout en place — utile
 * pour les autres scripts qui veulent attendre la nav/footer.
 */
async function init() {
  const navHost = document.querySelector('[data-include="nav"]');
  const footerHost = document.querySelector('[data-include="footer"]');

  const tasks = [];
  if (navHost) tasks.push(loadPartial(navHost, 'nav'));
  if (footerHost) tasks.push(loadPartial(footerHost, 'footer'));

  // On attend que les deux partials soient chargés en parallèle
  await Promise.all(tasks);

  // Une fois insérés dans le DOM, on configure les comportements
  markActiveNavLink();
  setupNavToggle();
  updateFooterYear();

  // On révèle la page (fondu via CSS, cf. body { opacity: 0 → 1 }).
  // Fait avec requestAnimationFrame pour s'assurer que le DOM est peint
  // avant que la transition d'opacité commence — sinon Safari fait
  // parfois sauter le fade.
  requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
  });

  // Signal pour les autres scripts (ex: gallery.js peut vouloir savoir
  // que la page est prête avant de manipuler le DOM)
  document.dispatchEvent(new CustomEvent('partials:loaded'));
}

// On lance dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
