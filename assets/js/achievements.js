// ── Sliders ───────────────────────────────────────────────────────────────────
let bibmStep = 0;
const bibmTotal = 3;
function moveBibmSlider(direction) {
  const slider = document.getElementById('slider-bibm');
  bibmStep = (bibmStep + direction + bibmTotal) % bibmTotal;
  slider.style.transform = `translateX(-${bibmStep * 100}%)`;
}

let blfcaStep = 0;
const blfcaTotal = 3;
function moveBlfcaSlider(direction) {
  const slider = document.getElementById('slider-blfca');
  blfcaStep = (blfcaStep + direction + blfcaTotal) % blfcaTotal;
  slider.style.transform = `translateX(-${blfcaStep * 100}%)`;
}

let regStep = 0;
const regTotal = 2;
function moveRegSlider(direction) {
  const slider = document.getElementById('slider-regulatory');
  regStep = (regStep + direction + regTotal) % regTotal;
  slider.style.transform = `translateX(-${regStep * 100}%)`;
}

let ostadStep = 0;
const ostadTotal = 3;
function moveOstadUnboltSlider(direction) {
  const slider = document.getElementById('slider-ostad-unbolt');
  ostadStep = (ostadStep + direction + ostadTotal) % ostadTotal;
  slider.style.transform = `translateX(-${ostadStep * 100}%)`;
}

let aiStep = 0;
const aiTotal = 1;
function moveAiSlider(direction) {
  if (aiTotal <= 1) return;
  const slider = document.getElementById('slider-ai-academy');
  aiStep = (aiStep + direction + aiTotal) % aiTotal;
  slider.style.transform = `translateX(-${aiStep * 100}%)`;
}

// ── Back to Top ───────────────────────────────────────────────────────────────
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.replace('hidden', 'flex');
  } else {
    backToTopBtn.classList.replace('flex', 'hidden');
  }
});
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Spark Canvas ──────────────────────────────────────────────────────────────
(function () {
  const canvas = document.getElementById('achievements-canvas');
  if (!canvas) return;
  if (window.innerWidth < 768) return;
  const ctx = canvas.getContext('2d');
  let sparks = [];

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Spark {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x       = Math.random() * window.innerWidth;
      this.y       = initial
                     ? Math.random() * window.innerHeight * 2          // spread on load
                     : window.innerHeight + 10;                         // start from bottom on recycle
      this.vx      = (Math.random() - 0.5) * 0.5;
      this.vy      = -(Math.random() * 1.5 + 0.5);
      this.radius  = Math.random() * 3 + 1;
      this.opacity = initial ? Math.random() : 1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.opacity -= 0.002;
      if (this.y < 0 || this.opacity <= 0) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle   = `rgba(245,158,11,${this.opacity})`;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = 'rgba(251,191,36,0.8)';
      ctx.fill();
      ctx.shadowBlur  = 0;
    }
  }

  function init() {
    resizeCanvas();
    sparks = [];
    for (let i = 0; i < 60; i++) sparks.push(new Spark());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparks.forEach(s => { s.update(); s.draw(); });
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', init);
  init();
  requestAnimationFrame(animate);
})();

document.addEventListener('DOMContentLoaded', function () {
  if (typeof AOS !== 'undefined') AOS.init({ duration: 700, once: true });
});