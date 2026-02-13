// Header and bottom bar scroll behavior
let lastScrollY = 0;
const header = document.querySelector(".site-header");
const bottomBar = document.querySelector(".site-bottom-bar");
const aboutSection = document.querySelector(".about");
const projectsSection = document.querySelector(".projects");
let suppressHeaderHideUntil = 0;

const updateAboutParallax = () => {
  if (!aboutSection) return;

  const rect = aboutSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 0;
  const travel = viewportHeight + rect.height;
  const progress = (viewportHeight - rect.top) / (travel || 1);
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = (clamped - 0.5) * 192;

  aboutSection.style.setProperty("--about-parallax-offset", `${offset}px`);
};

const updateProjectsParallax = () => {
  if (!projectsSection) return;

  const rect = projectsSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 0;
  const travel = viewportHeight + rect.height;
  const progress = (viewportHeight - rect.top) / (travel || 1);
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = (clamped - 0.5) * 192;

  projectsSection.style.setProperty("--projects-parallax-offset", `${offset}px`);
};

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("hide");
    suppressHeaderHideUntil = Date.now() + 800;
  });
});

let parallaxTicking = false;

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - lastScrollY;
  
  // Determine scroll direction (down = positive)
  if (scrollDelta > 0) {
    // Scrolling down
    if (Date.now() >= suppressHeaderHideUntil) {
      header.classList.add("hide");
    }
  } else if (scrollDelta < 0) {
    // Scrolling up
    header.classList.remove("hide");
  }

  if (currentScrollY <= 150) {
    bottomBar.classList.remove("hide");
  } else {
    bottomBar.classList.add("hide");
  }

  if (!parallaxTicking) {
    parallaxTicking = true;
    requestAnimationFrame(() => {
      updateAboutParallax();
      updateProjectsParallax();
      parallaxTicking = false;
    });
  }
  
  lastScrollY = currentScrollY;
});

// Keep hover highlight synced with a stationary cursor
const cards = document.querySelectorAll(".card");
let mouseX = null;
let mouseY = null;
let hoveredCard = null;

// --- Orbit bring-to-front control ---
const orbit = document.querySelector('.cards-orbit');
const CARD_ANGLES = [0, 51.43, 102.86, 154.29, 205.71, 257.14, 308.57];
const ORBIT_DURATION = 30;
let orbitMode = 'animating'; // 'animating' | 'transitioning' | 'paused-at-front'

function getOrbitRotationY() {
  const tr = getComputedStyle(orbit).transform;
  if (!tr || tr === 'none') return 0;
  const match = tr.match(/matrix3d\((.+)\)/);
  if (!match) return 0;
  const m = match[1].split(',').map(v => parseFloat(v.trim()));
  return (((Math.atan2(m[8], m[0]) * 180 / Math.PI) % 360) + 360) % 360;
}

// --- Orbit front/back hover gating ---
// Cards in the back half of the orbit shouldn't be hoverable.
const orbitCards = orbit ? Array.from(orbit.querySelectorAll('.card')) : [];
const BACK_HALF_START_DEG = 90;
const BACK_HALF_END_DEG = 270;

function normalizeAngleDeg(angle) {
  return (((angle % 360) + 360) % 360);
}

function updateOrbitCardInteractivity() {
  if (!orbit || orbitCards.length === 0) return;
  const orbitAngle = getOrbitRotationY();

  orbitCards.forEach((card, idx) => {
    const cardAngle = CARD_ANGLES[idx] || 0;
    const absolute = normalizeAngleDeg(orbitAngle + cardAngle);
    const isBack = absolute > BACK_HALF_START_DEG && absolute < BACK_HALF_END_DEG;
    card.classList.toggle('orbit-back', isBack);
  });

  requestAnimationFrame(updateOrbitCardInteractivity);
}

updateOrbitCardInteractivity();

function getCardIndex(card) {
  return Array.from(orbit.querySelectorAll('.card')).indexOf(card);
}

function onOrbitTransitionEnd() {
  orbit.removeEventListener('transitionend', onOrbitTransitionEnd);
  orbitMode = 'paused-at-front';
  if (hoveredCard) hoveredCard.classList.add('enlarged');
}

function bringCardToFront(card) {
  const idx = getCardIndex(card);
  if (idx === -1) return;

  const currentAngle = getOrbitRotationY();
  const cardAngle = CARD_ANGLES[idx] || 0;
  const targetAngle360 = (360 - cardAngle) % 360;
  let delta = ((targetAngle360 - currentAngle) % 360 + 360) % 360;
  // Take the shortest path — reverse if going the long way around
  if (delta > 180) delta -= 360;
  const absDelta = Math.abs(delta);
  const targetAngle = currentAngle + delta;
  const progress = ((targetAngle % 360) + 360) % 360 / 360;
  const targetRotateX = -2 * Math.cos(4 * Math.PI * progress);

  orbit.removeEventListener('transitionend', onOrbitTransitionEnd);
  orbit.style.transition = 'none';
  orbit.style.transform = `rotateY(${currentAngle}deg) rotateX(0deg)`;
  orbit.classList.add('manual-control');
  void orbit.offsetHeight;

  if (absDelta < 1) {
    orbit.style.transform = `rotateY(${targetAngle}deg) rotateX(${targetRotateX}deg)`;
    orbitMode = 'paused-at-front';
    if (hoveredCard) hoveredCard.classList.add('enlarged');
    return;
  }

  const duration = Math.max(0.864, Math.min(3.456, (absDelta / 360) * 4.32)) * 1.5;
  orbit.style.transition = `transform ${duration}s ease-in-out`;
  orbit.style.transform = `rotateY(${targetAngle}deg) rotateX(${targetRotateX}deg)`;
  orbitMode = 'transitioning';
  orbit.addEventListener('transitionend', onOrbitTransitionEnd);
}

function resumeOrbit() {
  if (hoveredCard) hoveredCard.classList.remove('enlarged');
  orbit.removeEventListener('transitionend', onOrbitTransitionEnd);
  const currentAngle = getOrbitRotationY();
  const normalizedAngle = ((currentAngle % 360) + 360) % 360;
  const timeOffset = (normalizedAngle / 360) * ORBIT_DURATION;
  orbit.style.animationDelay = `-${timeOffset}s`;
  orbit.style.transition = '';
  orbit.style.transform = '';
  orbit.classList.remove('manual-control');
  orbitMode = 'animating';
}

function resumeOrbitFromAngle(angle) {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const timeOffset = (normalizedAngle / 360) * ORBIT_DURATION;
  orbit.style.animationDelay = `-${timeOffset}s`;
  orbit.style.transition = '';
  orbit.style.transform = '';
  orbit.classList.remove('manual-control');
  orbitMode = 'animating';
}

// --- Click-and-drag spin ---
const orbitSun = document.querySelector('.orbit-sun');
let isDragging = false;
let dragStartX = 0;
let dragAngle = 0;
let dragVelocity = 0;
let lastDragX = 0;
let lastDragTime = 0;
let momentumAngle = 0;
let momentumVelocity = 0;
let momentumRafId = null;
const BASE_SPEED = 360 / ORBIT_DURATION; // degrees per second
const FRICTION = 0.97;

orbitSun?.addEventListener('mousedown', (e) => {
  
  // Cancel any ongoing momentum
  if (momentumRafId) {
    cancelAnimationFrame(momentumRafId);
    momentumRafId = null;
  }

  isDragging = true;
  dragStartX = e.clientX;
  lastDragX = e.clientX;
  lastDragTime = performance.now();
  dragVelocity = 0;

  // Capture current angle and switch to manual
  dragAngle = getOrbitRotationY();

  // Clear any hover/transition state
  if (hoveredCard) {
    hoveredCard.classList.remove('is-hovered');
    hoveredCard.classList.remove('enlarged');
    hoveredCard = null;
  }
  orbit.removeEventListener('transitionend', onOrbitTransitionEnd);
  orbit.style.transition = 'none';
  orbit.classList.add('manual-control');
  orbitMode = 'dragging';

  const rotateX = -2 * Math.cos(4 * Math.PI * (((dragAngle % 360) + 360) % 360) / 360);
  orbit.style.transform = `rotateY(${dragAngle}deg) rotateX(${rotateX}deg)`;

  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const now = performance.now();
  const dx = e.clientX - lastDragX;
  const dt = Math.max(1, now - lastDragTime) / 1000;

  // Convert pixel movement to degrees (sensitivity factor)
  const degreesPerPixel = 0.3;
  const angleDelta = dx * degreesPerPixel;

  dragAngle += angleDelta;
  dragVelocity = angleDelta / dt;

  const rotateX = -2 * Math.cos(4 * Math.PI * (((dragAngle % 360) + 360) % 360) / 360);
  orbit.style.transform = `rotateY(${dragAngle}deg) rotateX(${rotateX}deg)`;

  lastDragX = e.clientX;
  lastDragTime = now;
});

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;

  // Clamp velocity to a reasonable range
  momentumVelocity = Math.max(-1800, Math.min(1800, dragVelocity));
  momentumAngle = dragAngle;

  let lastTime = performance.now();

  function momentumStep(now) {
    const dt = Math.max(1, now - lastTime) / 1000;
    lastTime = now;

    momentumAngle += momentumVelocity * dt;
    momentumVelocity *= FRICTION;

    const rotateX = -2 * Math.cos(4 * Math.PI * (((momentumAngle % 360) + 360) % 360) / 360);
    orbit.style.transform = `rotateY(${momentumAngle}deg) rotateX(${rotateX}deg)`;

    // Once momentum dies down close to base speed, resume CSS animation
    if (Math.abs(momentumVelocity) < BASE_SPEED * 1.5) {
      momentumRafId = null;
      resumeOrbitFromAngle(momentumAngle);
      return;
    }

    momentumRafId = requestAnimationFrame(momentumStep);
  }

  momentumRafId = requestAnimationFrame(momentumStep);
}

document.addEventListener('mouseup', onDragEnd);
document.addEventListener('mouseleave', onDragEnd);

document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener("mouseleave", () => {
  mouseX = null;
  mouseY = null;
});

function updateHoverTarget() {
  // Lock hover detection during orbit transition, dragging, or momentum
  if (orbitMode === 'transitioning' || orbitMode === 'dragging' || momentumRafId) {
    requestAnimationFrame(updateHoverTarget);
    return;
  }

  if (mouseX === null || mouseY === null) {
    if (hoveredCard) {
      hoveredCard.classList.remove("is-hovered");
      hoveredCard.classList.remove("enlarged");
      hoveredCard = null;
      if (orbitMode !== 'animating') resumeOrbit();
    }
    requestAnimationFrame(updateHoverTarget);
    return;
  }

  if (hoveredCard) {
    const prevRect = hoveredCard.getBoundingClientRect();
    if (mouseX < prevRect.left || mouseX > prevRect.right || mouseY < prevRect.top || mouseY > prevRect.bottom) {
      hoveredCard.classList.remove("is-hovered");
      hoveredCard.classList.remove("enlarged");
      const wasAnimating = orbitMode === 'animating';
      hoveredCard = null;
      if (!wasAnimating) resumeOrbit();
      if (wasAnimating) { mouseX = null; mouseY = null; }
      requestAnimationFrame(updateHoverTarget);
      return;
    }
  }

  const element = document.elementFromPoint(mouseX, mouseY);
  let card = element ? element.closest(".card") : null;

  if (card && card.classList.contains('orbit-back')) {
    card = null;
  }

  if (card) {
    const rect = card.getBoundingClientRect();
    if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) {
      card = null;
    }
  }

  if (!card) {
    let topCard = null;
    let topZ = -Infinity;
    cards.forEach((candidate) => {
      if (candidate.classList.contains('orbit-back')) return;
      const rect = candidate.getBoundingClientRect();
      if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
        const zIndex = parseFloat(window.getComputedStyle(candidate).zIndex) || 0;
        if (zIndex >= topZ) {
          topZ = zIndex;
          topCard = candidate;
        }
      }
    });
    card = topCard;
  }

  if (card !== hoveredCard) {
    if (hoveredCard) {
      hoveredCard.classList.remove("is-hovered");
      hoveredCard.classList.remove("enlarged");
    }
    if (!card && orbitMode !== 'animating') resumeOrbit();
    hoveredCard = card;
    if (hoveredCard) {
      hoveredCard.classList.add("is-hovered");
      bringCardToFront(hoveredCard);
    }
  }

  requestAnimationFrame(updateHoverTarget);
}

updateHoverTarget();

// Soft fade-in on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".about-text, .section-title").forEach((el) => {
  el.classList.add("fade");
  observer.observe(el);
});

updateAboutParallax();
updateProjectsParallax();
window.addEventListener("resize", () => {
  updateAboutParallax();
  updateProjectsParallax();
});