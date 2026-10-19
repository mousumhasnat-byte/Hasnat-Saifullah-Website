'use strict';
/* ============================================================
   Flying Tesla of BD — Mission Impossible
   game loop, states, input, HUD
   States: menu | launch | playing | dead  (+ paused flag)
   ============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = 1;

const Particles = [];
const QUIPS = [
    'The pole won this round.',
    'Sponsored by the Dhaka Electric Board.',
    'Rickshaws were not meant to fly. Yet.',
    'Wire resistance: 1. You: 0.',
    'That span had your name on it.',
    'Thrust vectoring? Never heard of it.',
    'Targeted for Mars. Landed in a ditch.',
    'The bamboo brace held. You did not.'
];
let state = 'menu';
let paused = false;
let score = 0;
let hi = 0;
let newBest = false;
let shake = 0;
let flash = 0;
let deadTime = 0;
let scorePop = 0;
let time = 0;
let deathCause = '';
let launchT = 0;                // seconds inside the launch sequence
let quip = '';
let shed = { active: false, remaining: 0, nextAt: LOADSHED_FIRST, powerT: 0 };

function addShake(n) {          // called from player.js on soot sputter
    shake = Math.max(shake, n);
}

try { hi = parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0; } catch (e) { hi = 0; }

/* ---------------- canvas sizing ---------------- */
function fitCanvas() {
    const vw = window.innerWidth || W;
    const vh = window.innerHeight || H;
    const s = Math.min(vw / W, vh / H);
    canvas.style.width = Math.round(W * s) + 'px';
    canvas.style.height = Math.round(H * s) + 'px';
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
}

/* ---------------- particles ---------------- */
function explode(x, y) {
    const cols = ['#ffb703', '#fb8500', '#ff595e', '#ffd166', '#9d9db3', '#6cc4ff'];
    for (let i = 0; i < 46; i++) {
        const a = Math.random() * 6.2832;
        const s = 80 + Math.random() * 340;
        Particles.push({
            x: x, y: y,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
            life: 0, max: 0.5 + Math.random() * 0.7,
            r: 3 + Math.random() * 5,
            col: cols[(Math.random() * cols.length) | 0],
            grav: 600
        });
    }
    for (let i = 0; i < 14; i++) {
        const a = Math.random() * 6.2832;
        Particles.push({
            x: x, y: y,
            vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 40,
            life: 0, max: 0.7 + Math.random() * 0.6,
            r: 6 + Math.random() * 8,
            col: 'rgba(70,70,82,0.65)',
            grav: -30
        });
    }
    // smoky death column: soot puffs that keep rising and growing
    for (let i = 0; i < 10; i++) {
        Particles.push({
            x: x + (Math.random() - 0.5) * 26,
            y: y - Math.random() * 40,
            vx: (Math.random() - 0.5) * 50,
            vy: -60 - Math.random() * 70,
            life: 0, max: 1.0 + Math.random() * 0.7,
            r: 7 + Math.random() * 7,
            col: Math.random() < 0.4 ? 'rgba(30,30,36,0.75)' : 'rgba(95,95,105,0.6)',
            grav: -25, grow: 18
        });
    }
}

function updateParticles(dt) {
    for (let i = Particles.length - 1; i >= 0; i--) {
        const p = Particles[i];
        p.life += dt;
        if (p.life >= p.max) { Particles.splice(i, 1); continue; }
        p.vy += (p.grav || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.grow) p.r += p.grow * dt;
    }
}

/* ---------------- launch sequence (Elon-style ramp start) ---------------- */
function launchPose() {
    const t = launchT;
    const bx = RAMP_BASE.x, by = RAMP_BASE.y;
    const tx = RAMP_TIP.x, ty = RAMP_TIP.y;
    if (t < IGN_TIME) {
        // parked low on the ramp, thrusters igniting
        const u = 0.18;
        return {
            x: bx + (tx - bx) * u,
            y: by + (ty - by) * u - 16,
            rot: RAMP_ANGLE,
            thrust: 0.55 + 0.45 * Math.random(),
            phase: 'ign'
        };
    }
    if (t < RAMP_TIME) {
        // sliding up the ramp, ease-in
        const p = (t - IGN_TIME) / (RAMP_TIME - IGN_TIME);
        const u = 0.18 + 0.82 * p * p;
        return {
            x: bx + (tx - bx) * u,
            y: by + (ty - by) * u - 16,
            rot: RAMP_ANGLE,
            thrust: 1,
            phase: 'ramp'
        };
    }
    // liftoff arc
    const tl = t - RAMP_TIME;
    const ease = Math.min(1, tl / 0.5);
    return {
        x: tx + (PLAYER_X - tx) * (1 - (1 - ease) * (1 - ease)),
        y: ty + LIFT_VY * tl + 0.5 * GRAVITY * tl * tl,
        rot: RAMP_ANGLE + (-0.25 - RAMP_ANGLE) * Math.min(1, tl / 0.35),
        thrust: 1,
        vy: LIFT_VY + GRAVITY * tl,
        phase: 'lift'
    };
}

function finishLaunch() {
    const p = launchPose();
    Player.x = PLAYER_X;
    Player.y = clamp(p.y, PLAYER_R + 60, LIFT_END_Y);
    Player.vy = clamp(p.vy || -300, -620, -120);
    Player.rot = clamp(p.rot, -0.5, 0.4);
    Player.thrust = 1;
    state = 'playing';
}

function startGame() {
    Player.reset();
    Obstacles.reset();
    score = 0;
    newBest = false;
    shake = 0;
    flash = 0;
    deadTime = 0;
    scorePop = 0;
    quip = QUIPS[(Math.random() * QUIPS.length) | 0];
    Particles.length = 0;
    shed = { active: false, remaining: 0, nextAt: LOADSHED_FIRST, powerT: 0 };
    paused = false;
    launchT = 0;
    state = 'launch';
    Sfx.launch();
}

function onScored() {
    score += 1;
    scorePop = 1;
    Sfx.score();
    if (shed.active) {
        shed.remaining -= 1;
        if (shed.remaining <= 0) endLoadShed();
    } else if (score >= shed.nextAt) {
        startLoadShed();
    }
}

/* ---------------- load shedding ----------------
   First blackout at pillar 10, then a random 10-or-15 pillar gap
   after each event ends; each event lasts 5 pillars. */
function startLoadShed() {
    shed.active = true;
    shed.remaining = LOADSHED_PILLARS;
    Sfx.brownout();
}

function endLoadShed() {
    shed.active = false;
    shed.nextAt = score + (Math.random() < 0.5 ? LOADSHED_MIN : LOADSHED_MAX);
    shed.powerT = 0.45;
    Sfx.powerOn();
}

function die() {
    if (state !== 'playing') return;
    state = 'dead';
    deadTime = 0;
    shake = 16;
    flash = 0.55;
    Player.alive = false;
    Sfx.die();
    explode(Player.x, Player.y);
    if (score > hi) {
        hi = score;
        newBest = true;
        try { localStorage.setItem(HI_KEY, String(hi)); } catch (e) { /* private mode */ }
    }
}

/* ---------------- input ---------------- */
function action() {
    Sfx.init();
    if (paused) { paused = false; return; }
    if (state === 'menu') { startGame(); return; }
    if (state === 'launch') {
        if (launchT > SKIP_AFTER) finishLaunch();   // second tap skips
        return;
    }
    if (state === 'playing') { Player.flap(); return; }
    if (state === 'dead' && deadTime > 0.7) { startGame(); return; }
}

function onPointer(e) {
    if (e.preventDefault) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    if (px > W - 58 && py < 62) { Sfx.toggleMute(); return; }
    action();
}

function onKey(e) {
    /* full keyboard play: Space / W / ↑ / Enter flap, start and restart.
       preventDefault runs BEFORE the repeat guard so page scroll is
       blocked even while a key is held. */
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') {
        if (e.preventDefault) e.preventDefault();
        if (e.repeat) return;
        action();
        return;
    }
    if (e.repeat) return;
    if (e.code === 'KeyP' || e.code === 'Escape') {
        if (state === 'playing') paused = !paused;
    } else if (e.code === 'KeyM') {
        Sfx.toggleMute();
    }
}

/* ---------------- update ---------------- */
function update(dt) {
    time += dt;
    shake = Math.max(0, shake - dt * 45);
    flash = Math.max(0, flash - dt * 1.6);
    scorePop = Math.max(0, scorePop - dt * 3);

    if (paused) return;

    if (state === 'menu') {
        Bg.update(dt, MENU_SCROLL);
        updateParticles(dt);
        return;
    }

    if (state === 'launch') {
        const rampSpeed = BASE_SPEED * Math.min(1, launchT / RAMP_TIME);
        Bg.update(dt, rampSpeed);
        launchT += dt;
        const p = launchPose();

        // thruster exhaust at the rear nozzle (world space)
        const ca = Math.cos(p.rot), sa = Math.sin(p.rot);
        const nx = p.x + (-60) * ca - (-4) * sa;
        const ny = p.y + (-60) * sa + (-4) * ca;
        for (let i = 0; i < 2; i++) {
            Particles.push({
                x: nx, y: ny,
                vx: Math.cos(p.rot) * (-220 - Math.random() * 160),
                vy: Math.sin(p.rot) * (-220 - Math.random() * 160) + (Math.random() - 0.5) * 60,
                life: 0, max: 0.22 + Math.random() * 0.2,
                r: 3 + Math.random() * 3.5,
                col: Math.random() < 0.6 ? '#7ccdff' : '#2b6cff',
                grav: 0, grow: 0
            });
        }
        // smoky soot from the ignition blast
        if (Math.random() < 0.8) {
            Particles.push({
                x: p.x - 46, y: p.y + 8,
                vx: -70 - Math.random() * 110,
                vy: 20 + Math.random() * 60,
                life: 0, max: 0.5 + Math.random() * 0.5,
                r: 4 + Math.random() * 4,
                col: Math.random() < 0.5 ? 'rgba(40,40,46,0.7)' : 'rgba(120,120,130,0.55)',
                grav: -30, grow: 16
            });
        }
        // sparks bouncing off the concrete ramp while igniting
        if (p.phase !== 'lift' && Math.random() < 0.4) {
            Particles.push({
                x: p.x - 40, y: p.y + 22,
                vx: -60 - Math.random() * 160,
                vy: -40 - Math.random() * 120,
                life: 0, max: 0.3 + Math.random() * 0.3,
                r: 1.5 + Math.random() * 1.5,
                col: Math.random() < 0.5 ? '#ffd166' : '#ff8c42',
                grav: 900, grow: 0
            });
        }
        if (p.phase === 'ign') shake = Math.max(shake, 5);
        updateParticles(dt);

        if (p.phase === 'lift' && p.y <= LIFT_END_Y) finishLaunch();
        else if (launchT > LIFT_MAX) finishLaunch();
        return;
    }

    if (state === 'playing') {
        const spd = gameSpeed(score);
        Bg.update(dt, spd);
        Player.update(dt, true);
        if (shed.active) autoFlap();                // power is out — she flies herself
        if (shed.powerT > 0) shed.powerT = Math.max(0, shed.powerT - dt);
        const hit = Obstacles.update(dt, spd, score, onScored);
        if (Player.y + PLAYER_R >= GROUND_Y) {
            Player.y = GROUND_Y - PLAYER_R;
            deathCause = 'ground';
            die();
        } else if (hit) {
            deathCause = 'obstacle';
            die();
        }
        updateParticles(dt);
        return;
    }

    /* dead */
    deadTime += dt;
    Player.update(dt, false);                       // tumble
    if (Player.y + PLAYER_R > GROUND_Y) {
        Player.y = GROUND_Y - PLAYER_R;
        Player.vy = 0;
    }
    updateParticles(dt);
}

/* ---------------- HUD / overlays ---------------- */
function drawMuteBtn() {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(12,14,20,0.55)';
    roundRectPath(ctx, W - 52, 16, 36, 36, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, W - 52, 16, 36, 36, 8);
    ctx.stroke();
    // speaker glyph
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(W - 45, 30);
    ctx.lineTo(W - 39, 30);
    ctx.lineTo(W - 32, 24);
    ctx.lineTo(W - 32, 44);
    ctx.lineTo(W - 39, 38);
    ctx.lineTo(W - 45, 38);
    ctx.closePath();
    ctx.fill();
    if (Sfx.muted) {
        ctx.strokeStyle = '#ff5964';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W - 48, 23);
        ctx.lineTo(W - 27, 45);
        ctx.stroke();
    } else {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W - 32, 34, 7, -0.9, 0.9);
        ctx.stroke();
    }
    ctx.restore();
}

function scoreText(str, y, size) {
    ctx.font = '900 ' + size + 'px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(13,17,23,0.85)';
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(str, W / 2, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(str, W / 2, y);
}

function drawMenu() {
    // dim band behind title
    const g = ctx.createLinearGradient(0, 110, 0, 440);
    g.addColorStop(0, 'rgba(13,10,24,0)');
    g.addColorStop(0.5, 'rgba(13,10,24,0.6)');
    g.addColorStop(1, 'rgba(13,10,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 110, W, 330);

    ctx.save();
    ctx.shadowColor = '#4cc9f0';
    ctx.shadowBlur = 22;
    scoreText('FLYING TESLA OF BD', 178, 36);
    ctx.restore();
    scoreText('MISSION IMPOSSIBLE', 232, 30);
    ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,209,102,0.95)';
    ctx.fillText('★ A RICKSHAW PARODY ★', 268, 262);

    // bobbing demo rickshaw
    const bob = Math.sin(time * 2) * 10;
    drawRickshaw(ctx, W / 2, 400 + bob, Math.sin(time * 2) * 0.08, 0.5, time, time * 10);

    ctx.font = '600 18px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText('Dodge the poles. Mind the wires.', W / 2, 500);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Pole-to-pole spans are lethal.', W / 2, 526);

    if (hi > 0) {
        ctx.fillStyle = '#ffd166';
        ctx.font = '700 20px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('BEST  ' + hi, W / 2, 564);
    }

    // blinking prompt
    if (Math.sin(time * 4) > -0.2) {
        ctx.fillStyle = '#7ccdff';
        ctx.font = '800 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('TAP  /  PRESS SPACE', W / 2, 610);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '500 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('P = pause    M = mute', W / 2, 642);
}

function drawLaunch() {
    drawLaunchRamp(ctx);
    const p = launchPose();
    drawRickshaw(ctx, p.x, p.y, p.rot, p.thrust, time, time * 26);

    ctx.textAlign = 'center';
    if (p.phase === 'ign') {
        ctx.font = '900 26px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#ffd166';
        ctx.fillText('IGNITION…', W / 2, 200);
    } else if (p.phase === 'ramp') {
        ctx.font = '900 26px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#7ccdff';
        ctx.fillText('MAX Q! (…of a rickshaw)', W / 2, 200);
    } else {
        ctx.font = '900 34px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#ff8c42';
        ctx.fillText('LIFTOFF!!', W / 2, 190);
    }
    if (launchT > SKIP_AFTER && Math.sin(time * 6) > -0.3) {
        ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('tap to skip', W / 2, 232);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(8,6,14,0.55)';
    ctx.fillRect(0, 0, W, H);

    const px = 42, pw = W - 84, ph = 300, py = 200;
    ctx.fillStyle = 'rgba(20,16,32,0.95)';
    roundRectPath(ctx, px, py, pw, ph, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(124,205,255,0.5)';
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, px, py, pw, ph, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5964';
    ctx.font = '900 40px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('GAME OVER', W / 2, py + 54);

    ctx.fillStyle = '#fff';
    ctx.font = '800 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SCORE  ' + score, W / 2, py + 106);

    ctx.fillStyle = '#ffd166';
    ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('BEST  ' + hi, W / 2, py + 144);

    if (newBest) {
        ctx.fillStyle = '#90e0a0';
        ctx.font = '800 18px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('★ NEW BEST! ★', W / 2, py + 174);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'italic 600 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(quip, W / 2, py + 208, pw - 40);

    if (deadTime > 0.7 && Math.sin(time * 4) > -0.2) {
        ctx.fillStyle = '#7ccdff';
        ctx.font = '800 20px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('TAP TO RESTART', W / 2, py + 254);
    }
}

/* ---------------- render ---------------- */
function render(t) {
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(sx, sy);

    Bg.draw(ctx);
    if (state === 'launch') {
        drawLaunch();
    } else {
        Obstacles.draw(ctx, t);
        if (state === 'menu') {
            drawRickshaw(ctx, W / 2, 400 + Math.sin(time * 2) * 10, Math.sin(time * 2) * 0.08, 0.5, t, time * 10);
        } else {
            Player.draw(ctx, t);
        }
    }

    for (const p of Particles) {
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    /* load shedding: dim the world, weak generator glow on the rickshaw */
    if (state === 'playing' && shed.active) {
        const flick = 0.62 + 0.05 * Math.sin(t * 21) + 0.03 * Math.sin(t * 57);
        ctx.fillStyle = 'rgba(4,5,12,' + flick.toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(Player.x, Player.y, 8, Player.x, Player.y, 150);
        g.addColorStop(0, 'rgba(255,214,140,0.30)');
        g.addColorStop(0.5, 'rgba(255,190,120,0.10)');
        g.addColorStop(1, 'rgba(255,190,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        drawShedBanner();
    } else if (state === 'playing' && shed.powerT > 0) {
        /* power just returned: quick bright flicker */
        const a = shed.powerT > 0.25 ? 0.45 : (Math.sin(shed.powerT * 90) > 0 ? 0.30 : 0.05);
        ctx.fillStyle = 'rgba(255,240,210,' + a.toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
    }

    /* flash on death */
    if (flash > 0) {
        ctx.fillStyle = 'rgba(255,120,90,' + (flash * 0.5) + ')';
        ctx.fillRect(0, 0, W, H);
    }

    /* HUD */
    if (state === 'playing' || state === 'dead') {
        scoreText(String(score), 96, 60 + scorePop * 12);
    }
    drawMuteBtn();

    if (state === 'menu') drawMenu();
    if (state === 'dead') drawGameOver();
    if (paused) {
        ctx.fillStyle = 'rgba(8,6,14,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = '900 36px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('PAUSED', W / 2, H / 2 - 10);
        ctx.fillStyle = '#7ccdff';
        ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('tap or press P to resume', W / 2, H / 2 + 30);
    }
}

/* ---------------- load-shedding autopilot ----------------
   Verbatim port of the proven test-AI in test/smoke.js: aim for the
   gap centre, respect the nest ceiling (apex lands ~66px ahead of a
   tap), emergency floor taps, and clear the span wire ahead. */
function flapThreshold(P, list) {
    let thr = 360;                     // default: hover at 45% height
    let target = 360;
    let topLimit = 400, botLimit = 700, near = false;
    for (const o of list) {
        if (o.x + o.w > P.x - 20) {    // lane centre of the next pole
            topLimit = o.gapTop + o.topSagMax * o.h + 19;
            botLimit = o.gapBottom - o.botSagMax * o.h - 19;
            target = (topLimit + botLimit) / 2;
            break;
        }
    }
    // nest ceiling planning window: the pole's rule must bind
    // before its box, not just beside it
    let nearPlan = false, nearFloor = false;
    for (const o of list) {
        if (P.x >= o.x - 110 && P.x <= o.x + o.w + 40) {
            topLimit = o.gapTop + o.topSagMax * o.h + 19;
            botLimit = o.gapBottom - o.botSagMax * o.h - 19;
            nearPlan = true;
            break;
        }
    }
    // emergency floor-tap only within real collision reach of a box
    for (const o of list) {
        if (P.x >= o.x - 18 && P.x <= o.x + o.w + 18) {
            botLimit = o.gapBottom - o.botSagMax * o.h - 19;
            nearFloor = true;
            break;
        }
    }
    thr = target + 4;
    if (nearPlan) thr = Math.max(thr, topLimit + 62);

    for (const o of list) {
        if (!o.span) continue;
        const lx = P.x - o.x;
        const pts = o.span;
        if (lx < pts[0].x || lx > pts[pts.length - 1].x) continue;
        const wireAt = (xq) => {
            for (let j = 0; j < pts.length - 1; j++) {
                const a = pts[j], b = pts[j + 1];
                if (xq >= a.x && xq <= b.x) {
                    const t = (xq - a.x) / Math.max(1e-6, b.x - a.x);
                    return a.y + (b.y - a.y) * t;
                }
            }
            return pts[pts.length - 1].y;
        };
        // worst wire height over the next ~75px (where the hop apex
        // lands), + 88 so a full hop (58px) still clears wire + radius
        const w = Math.max(wireAt(lx), wireAt(Math.min(pts[pts.length - 1].x, lx + 75)));
        thr = Math.max(thr, w + 88);
    }
    if (nearFloor && P.y > botLimit - 2) thr = -Infinity;  // emergency
    return thr;
}

function autoFlap() {
    const thr = flapThreshold(Player, Obstacles.list);
    if (Player.y > thr && Player.vy > -150) Player.flap();
}

function drawShedBanner() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(8,6,16,0.72)';
    roundRectPath(ctx, 40, 132, W - 80, 114, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.55)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, 40, 132, W - 80, 114, 14);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 22px "Nirmala UI","Segoe UI",system-ui,sans-serif';
    ctx.fillText('⚡ লোড শেডিং!', W / 2, 162);
    ctx.fillStyle = '#e8f1ff';
    ctx.font = '700 14px "Nirmala UI","Segoe UI",system-ui,sans-serif';
    ctx.fillText('অটোপাইলট চালু — রিকশা নিজেই উড়ছে', W / 2, 190);
    ctx.fillStyle = 'rgba(232,241,255,0.75)';
    ctx.font = '600 12.5px "Segoe UI",system-ui,sans-serif';
    ctx.fillText('LOAD SHEDDING · AUTOPILOT ON (taps still work)', W / 2, 212, 342);
    ctx.fillStyle = '#ffd166';
    ctx.font = '700 13px "Nirmala UI","Segoe UI",system-ui,sans-serif';
    ctx.fillText('পিলার বাকি: ' + shed.remaining, W / 2, 234);
    ctx.restore();
}

/* ---------------- main loop ---------------- */
let lastT = performance.now();
function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    update(dt);
    render(now / 1000);
    requestAnimationFrame(frame);
}

fitCanvas();
canvas.addEventListener('pointerdown', onPointer);
window.addEventListener('keydown', onKey);
window.addEventListener('resize', fitCanvas);
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') paused = true;
});
window.addEventListener('blur', () => {
    if (state === 'playing') paused = true;
});
requestAnimationFrame(frame);

/* test hook (harmless in browser, used by test/smoke.js) */
globalThis.VF = {
    get state() { return state; },
    get paused() { return paused; },
    get score() { return score; },
    get hi() { return hi; },
    get deadTime() { return deadTime; },
    get deathCause() { return deathCause; },
    get launchT() { return launchT; },
    get quip() { return quip; },
    get shed() { return shed; },
    Player, Obstacles, Sfx, action, startGame, die, update, render, fitCanvas
};
