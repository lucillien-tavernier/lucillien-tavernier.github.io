/* ============================================================
   HERO SLIDESHOW
   ============================================================
   Petit diaporama en fondu enchaîné pour la hero de la page
   d'accueil. Toutes les images sont posées en absolu les unes
   au-dessus des autres, et on bascule la classe .is-active de
   l'une à l'autre à intervalle régulier — le CSS s'occupe du
   fondu.

   Les images affichées sont lues depuis l'attribut data-images
   du conteneur (chaîne JSON), ce qui permet à Lucillien de
   changer les images directement dans index.html sans toucher
   au JS.
   ============================================================ */


/**
 * Durée d'affichage de chaque image, en millisecondes.
 * Modifiable au besoin (1000 = 1 s). La durée du fondu lui-même est
 * définie dans le CSS (.hero__slide { transition: opacity ... }).
 */
const INTERVAL_MS = 4000;


/**
 * Génère les <div> d'images dans le slideshow et démarre la rotation.
 */
function init() {
  const slideshow = document.getElementById('hero-slideshow');
  if (!slideshow) return;

  // On lit la liste d'images depuis l'attribut data-images.
  // Format attendu : un tableau JSON d'objets {src, alt}.
  let images;
  try {
    images = JSON.parse(slideshow.dataset.images || '[]');
  } catch (err) {
    console.error('hero-slideshow : data-images invalide.', err);
    return;
  }
  if (!Array.isArray(images) || images.length === 0) return;

  // Crée un <div> par image (background-image plutôt que <img> pour
  // gérer le cover sans CSS supplémentaire et éviter les soucis d'alt
  // sur des images purement décoratives — l'accessibilité est portée
  // par le titre de la hero, pas par les images).
  images.forEach((img, index) => {
    const slide = document.createElement('div');
    slide.className = 'hero__slide';
    slide.style.backgroundImage = `url("${img.src}")`;
    if (index === 0) slide.classList.add('is-active');
    // role="img" + aria-label pour les lecteurs d'écran (ils ne voient
    // pas les background-image sinon)
    if (img.alt) {
      slide.setAttribute('role', 'img');
      slide.setAttribute('aria-label', img.alt);
    } else {
      slide.setAttribute('aria-hidden', 'true');
    }
    slideshow.appendChild(slide);
  });

  // Une seule image → pas besoin de rotation
  if (images.length === 1) return;

  // Respecte la préférence "réduire les animations"
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let current = 0;
  setInterval(() => {
    const slides = slideshow.querySelectorAll('.hero__slide');
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, INTERVAL_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
