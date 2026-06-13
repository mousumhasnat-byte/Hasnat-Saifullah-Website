// ── AOS ──────────────────────────────────────────────────────────────────────
AOS.init({ duration: 800, once: true, offset: 80 });

// ── Mobile Menu ──────────────────────────────────────────────────────────────
const menuBtn    = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
mobileLinks.forEach(link => link.addEventListener('click', () => mobileMenu.classList.add('hidden')));

// ── Counter Animation ────────────────────────────────────────────────────────
const counters = document.querySelectorAll('.counter');
const runCounters = () => {
  counters.forEach(counter => {
    const target = +counter.dataset.target;
    let count = 0;
    const inc = target / 80;
    const update = () => {
      if (count < target) {
        count += inc;
        counter.innerText = target % 1 === 0 ? Math.floor(count) : count.toFixed(1);
        requestAnimationFrame(update);
      } else {
        counter.innerText = target;
      }
    };
    update();
  });
};

const aboutSection = document.getElementById('about');
if (aboutSection) {
  const observer = new IntersectionObserver(
    entries => { if (entries[0].isIntersecting) runCounters(); },
    { threshold: 0.5 }
  );
  observer.observe(aboutSection);
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
});
topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Data-Mesh Canvas ─────────────────────────────────────────────────────────
(function () {
  const canvas = document.getElementById('data-mesh');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = window.innerWidth < 768 ? 30 : 80;
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
      ctx.shadowColor = 'rgba(59,130,246,0.5)';
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }
  }

  let lastTime = 0;
  function animate(time) {
    if (time - lastTime > 30) { updateParticles(); draw(); lastTime = time; }
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resizeCanvas);

  // DOM is already parsed when this defer script runs
  initParticles();
  resizeCanvas();
  requestAnimationFrame(animate);
})();

// ── Image Modal ───────────────────────────────────────────────────────────────
function openImageModal(imgSrc) {
  const modal    = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  if (modal && modalImg) {
    modalImg.src = imgSrc;
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

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeImageModal(); });
document.getElementById('imageModal')?.addEventListener('click', e => {
  if (e.target.id === 'imageModal') closeImageModal();
});
