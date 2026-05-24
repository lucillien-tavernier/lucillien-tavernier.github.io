/* ============================================================
   LIGHTBOX
   ============================================================
   Modale plein écran pour afficher une œuvre en grand.

   Caractéristiques :
   - Utilise <dialog> natif HTML5 → gère automatiquement le focus
     trap et l'inertie du reste de la page
   - Navigation clavier : Escape pour fermer, ← → pour naviguer
   - Navigation tactile : on peut aussi cliquer sur les boutons
   - Zoom : molette ou pinch tactile, double-clic/double-tap pour
     toggle 1× ↔ 2,5×, drag pour déplacer quand zoomé
   - Initialisée par gallery.js avec la liste des œuvres de la série
     courante via window.initLightbox(works).
   ============================================================ */


// État interne de la lightbox
let lightboxState = {
  works: [],          // liste des œuvres affichées dans la série courante
  currentIndex: 0,    // index de l'œuvre en cours d'affichage
  dialog: null,       // référence au <dialog>
  innerEl: null,      // wrapper (sert pour la classe .has-text)
  imgEl: null,        // référence à l'image
  captionEl: null,    // référence à la légende
  textEl: null,       // référence au bloc texte long
};

// État du zoom de l'image courante. On stocke l'échelle et la
// translation actuelles ; le CSS applique simplement le transform.
const zoom = {
  scale: 1,
  x: 0,
  y: 0,
  // Drag souris
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  // Pinch tactile
  pinchStartDist: 0,
  pinchStartScale: 1,
};
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_DOUBLE_TAP = 2.5;


/**
 * Compose la légende complète à afficher sous l'image en lightbox.
 * Ressemble à composeCaption de gallery.js mais retourne du HTML
 * (avec <strong> pour le titre).
 * @param {object} work
 * @returns {string} HTML de la légende
 */
function composeFullCaption(work) {
  const parts = [];
  if (work.year) parts.push(work.year);
  if (work.materials && work.materials.length > 0) {
    parts.push(work.materials.join(', '));
  }
  if (work.technique) parts.push(work.technique);
  if (work.dimensions) parts.push(work.dimensions);
  if (work.edition) parts.push(work.edition);

  const titlePart = work.title
    ? `<strong>${escapeHtml(work.title)}</strong>`
    : '';
  const metaPart = parts.length > 0
    ? `<span>${escapeHtml(parts.join(' · '))}</span>`
    : '';
  const description = work.description
    ? `<br><span>${escapeHtml(work.description)}</span>`
    : '';

  return titlePart + metaPart + description;
}


/**
 * Échappement HTML — dupliqué depuis gallery.js pour rester indépendant.
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
 * Applique l'état du zoom au DOM (transform CSS + classes pour le curseur).
 */
function applyZoom() {
  const img = lightboxState.imgEl;
  if (!img) return;
  img.style.transform =
    `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
  img.classList.toggle('is-zoomed', zoom.scale > 1.001);
  img.classList.toggle('is-panning', zoom.isPanning);
}

/**
 * Réinitialise le zoom (échelle 1, pas de translation).
 * Appelé à chaque changement d'image et à la fermeture.
 */
function resetZoom() {
  zoom.scale = 1;
  zoom.x = 0;
  zoom.y = 0;
  zoom.isPanning = false;
  applyZoom();
}

/**
 * Calcule la distance entre deux doigts (pour le pinch).
 */
function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

/**
 * Change l'échelle de zoom en gardant le point sous le curseur/doigt fixe.
 *   - centerX, centerY : position absolue (viewport) du point à garder fixe
 *   - newScale         : nouvelle échelle souhaitée
 * Formule : pour qu'un point reste sous le curseur après zoom, il faut
 * compenser la translation par dx * (1 - ratio), où dx est la distance
 * entre le curseur et le centre visuel de l'image.
 */
function zoomTo(centerX, centerY, newScale) {
  const img = lightboxState.imgEl;
  if (!img) return;
  newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));
  if (newScale === zoom.scale) return;

  const rect = img.getBoundingClientRect();
  const visualCenterX = rect.left + rect.width / 2;
  const visualCenterY = rect.top + rect.height / 2;
  const dx = centerX - visualCenterX;
  const dy = centerY - visualCenterY;
  const ratio = newScale / zoom.scale;

  zoom.x = zoom.x + dx * (1 - ratio);
  zoom.y = zoom.y + dy * (1 - ratio);
  zoom.scale = newScale;

  // Au retour à l'échelle 1, on recentre proprement
  if (zoom.scale <= 1.001) {
    zoom.scale = 1;
    zoom.x = 0;
    zoom.y = 0;
  }
  applyZoom();
}

/**
 * Câble tous les gestes de zoom (souris + tactile) sur l'image.
 * Appelé une fois lors de la création de la lightbox.
 */
function setupZoomHandlers() {
  const img = lightboxState.imgEl;
  if (!img) return;

  // --- Molette (desktop) : zoom continu centré sur le curseur ---
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    // deltaY est négatif quand on scroll vers le haut (zoom in)
    const factor = 1 + (-e.deltaY * 0.0015);
    zoomTo(e.clientX, e.clientY, zoom.scale * factor);
  }, { passive: false });

  // --- Double-clic / double-tap : toggle 1× ↔ 2,5× au point cliqué ---
  img.addEventListener('dblclick', (e) => {
    if (zoom.scale > 1) {
      resetZoom();
    } else {
      zoomTo(e.clientX, e.clientY, ZOOM_DOUBLE_TAP);
    }
  });

  // --- Drag souris : déplacer l'image quand elle est zoomée ---
  img.addEventListener('mousedown', (e) => {
    if (zoom.scale <= 1) return;
    e.preventDefault();
    zoom.isPanning = true;
    zoom.panStartX = e.clientX - zoom.x;
    zoom.panStartY = e.clientY - zoom.y;
    applyZoom();
  });
  document.addEventListener('mousemove', (e) => {
    if (!zoom.isPanning) return;
    zoom.x = e.clientX - zoom.panStartX;
    zoom.y = e.clientY - zoom.panStartY;
    applyZoom();
  });
  document.addEventListener('mouseup', () => {
    if (zoom.isPanning) {
      zoom.isPanning = false;
      applyZoom();
    }
  });

  // --- Tactile : pinch à 2 doigts pour zoomer, drag à 1 doigt pour pan ---
  img.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      zoom.pinchStartDist = touchDistance(e.touches);
      zoom.pinchStartScale = zoom.scale;
    } else if (e.touches.length === 1 && zoom.scale > 1) {
      // Note : on ne preventDefault pas pour ne pas bloquer un double-tap
      zoom.isPanning = true;
      zoom.panStartX = e.touches[0].clientX - zoom.x;
      zoom.panStartY = e.touches[0].clientY - zoom.y;
    }
  }, { passive: false });

  img.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = touchDistance(e.touches);
      // On zoome vers le point milieu des 2 doigts
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const ratio = dist / zoom.pinchStartDist;
      zoomTo(mx, my, zoom.pinchStartScale * ratio);
    } else if (e.touches.length === 1 && zoom.isPanning) {
      e.preventDefault();
      zoom.x = e.touches[0].clientX - zoom.panStartX;
      zoom.y = e.touches[0].clientY - zoom.panStartY;
      applyZoom();
    }
  }, { passive: false });

  img.addEventListener('touchend', () => {
    zoom.isPanning = false;
    applyZoom();
  });
}


/**
 * Construit la structure HTML de la lightbox et l'insère dans la page.
 * Appelé une seule fois, au premier initLightbox.
 */
function createLightboxElement() {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Visionneuse d\'image');

  // La structure :
  // - Une croix close en haut à droite (fixe au-dessus de tout)
  // - Un wrapper inner qui contient :
  //   - .lightbox__media (image + flèches prev/next positionnées dessus + légende)
  //   - .lightbox__text (texte long optionnel, .has-text sur l'inner si présent)
  // Mettre les flèches DANS .lightbox__media permet qu'elles flottent
  // sur l'image en mobile et suivent l'image (pas le scroll du dialog).
  dialog.innerHTML = `
    <button class="lightbox__btn lightbox__btn--close"
            type="button"
            aria-label="Fermer la visionneuse">✕</button>

    <div class="lightbox__inner">
      <div class="lightbox__media">
        <button class="lightbox__btn lightbox__btn--prev"
                type="button"
                aria-label="Image précédente">‹</button>
        <img class="lightbox__image" src="" alt="">
        <button class="lightbox__btn lightbox__btn--next"
                type="button"
                aria-label="Image suivante">›</button>
        <p class="lightbox__caption" aria-live="polite"></p>
      </div>
      <div class="lightbox__text" aria-live="polite"></div>
    </div>
  `;
  document.body.appendChild(dialog);

  // On câble les boutons
  dialog.querySelector('.lightbox__btn--close').addEventListener('click', close);
  dialog.querySelector('.lightbox__btn--prev').addEventListener('click', prev);
  dialog.querySelector('.lightbox__btn--next').addEventListener('click', next);

  // Clic en dehors de l'image / du texte / des boutons → ferme la lightbox.
  // On considère qu'un clic "à l'extérieur" est tout clic qui ne touche
  // ni l'image, ni la légende, ni le texte long, ni un bouton. Cela
  // permet de fermer en cliquant sur les zones vides autour de l'image
  // (vrai sur tous les appareils, mobile inclus).
  dialog.addEventListener('click', (event) => {
    const safe = event.target.closest(
      '.lightbox__image, .lightbox__caption, .lightbox__text, .lightbox__btn'
    );
    if (!safe) {
      close();
    }
  });

  // Navigation clavier (flèches). Escape est géré nativement par <dialog>.
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  });

  lightboxState.dialog = dialog;
  lightboxState.innerEl = dialog.querySelector('.lightbox__inner');
  lightboxState.imgEl = dialog.querySelector('.lightbox__image');
  lightboxState.captionEl = dialog.querySelector('.lightbox__caption');
  lightboxState.textEl = dialog.querySelector('.lightbox__text');

  // Câblage des gestes de zoom (molette, double-clic, drag, pinch tactile)
  setupZoomHandlers();
}


/**
 * Affiche l'œuvre à l'index donné dans la lightbox.
 * @param {number} index
 */
function show(index) {
  const work = lightboxState.works[index];
  if (!work) return;

  lightboxState.currentIndex = index;
  // On reset le zoom à chaque changement d'image — sinon une image
  // garderait l'échelle de la précédente, ce qui est désorientant.
  resetZoom();
  lightboxState.imgEl.src = work.src;
  lightboxState.imgEl.alt = work.alt;
  lightboxState.captionEl.innerHTML = composeFullCaption(work);

  // Gestion du texte long : si l'œuvre a un champ "text", on l'affiche,
  // sinon on cache le bloc texte. La classe .has-text sur l'inner sert
  // au CSS pour basculer en layout split (image | texte) en desktop.
  if (work.text && work.text.trim().length > 0) {
    // On découpe par double saut de ligne pour faire des paragraphes
    const paragraphs = work.text
      .split(/\n\s*\n/)
      .map(p => `<p>${escapeHtml(p.trim())}</p>`)
      .join('');
    lightboxState.textEl.innerHTML = paragraphs;
    lightboxState.textEl.style.display = '';
    lightboxState.innerEl.classList.add('has-text');
  } else {
    lightboxState.textEl.innerHTML = '';
    lightboxState.textEl.style.display = 'none';
    lightboxState.innerEl.classList.remove('has-text');
  }

  if (!lightboxState.dialog.open) {
    lightboxState.dialog.showModal();
  }
}


/**
 * Ferme la lightbox et nettoie l'image (libère un peu de mémoire,
 * et évite que l'ancienne image flashe brièvement à la prochaine ouverture).
 */
function close() {
  if (lightboxState.dialog && lightboxState.dialog.open) {
    lightboxState.dialog.close();
  }
  resetZoom();
  if (lightboxState.imgEl) {
    lightboxState.imgEl.src = '';
    lightboxState.imgEl.alt = '';
  }
  if (lightboxState.captionEl) {
    lightboxState.captionEl.innerHTML = '';
  }
  if (lightboxState.textEl) {
    lightboxState.textEl.innerHTML = '';
  }
  if (lightboxState.innerEl) {
    lightboxState.innerEl.classList.remove('has-text');
  }
}


/**
 * Passe à l'œuvre précédente (en boucle).
 */
function prev() {
  const n = lightboxState.works.length;
  if (n === 0) return;
  const newIndex = (lightboxState.currentIndex - 1 + n) % n;
  show(newIndex);
}


/**
 * Passe à l'œuvre suivante (en boucle).
 */
function next() {
  const n = lightboxState.works.length;
  if (n === 0) return;
  const newIndex = (lightboxState.currentIndex + 1) % n;
  show(newIndex);
}


/**
 * Câble la lightbox sur les boutons générés par gallery.js.
 * Cherche tous les boutons avec data-lightbox-index et leur attache
 * un handler de clic.
 */
function bindGalleryClicks() {
  document.querySelectorAll('[data-lightbox-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.lightboxIndex, 10);
      if (!isNaN(index)) {
        show(index);
      }
    });
  });
}


/**
 * Point d'entrée public — appelé par gallery.js avec la liste des
 * œuvres de la série courante.
 * @param {object[]} works
 */
window.initLightbox = function initLightbox(works) {
  lightboxState.works = works || [];
  if (!lightboxState.dialog) {
    createLightboxElement();
  }
  bindGalleryClicks();
};
