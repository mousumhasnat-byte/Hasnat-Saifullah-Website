// ── Sliders ───────────────────────────────────────────────────────────────────
function setDots(dotsId, active) {
  const dots = document.getElementById(dotsId);
  if (!dots) return;
  [...dots.children].forEach((d, i) => {
    d.classList.toggle('slider-dot--active', i === active);
    d.classList.toggle('slider-dot--inactive', i !== active);
  });
}

function renderDots(dotsId, total, goToFn) {
  const dots = document.getElementById(dotsId);
  if (!dots) return;
  dots.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slider-dot slider-dot--inactive';
    b.setAttribute('aria-label', `Go to slide ${i + 1}`);
    b.addEventListener('click', () => goToFn(i));
    dots.appendChild(b);
  }
  setDots(dotsId, 0);
}

let projectStep = 0;
const projectTotal = 4;
function moveProjectSlider(direction) {
  const slider = document.getElementById('slider-project-1');
  if (!slider) return;
  projectStep = (projectStep + direction + projectTotal) % projectTotal;
  slider.style.transform = `translateX(-${projectStep * 100}%)`;
  setDots('dots-project-1', projectStep);
}
function goToProjectSlide(i) { projectStep = i; moveProjectSlider(0); }

let creativeStep = 0;
const creativeTotal = 2;
function moveCreativeSlider(direction) {
  const slider = document.getElementById('slider-project-creative');
  if (!slider) return;
  creativeStep = (creativeStep + direction + creativeTotal) % creativeTotal;
  slider.style.transform = `translateX(-${creativeStep * 100}%)`;
  setDots('dots-project-creative', creativeStep);
}
function goToCreativeSlide(i) { creativeStep = i; moveCreativeSlider(0); }

let bifoldStep = 0;
const bifoldTotal = 2;
function moveBifoldSlider(direction) {
  const slider = document.getElementById('slider-project-bifold');
  if (!slider) return;
  bifoldStep = (bifoldStep + direction + bifoldTotal) % bifoldTotal;
  slider.style.transform = `translateX(-${bifoldStep * 100}%)`;
}

let webDashStep = 0;
const webDashTotal = 10;
function moveWebDashSlider(direction) {
  const slider = document.getElementById('slider-web-dash');
  if (!slider) return;
  webDashStep = (webDashStep + direction + webDashTotal) % webDashTotal;
  slider.style.transform = `translateX(-${webDashStep * 100}%)`;
  setDots('dots-web-dash', webDashStep);
}
function goToWebDashSlide(i) { webDashStep = i; moveWebDashSlider(0); }

// ── Image Modal (Fullscreen) ───────────────────────────────────────────────────
const webDashImages = [
  'assets/images/loan_dashboard_executive_summary.png',
  'assets/images/loan_dashboard_overview.png',
  'assets/images/loan_dashboard_graphics.png',
  'assets/images/loan_dashboard_recovery.png',
  'assets/images/deposit_dashboard_executive_summary.png',
  'assets/images/deposit_dashboard_overview.png',
  'assets/images/deposit_dashboard_graphics.png',
  'assets/images/deposit_dashboard_liability_team.png',
  'assets/images/deposit_dashboard_encashments.png',
  'assets/images/deposit_dashboard_maturity.png',
];

let modalImageIndex = 0;
let currentZoom = 1;

function applyZoom() {
  const img = document.getElementById('modalImg');
  const zoomLevel = document.getElementById('zoomLevel');
  if (!img || !zoomLevel) return;
  zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
  if (currentZoom === 1) {
    img.style.width = '';
  } else {
    img.style.width = Math.round(img.naturalWidth * currentZoom) + 'px';
  }
}

function zoomIn() {
  currentZoom = Math.min(currentZoom + 0.25, 3);
  applyZoom();
}

function zoomOut() {
  currentZoom = Math.max(currentZoom - 0.25, 0.25);
  applyZoom();
}

function resetZoom() {
  currentZoom = 1;
  applyZoom();
}

function openImageModal(index) {
  modalImageIndex = index;
  currentZoom = 1;
  const modal = document.getElementById('imageModal');
  const zoomBar = document.getElementById('zoomBar');
  const modalImg = document.getElementById('modalImg');
  if (modal && modalImg) {
    modalImg.onload = function () { applyZoom(); };
    modalImg.src = webDashImages[index];
    modal.classList.remove('hidden');
    if (zoomBar) zoomBar.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  const zoomBar = document.getElementById('zoomBar');
  if (modal) {
    modal.classList.add('hidden');
    if (zoomBar) zoomBar.classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentZoom = 1;
  }
}

function modalPrev() {
  modalImageIndex = (modalImageIndex - 1 + webDashImages.length) % webDashImages.length;
  currentZoom = 1;
  const modalImg = document.getElementById('modalImg');
  if (modalImg) {
    modalImg.onload = function () { applyZoom(); };
    modalImg.src = webDashImages[modalImageIndex];
  }
}

function modalNext() {
  modalImageIndex = (modalImageIndex + 1) % webDashImages.length;
  currentZoom = 1;
  const modalImg = document.getElementById('modalImg');
  if (modalImg) {
    modalImg.onload = function () { applyZoom(); };
    modalImg.src = webDashImages[modalImageIndex];
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeImageModal();
  if (e.key === 'ArrowLeft') { const m = document.getElementById('imageModal'); if (m && !m.classList.contains('hidden')) modalPrev(); }
  if (e.key === 'ArrowRight') { const m = document.getElementById('imageModal'); if (m && !m.classList.contains('hidden')) modalNext(); }
});
document.getElementById('imageModal')?.addEventListener('click', e => {
  if (e.target.id === 'imageModal') closeImageModal();
});

// ── Back to Top ───────────────────────────────────────────────────────────────
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.remove('hidden');
    backToTopBtn.classList.add('flex');
  } else {
    backToTopBtn.classList.add('hidden');
    backToTopBtn.classList.remove('flex');
  }
}, { passive: true });
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
// ── Data-Mesh Canvas (the only working canvas on this page) ───────────────────
(function () {
  const canvas = document.getElementById('data-mesh-canvas');
  if (!canvas) return;
  if (window.innerWidth < 768) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class DataParticle {
    constructor() {
      this.x      = Math.random() * window.innerWidth;
      this.y      = Math.random() * window.innerHeight;
      this.vx     = (Math.random() - 0.5) * 1.5;
      this.vy     = (Math.random() - 0.5) * 1.5;
      this.radius = Math.random() * 2.5 + 1;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > window.innerWidth)  this.vx *= -1;
      if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,130,246,0.7)';
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < 70; i++) particles.push(new DataParticle());
  }

  let lastTime = 0;
  function animate(time) {
    if (time - lastTime > 30) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.update(); p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = p.x - particles[j].x;
          const dy   = p.y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            ctx.strokeStyle = `rgba(99,102,241,${1 - dist / 180})`;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });
      lastTime = time;
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', init);
  init();
  requestAnimationFrame(animate);
})();

// ── Slider Dots ───────────────────────────────────────────────────────────────
renderDots('dots-web-dash', webDashTotal, goToWebDashSlide);
renderDots('dots-project-1', projectTotal, goToProjectSlide);
renderDots('dots-project-creative', creativeTotal, goToCreativeSlide);

AOS.init({ duration: 700, once: true });