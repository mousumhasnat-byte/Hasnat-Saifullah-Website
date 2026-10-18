// ── AOS ──────────────────────────────────────────────────────────────────────
AOS.init({ duration: 800, once: true, offset: 80 });

// ── Mobile Menu ──────────────────────────────────────────────────────────────
const menuBtn    = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

const setMenuOpen = open => menuBtn.setAttribute('aria-expanded', String(open));
menuBtn.addEventListener('click', () => {
  const stillHidden = mobileMenu.classList.toggle('hidden');
  setMenuOpen(!stillHidden);
});
mobileLinks.forEach(link => link.addEventListener('click', () => {
  mobileMenu.classList.add('hidden');
  setMenuOpen(false);
}));

// ── Counter Animation ────────────────────────────────────────────────────────
// Static HTML already renders the final value (works with JS off). When JS is
// available we reset to 0 and count up once the stats grid scrolls into view.
const counters = document.querySelectorAll('.counter');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCounter(counter) {
  const target = parseFloat(counter.dataset.target);
  if (Number.isNaN(target)) return;
  if (prefersReducedMotion) { counter.innerText = target; return; }
  const duration = 1600;
  const start = performance.now();
  const step = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.innerText = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else counter.innerText = target;
  };
  requestAnimationFrame(step);
}

let countersRun = false;
const runCounters = () => {
  if (countersRun) return;
  countersRun = true;
  counters.forEach(animateCounter);
};

if (counters.length && !prefersReducedMotion) {
  counters.forEach(c => { c.innerText = '0'; });
  const stats = document.getElementById('stats') || document.getElementById('about');
  if ('IntersectionObserver' in window && stats) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { runCounters(); obs.disconnect(); }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(stats);
    // Safety net: if the observer never fires, run once the block is on-screen.
    window.setTimeout(() => {
      if (countersRun) return;
      const rect = stats.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) runCounters();
    }, 2500);
  } else {
    runCounters();
  }
}

// ── Back to Top ───────────────────────────────────────────────────────────────
const topBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (document.documentElement.scrollTop > 400) {
    topBtn.classList.remove('hidden');
    topBtn.classList.add('flex');
  } else {
    topBtn.classList.add('hidden');
    topBtn.classList.remove('flex');
  }
}, { passive: true });
topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Data-Mesh Canvas ─────────────────────────────────────────────────────────
(function () {
  const canvas = document.getElementById('data-mesh');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  if (window.innerWidth < 768) return;
const PARTICLE_COUNT = 80;
  const MAX_DISTANCE   = 200;
  const EDGE_OPACITY   = 0.15;

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: Math.random() * 2 + 1,
      });
    }
  }

  function resizeCanvas() {
    width  = window.innerWidth;
    canvas.width  = width;
    canvas.height = window.innerHeight;
    height = canvas.height;
  }

  function updateParticles() {
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = (particles[i].x - particles[j].x) * width;
        const dy   = (particles[i].y - particles[j].y) * height;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_DISTANCE) {
          ctx.strokeStyle = `rgba(59,130,246,${(1 - dist / MAX_DISTANCE) * EDGE_OPACITY})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x * width, particles[i].y * height);
          ctx.lineTo(particles[j].x * width, particles[j].y * height);
          ctx.stroke();
        }
      }
    }
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.size * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96,165,250,0.9)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }
  }

  let lastTime = 0;
  let running = true;
  function animate(time) {
    if (time - lastTime > 30) { updateParticles(); draw(); lastTime = time; }
    if (running) requestAnimationFrame(animate);
  }

  // Pause the loop while the tab is hidden to save CPU/battery.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; lastTime = 0; requestAnimationFrame(animate); }
  });

  window.addEventListener('resize', resizeCanvas);

  // DOM is already parsed when this defer script runs
  initParticles();
  resizeCanvas();
  requestAnimationFrame(animate);
})();

// ── Image Modal ───────────────────────────────────────────────────────────────
function openImageModal(imgSrc, imgAlt) {
  const modal    = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  if (modal && modalImg) {
    modalImg.src = imgSrc;
    modalImg.alt = imgAlt || 'Enlarged document preview';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

// ── Video Modal ────────────────────────────────────────────────────────────────
function openVideoModal() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('promoVideo');
  if (modal && video) { modal.classList.remove('hidden'); video.currentTime = 0; video.play(); document.body.style.overflow = 'hidden'; }
}
function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('promoVideo');
  if (modal) { modal.classList.add('hidden'); video.pause(); document.body.style.overflow = 'auto'; }
}
document.getElementById('videoModal')?.addEventListener('click', e => {
  if (e.target.id === 'videoModal') closeVideoModal();
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeImageModal(); closeVideoModal(); } });
document.getElementById('imageModal')?.addEventListener('click', e => {
  if (e.target.id === 'imageModal') closeImageModal();
});

// Keyboard support for clickable elements that use role="button" (Enter / Space)
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof Element && e.target.matches('[role="button"]')) {
    e.preventDefault();
    e.target.click();
  }
});
