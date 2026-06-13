// ── Sliders ───────────────────────────────────────────────────────────────────
let projectStep = 0;
const projectTotal = 4;
function moveProjectSlider(direction) {
  const slider = document.getElementById('slider-project-1');
  if (!slider) return;
  projectStep = (projectStep + direction + projectTotal) % projectTotal;
  slider.style.transform = `translateX(-${projectStep * 100}%)`;
}

let creativeStep = 0;
const creativeTotal = 2;
function moveCreativeSlider(direction) {
  const slider = document.getElementById('slider-project-creative');
  if (!slider) return;
  creativeStep = (creativeStep + direction + creativeTotal) % creativeTotal;
  slider.style.transform = `translateX(-${creativeStep * 100}%)`;
}

let bifoldStep = 0;
const bifoldTotal = 2;
function moveBifoldSlider(direction) {
  const slider = document.getElementById('slider-project-bifold');
  if (!slider) return;
  bifoldStep = (bifoldStep + direction + bifoldTotal) % bifoldTotal;
  slider.style.transform = `translateX(-${bifoldStep * 100}%)`;
}

// ── Back to Top ───────────────────────────────────────────────────────────────
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.remove('hidden');
  } else {
    backToTopBtn.classList.add('hidden');
  }
});
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Data-Mesh Canvas (the only working canvas on this page) ───────────────────
(function () {
  const canvas = document.getElementById('data-mesh-canvas');
  if (!canvas) return;
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
