/* =====================================================
   APEX RACING ACADEMY — PREMIUM E-SIM RACING
   script.js — Production Ready
   ===================================================== */

'use strict';

// ─────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────
const CONFIG = {
  revealThreshold: 0.12,
  revealRootMargin: '0px 0px -60px 0px',
  counterDuration: 2000,
  magneticStrength: 0.4,
  parallaxStrength: 0.035,
  scrollDebounce: 10,
};

// ─────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const mapRange = (value, inMin, inMax, outMin, outMax) =>
  ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;

// ─────────────────────────────────────────────────────
// 1. GLOW CURSOR
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
// 2. NAVBAR SCROLL BEHAVIOR
// ─────────────────────────────────────────────────────
function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateNavbar() {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });

  updateNavbar();
}

// ─────────────────────────────────────────────────────
// 3. MOBILE MENU
// ─────────────────────────────────────────────────────
function initMobileMenu() {
  const toggle = $('#navToggle');
  const menu = $('#mobileMenu');
  const links = $$('.mobile-nav-link');
  if (!toggle || !menu) return;

  function openMenu() {
    toggle.classList.add('active');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-open');
  }

  function closeMenu() {
    toggle.classList.remove('active');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-open');
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
}

// ─────────────────────────────────────────────────────
// 4. SMOOTH SCROLL
// ─────────────────────────────────────────────────────
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || targetId === '#!') return;

      const target = $(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = $('#navbar')?.offsetHeight ?? 80;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    });
  });
}

// ─────────────────────────────────────────────────────
// 5. SCROLL REVEAL (INTERSECTION OBSERVER)
// ─────────────────────────────────────────────────────
function initScrollReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);

      setTimeout(() => {
        el.classList.add('visible');
        observer.unobserve(el);
      }, delay);
    });
  }, {
    threshold: CONFIG.revealThreshold,
    rootMargin: CONFIG.revealRootMargin,
  });

  elements.forEach(el => observer.observe(el));
}

// ─────────────────────────────────────────────────────
// 6. ANIMATED COUNTERS
// ─────────────────────────────────────────────────────
function initCounters() {
  const counters = $$('.stat-counter');
  if (!counters.length) return;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = CONFIG.counterDuration;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased = easeOutCubic(progress);
      const current = Math.round(eased * target);

      el.textContent = current.toLocaleString('es-AR') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString('es-AR') + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.5,
  });

  counters.forEach(counter => observer.observe(counter));
}

// ─────────────────────────────────────────────────────
// 7. MAGNETIC BUTTONS
// ─────────────────────────────────────────────────────
function initMagneticButtons() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const buttons = $$('[data-magnetic]');

  buttons.forEach(btn => {
    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;
    let isHovered = false;
    let rafId = null;

    function animate() {
      currentX = lerp(currentX, targetX, 0.12);
      currentY = lerp(currentY, targetY, 0.12);

      const dist = Math.sqrt(currentX * currentX + currentY * currentY);
      if (!isHovered && dist < 0.1) {
        currentX = 0;
        currentY = 0;
        cancelAnimationFrame(rafId);
        rafId = null;
        btn.style.transform = '';
        return;
      }

      btn.style.transform = `translate(${currentX}px, ${currentY}px)`;
      rafId = requestAnimationFrame(animate);
    }

    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distX = e.clientX - cx;
      const distY = e.clientY - cy;

      targetX = distX * CONFIG.magneticStrength;
      targetY = distY * CONFIG.magneticStrength;

      if (!rafId) {
        isHovered = true;
        rafId = requestAnimationFrame(animate);
      }
    });

    btn.addEventListener('mouseleave', () => {
      isHovered = false;
      targetX = 0;
      targetY = 0;
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    });
  });
}

// ─────────────────────────────────────────────────────
// 8. HERO PARALLAX (mouse movement)
// ─────────────────────────────────────────────────────
function initHeroParallax() {
  if (window.matchMedia('(hover: none)').matches) return;

  const hero = $('#hero');
  const content = $('#heroContent');
  const orbs = $$('.hero-orb');

  if (!hero || !content) return;

  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;
  let rafId = null;

  function animate() {
    curX = lerp(curX, mouseX, 0.06);
    curY = lerp(curY, mouseY, 0.06);

    // Content: subtle counter-movement
    content.style.transform = `translate(${curX * -0.012}px, ${curY * -0.012}px)`;

    // Orbs: stronger movement in different directions
    if (orbs[0]) orbs[0].style.transform = `translateX(calc(-50% + ${curX * 0.03}px)) translateY(${curY * 0.02}px)`;
    if (orbs[1]) orbs[1].style.transform = `translate(${curX * -0.04}px, ${curY * 0.025}px)`;
    if (orbs[2]) orbs[2].style.transform = `translate(${curX * 0.05}px, ${curY * -0.03}px)`;

    rafId = requestAnimationFrame(animate);
  }

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left - rect.width / 2;
    mouseY = e.clientY - rect.top - rect.height / 2;

    if (!rafId) rafId = requestAnimationFrame(animate);
  });

  hero.addEventListener('mouseleave', () => {
    mouseX = 0;
    mouseY = 0;
  });
}

// ─────────────────────────────────────────────────────
// 9. CARD TILT EFFECT
// ─────────────────────────────────────────────────────
function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cards = $$('.sim-card, .evento-card');

  cards.forEach(card => {
    let rafId = null;
    let currentRX = 0, currentRY = 0;
    let targetRX = 0, targetRY = 0;
    let isHovered = false;

    function animate() {
      currentRX = lerp(currentRX, targetRX, 0.1);
      currentRY = lerp(currentRY, targetRY, 0.1);

      const dist = Math.abs(currentRX) + Math.abs(currentRY);
      if (!isHovered && dist < 0.05) {
        card.style.transform = '';
        cancelAnimationFrame(rafId);
        rafId = null;
        return;
      }

      card.style.transform = `
        translateY(${isHovered ? '-6px' : '0'})
        perspective(800px)
        rotateX(${currentRX}deg)
        rotateY(${currentRY}deg)
      `;

      rafId = requestAnimationFrame(animate);
    }

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      targetRX = -y * 6;
      targetRY = x * 6;

      if (!rafId) {
        isHovered = true;
        rafId = requestAnimationFrame(animate);
      }
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      targetRX = 0;
      targetRY = 0;
      if (!rafId) rafId = requestAnimationFrame(animate);
    });
  });
}

// ─────────────────────────────────────────────────────
// 10. TELEMETRY VALUES (random fluctuation)
// ─────────────────────────────────────────────────────
function initTelemetry() {
  const telems = {
    '.telem-blue': {
      values: ['287 km/h', '264 km/h', '302 km/h', '289 km/h', '271 km/h'],
      current: 0,
    },
    '.telem-violet': {
      values: ['1:42.381', '1:43.007', '1:41.856', '1:42.614', '1:43.219'],
      current: 0,
    },
    '.telem-green': {
      values: ['–0.412s', '+0.108s', '–0.834s', '–0.215s', '+0.042s'],
      current: 0,
    },
  };

  // Find all telem values and update them periodically
  const targets = $$('.telem-value');
  if (!targets.length) return;

  const blueEl = targets[0];
  const violetEl = targets[1];
  const greenEl = targets[3];

  const blueVals = telems['.telem-blue'].values;
  const violetVals = telems['.telem-violet'].values;
  const greenVals = telems['.telem-green'].values;

  let blueIdx = 0, violetIdx = 0, greenIdx = 0;

  function flickerUpdate(el, values, idxRef) {
    el.style.opacity = '0.3';
    setTimeout(() => {
      el.textContent = values[idxRef];
      el.style.opacity = '1';
    }, 120);
  }

  setInterval(() => {
    if (blueEl) {
      blueIdx = (blueIdx + 1) % blueVals.length;
      flickerUpdate(blueEl, blueVals, blueIdx);
    }
  }, 3200);

  setInterval(() => {
    if (violetEl) {
      violetIdx = (violetIdx + 1) % violetVals.length;
      flickerUpdate(violetEl, violetVals, violetIdx);
    }
  }, 4700);

  setInterval(() => {
    if (greenEl) {
      greenIdx = (greenIdx + 1) % greenVals.length;
      flickerUpdate(greenEl, greenVals, greenIdx);
    }
  }, 2900);
}

// ─────────────────────────────────────────────────────
// 11. FORM HANDLING
// ─────────────────────────────────────────────────────
function initForm() {
  const form = $('#apexForm');
  const successMsg = $('#formSuccess');
  const submitBtn = $('#formSubmit');
  if (!form) return;

  function showError(inputId, message) {
    const errEl = $(`#${inputId}Err`);
    const inputEl = $(`#${inputId}`);
    if (errEl) errEl.textContent = message;
    if (inputEl) inputEl.style.borderColor = 'rgba(255,107,43,0.5)';
  }

  function clearError(inputId) {
    const errEl = $(`#${inputId}Err`);
    const inputEl = $(`#${inputId}`);
    if (errEl) errEl.textContent = '';
    if (inputEl) inputEl.style.borderColor = '';
  }

  function validateForm() {
    let valid = true;
    clearError('fNombre');
    clearError('fEmail');

    const nombre = $('#fNombre')?.value.trim();
    const email = $('#fEmail')?.value.trim();

    if (!nombre || nombre.length < 2) {
      showError('fNombre', 'Por favor ingresá tu nombre completo.');
      valid = false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('fEmail', 'Por favor ingresá un email válido.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!validateForm()) return;

    // Loading state
    const btnText = submitBtn?.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'ENVIANDO...';
    if (submitBtn) submitBtn.disabled = true;

    // Simulate async submission
    setTimeout(() => {
      form.style.display = 'none';
      if (successMsg) {
        successMsg.removeAttribute('hidden');
        successMsg.style.display = 'block';
      }
    }, 1400);
  });

  // Live validation on blur
  ['fNombre', 'fEmail'].forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;

    el.addEventListener('blur', () => {
      clearError(id);
      if (id === 'fNombre' && el.value.trim().length < 2 && el.value.trim()) {
        showError(id, 'El nombre es demasiado corto.');
      }
      if (id === 'fEmail' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
        showError(id, 'Por favor ingresá un email válido.');
      }
    });

    el.addEventListener('input', () => {
      clearError(id);
      el.style.borderColor = '';
    });
  });
}

// ─────────────────────────────────────────────────────
// 12. DYNAMIC ORBS (subtle random movement)
// ─────────────────────────────────────────────────────
function initDynamicOrbs() {
  const orbs = $$('.stats-orb, .proceso-orb--1, .insc-orb');

  orbs.forEach((orb, i) => {
    const baseX = 0;
    const baseY = 0;
    const amplitude = 20 + i * 8;
    const period = 8000 + i * 2500;
    const offset = i * 1200;

    let rafId = null;

    function animate(now) {
      const t = (now + offset) / period;
      const x = baseX + Math.sin(t * Math.PI * 2) * amplitude;
      const y = baseY + Math.cos(t * Math.PI * 2 * 0.7) * amplitude * 0.7;

      orb.style.transform = `translate(${x}px, ${y}px)`;
      rafId = requestAnimationFrame(animate);
    }

    // Only animate if visible (Intersection Observer)
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!rafId) rafId = requestAnimationFrame(animate);
        } else {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      });
    }, { threshold: 0 });

    observer.observe(orb.closest('section') || orb);
  });
}

// ─────────────────────────────────────────────────────
// 13. HERO TITLE ENTRANCE
// ─────────────────────────────────────────────────────
function initHeroEntrance() {
  const content = $('#heroContent');
  if (!content) return;

  const children = [
    content.querySelector('.hero-eyebrow'),
    content.querySelector('.hero-title'),
    content.querySelector('.hero-tagline'),
    content.querySelector('.hero-description'),
    content.querySelector('.hero-actions'),
    content.querySelector('.hero-stats'),
  ];

  children.forEach((el, i) => {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.1}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.1}s`;
  });

  // Trigger after a brief pause
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      children.forEach(el => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
}

// ─────────────────────────────────────────────────────
// 14. HERO SCROLL PARALLAX
// ─────────────────────────────────────────────────────
function initScrollParallax() {
  const hero = $('#hero');
  const heroContent = $('#heroContent');
  if (!hero || !heroContent) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;

    if (scrollY < heroHeight) {
      const progress = scrollY / heroHeight;
      heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
      heroContent.style.opacity = `${1 - progress * 1.8}`;
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

// ─────────────────────────────────────────────────────
// 15. ACTIVE NAV LINK (scroll spy)
// ─────────────────────────────────────────────────────
function initScrollSpy() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    });
  }, {
    threshold: 0.4,
    rootMargin: '-80px 0px -40% 0px',
  });

  sections.forEach(section => observer.observe(section));
}

// ─────────────────────────────────────────────────────
// 16. COCKPIT SVG (inner ring animation)
// ─────────────────────────────────────────────────────
function initCockpitSVG() {
  const svg = $('.cockpit-svg');
  if (!svg) return;

  // Inner elements have staggered animations in CSS.
  // Add a JS-powered "scanning" arc that moves around the HUD.
  const pathEl = svg.querySelector('path');
  if (!pathEl) return;

  // Animate the scanning arc
  let angle = 90;

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${start.x} ${start.y}`;
  }

  function polarToCartesian(cx, cy, r, angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  let rafId = null;
  function animateArc(now) {
    angle = (angle + 0.3) % 360;
    const endAngle = angle + 120;
    const start = polarToCartesian(180, 180, 130, angle);
    const end = polarToCartesian(180, 180, 130, endAngle);

    pathEl.setAttribute('d',
      `M ${start.x} ${start.y} A 130 130 0 0 1 ${end.x} ${end.y}`
    );

    rafId = requestAnimationFrame(animateArc);
  }

  // Start when visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!rafId) rafId = requestAnimationFrame(animateArc);
      } else {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  }, { threshold: 0.2 });

  observer.observe(svg.closest('section') || svg);
}

// ─────────────────────────────────────────────────────
// 17. PREVENT CURSOR: NONE on interactive elements
// ─────────────────────────────────────────────────────
function initCustomCursorTarget() {
  if (window.matchMedia('(hover: none)').matches) return;

  // Interactive elements use cursor:none via CSS body rule,
  // but we need to show a hover state via the glow cursor size.
  const cursor = $('#glowCursor');
  if (!cursor) return;

  const interactiveEls = $$('a, button, .sim-card, .evento-card, input, select, textarea, .glass-card');

  interactiveEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '500px';
      cursor.style.height = '500px';
      cursor.style.background = 'radial-gradient(circle, rgba(123,47,255,0.18) 0%, transparent 60%)';
    });

    el.addEventListener('mouseleave', () => {
      cursor.style.width = '380px';
      cursor.style.height = '380px';
      cursor.style.background = 'radial-gradient(circle, rgba(123,47,255,0.14) 0%, transparent 65%)';
    });
  });
}

// ─────────────────────────────────────────────────────
// 18. PROCESS STEPS ENTER ANIMATION (stagger)
// ─────────────────────────────────────────────────────
function initProcesoSteps() {
  const steps = $$('.proceso-step');
  if (!steps.length) return;

  // Already handled by .reveal system with data-delay,
  // but add a connecting line progress animation
  const trackLine = $('.track-line');
  if (!trackLine) return;

  const procesoSection = $('#proceso');
  if (!procesoSection) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        trackLine.style.transition = 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s';
        trackLine.style.width = '100%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(procesoSection);
}

// ─────────────────────────────────────────────────────
// 19. ACTIVE NAV LINK STYLING
// ─────────────────────────────────────────────────────
function addActiveNavStyles() {
  // Inject active state CSS
  const style = document.createElement('style');
  style.textContent = `
    .nav-link.active {
      color: var(--apex-white);
    }
    .nav-link.active:not(.nav-link--cta)::after {
      content: '';
      display: block;
      height: 1.5px;
      background: linear-gradient(90deg, var(--apex-violet), var(--apex-blue));
      border-radius: 2px;
      margin-top: 2px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .proceso-step.visible .step-card {
        animation: card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
    }
    @keyframes card-enter {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────
// MAIN INIT
// ─────────────────────────────────────────────────────
function init() {
  // Core
  addActiveNavStyles();
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();

// Visual effects
// initGlowCursor();
initCustomCursorTarget();
initHeroEntrance();

  // Conditional (performance-aware)
if (!window.matchMedia('(hover: none)').matches) {
  // initHeroParallax();
  // initScrollParallax();
  initMagneticButtons();
  initCardTilt();
} 

  // Data & interactivity
  initCounters();
  initTelemetry();
  initCockpitSVG();
  initDynamicOrbs();
  initScrollSpy();
  initProcesoSteps();
  initForm();
}

// ─────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ─────────────────────────────────────────────────────
// PERFORMANCE: Pause heavy animations when tab is hidden
// ─────────────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  const isHidden = document.hidden;

  $$('.hero-orb, .stats-orb, .cockpit-svg').forEach(el => {
    el.style.animationPlayState = isHidden ? 'paused' : 'running';
  });
});
