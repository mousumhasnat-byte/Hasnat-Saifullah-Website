'use strict';
/* ============================================================
   Flying Tesla of BD — vector art (everything drawn in code)

   - drawRickshaw: Bangladeshi rickshaw with a welded cold-gas
     thruster rig (parody of the Musk flying-car concept)
   - drawBottomPole / drawTopPole: leaning, fractured, bamboo-
     braced Dhaka-style utility poles
   - drawLaunchRamp: the makeshift concrete launch ramp
   ============================================================ */

function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/* ------------------------------------------------------------ */
function drawWheel(ctx, cx, cy, r, spin) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin || 0);
    ctx.fillStyle = '#15181d';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#2b313b';
    ctx.beginPath(); ctx.arc(0, 0, r - 3.5, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#9aa5b1';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.2832;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
        ctx.stroke();
    }
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.2832); ctx.fill();
    ctx.restore();
}

/* ------------------------------------------------------------
   The player: rickshaw + welded thruster rig.
   x,y = center, rot = radians, thrust 0..1, t = clock, spin = wheel angle
   ------------------------------------------------------------ */
function drawRickshaw(ctx, x, y, rot, thrust, t, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    /* --- plasma plumes (behind body) --- */
    if (thrust > 0.03) {
        const flick = 0.85 + Math.sin(t * 43) * 0.15;

        // rear main nozzle
        const len = (46 + 52 * thrust) * flick;
        let g = ctx.createLinearGradient(-60, -4, -60 - len, -4);
        g.addColorStop(0, '#eaf7ff');
        g.addColorStop(0.3, '#7ccdff');
        g.addColorStop(0.7, '#2b6cff');
        g.addColorStop(1, 'rgba(43,108,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-56, -11);
        ctx.lineTo(-60 - len * 0.55, -16 - 5 * thrust);
        ctx.lineTo(-60 - len, -4);
        ctx.lineTo(-60 - len * 0.55, 8 + 5 * thrust);
        ctx.lineTo(-56, 3);
        ctx.closePath();
        ctx.fill();

        // under-chassis RCS nozzles
        for (const nx of [-8, 10]) {
            const l = (18 + 22 * thrust) * flick;
            let g2 = ctx.createLinearGradient(0, 16, 0, 16 + l);
            g2.addColorStop(0, '#eaf7ff');
            g2.addColorStop(0.35, '#7ccdff');
            g2.addColorStop(1, 'rgba(43,108,255,0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.moveTo(nx - 6, 14);
            ctx.lineTo(nx, 17 + l);
            ctx.lineTo(nx + 6, 14);
            ctx.closePath();
            ctx.fill();
        }
    }

    /* --- wheels --- */
    drawWheel(ctx, -26, 18, 16, spin);
    drawWheel(ctx, 38, 18, 16, spin);

    /* --- chassis frame --- */
    ctx.strokeStyle = '#1a1f27';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-44, 6); ctx.lineTo(14, 8); ctx.lineTo(38, 12);
    ctx.moveTo(14, 8); ctx.lineTo(18, -2);
    ctx.stroke();

    /* --- passenger cabin --- */
    ctx.fillStyle = '#d62828';
    roundRectPath(ctx, -50, -18, 58, 26, 4);
    ctx.fill();
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* decorated back panel (folk art: heart + florals + dashed trim) */
    ctx.save();
    ctx.beginPath(); roundRectPath(ctx, -47, -15, 52, 20, 3); ctx.clip();
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(-47, -15, 52, 20);
    ctx.fillStyle = '#ff5d8f';
    ctx.beginPath();
    const hx = -36, hy = -5, hs = 4.6;
    ctx.moveTo(hx, hy + hs * 1.3);
    ctx.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.7, hy - hs * 1.4, hx, hy - hs * 0.5);
    ctx.bezierCurveTo(hx + hs * 0.7, hy - hs * 1.4, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 1.3);
    ctx.closePath(); ctx.fill();
    for (const fx of [-20, -11, -2]) {
        ctx.fillStyle = '#ffd166';
        for (let i = 0; i < 5; i++) {
            const a = i / 5 * 6.2832;
            ctx.beginPath();
            ctx.arc(fx + Math.cos(a) * 3.2, -5 + Math.sin(a) * 3.2, 2.1, 0, 6.2832);
            ctx.fill();
        }
        ctx.fillStyle = '#e63946';
        ctx.beginPath(); ctx.arc(fx, -5, 2.3, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(-47, 2.5); ctx.lineTo(5, 2.5); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* --- hood / canopy --- */
    ctx.fillStyle = '#2a9d8f';
    ctx.beginPath();
    ctx.moveTo(-52, -17);
    ctx.quadraticCurveTo(-24, -42, 10, -24);
    ctx.lineTo(10, -18);
    ctx.quadraticCurveTo(-24, -36, -52, -13);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 6; i++) {
        const sx = -46 + i * 9.5;
        ctx.beginPath();
        ctx.arc(sx, -18.5 - Math.sin(i / 5 * 3.1416) * 12.5, 2.5, 0, 6.2832);
        ctx.fill();
    }

    /* --- driver saddle --- */
    ctx.fillStyle = '#5c4033';
    roundRectPath(ctx, 10, -8, 16, 6, 2.5);
    ctx.fill();
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* --- handlebar + front fork --- */
    ctx.strokeStyle = '#1a1f27';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(38, 12); ctx.lineTo(42, -14);
    ctx.moveTo(42, -14); ctx.lineTo(50, -18);
    ctx.moveTo(42, -14); ctx.lineTo(34, -18);
    ctx.stroke();

    /* --- thruster rig (welded parody hardware) --- */
    ctx.fillStyle = '#4a5563';
    ctx.fillRect(-50, -2, 17, 8);
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-50, -2, 17, 8);
    ctx.fillStyle = '#c9cdd3';
    ctx.beginPath();
    ctx.arc(-46, 2, 1.6, 0, 6.2832);
    ctx.arc(-38.5, 2, 1.6, 0, 6.2832);
    ctx.fill();
    // rear nozzle
    ctx.fillStyle = '#39424e';
    ctx.beginPath();
    ctx.moveTo(-54, -13); ctx.lineTo(-63, -9); ctx.lineTo(-63, 1); ctx.lineTo(-54, 5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // under-chassis nozzles
    ctx.fillStyle = '#39424e';
    for (const nx of [-8, 10]) {
        ctx.beginPath();
        ctx.moveTo(nx - 6.5, 10); ctx.lineTo(nx - 3, 16.5); ctx.lineTo(nx + 3, 16.5); ctx.lineTo(nx + 6.5, 10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    ctx.restore();
}

/* ------------------------------------------------------------
   Bottom pole: pivot at the gap tip (fair: tip matches hitbox +
   wire attach), body sways toward the ground.  Leaning, cracked,
   rebar exposed, bamboo-braced.
   ------------------------------------------------------------ */
function drawBottomPole(ctx, o, t) {
    const shaftH = GROUND_Y - o.gapBottom;
    if (shaftH <= 12) return;
    const w = POLE_W;
    const sway = Math.sin(t * 1.25 + o.phase) * 0.012;

    ctx.save();
    ctx.translate(o.x + w / 2, o.gapBottom);
    ctx.rotate(o.leanBot + sway);

    /* concrete shaft */
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, '#c9c1b3');
    g.addColorStop(0.3, '#a9a093');
    g.addColorStop(0.72, '#847b6f');
    g.addColorStop(1, '#645c52');
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2, -2, w, shaftH + 10);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(-w / 2, -2, 5, shaftH + 10);
    ctx.fillRect(w / 2 - 5, -2, 5, shaftH + 10);

    /* stains */
    ctx.fillStyle = 'rgba(90,80,66,0.16)';
    for (const s of o.stains) {
        ctx.beginPath();
        ctx.ellipse(-w / 2 + s[0], s[1], s[2], s[3], 0, 0, 6.2832);
        ctx.fill();
    }

    /* jagged cracks */
    ctx.strokeStyle = 'rgba(52,45,38,0.55)';
    ctx.lineWidth = 1.5;
    for (const c of o.cracks) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + c[0], c[1]);
        ctx.lineTo(-w / 2 + c[2], c[3]);
        ctx.stroke();
    }

    /* big fracture: dark notch + exposed rebar crossing it */
    if (shaftH > 90) {
        const fy = shaftH * 0.55;
        ctx.fillStyle = 'rgba(24,20,16,0.8)';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 8, fy - 16);
        ctx.lineTo(w / 2 - 10, fy - 9);
        ctx.lineTo(w / 2 - 14, fy + 4);
        ctx.lineTo(-w / 2 + 12, fy - 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a3f38';   // rebar
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 9, fy - 13); ctx.lineTo(w / 2 - 12, fy + 1);
        ctx.moveTo(-w / 2 + 10, fy - 8); ctx.lineTo(w / 2 - 13, fy + 6);
        ctx.stroke();
        // concrete chunks missing on the edges
        ctx.fillStyle = 'rgba(20,16,12,0.55)';
        ctx.beginPath();
        ctx.moveTo(-w / 2, fy - 20); ctx.lineTo(-w / 2 + 9, fy - 12); ctx.lineTo(-w / 2, fy - 4);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w / 2, fy + 2); ctx.lineTo(w / 2 - 10, fy + 8); ctx.lineTo(w / 2, fy + 15);
        ctx.closePath(); ctx.fill();
    }

    /* posters */
    for (const p of o.posters) {
        ctx.save();
        ctx.translate(-w / 2 + p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(0, 0, p.w, p.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, p.w - 1, p.h - 1);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(4, 6, p.w - 8, 4);
        ctx.fillRect(4, 13, p.w - 12, 3);
        ctx.fillStyle = 'rgba(20,20,30,0.55)';
        ctx.fillRect(4, 19, p.w - 8, 3);
        ctx.fillRect(4, 25, p.w - 14, 3);
        ctx.restore();
    }

    /* junction box + illegally tapped wires */
    ctx.fillStyle = '#39424e';
    roundRectPath(ctx, -w / 2 + 7, 6, w - 14, 30, 3);
    ctx.fill();
    ctx.strokeStyle = '#151a21';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f0b429';
    ctx.fillRect(-w / 2 + 12, 12, 9, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-w / 2 + 26, 13, w - 40, 4);

    ctx.strokeStyle = '#15161a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.15, 36);
    ctx.bezierCurveTo(-w * 0.34, shaftH * 0.45, w * 0.2, shaftH * 0.65, -w * 0.05, shaftH);
    ctx.stroke();

    /* bamboo brace lashed to the shaft */
    const bx1 = w / 2 + 14, by1 = shaftH;              // foot on the ground
    const bx2 = -2, by2 = shaftH * 0.38;               // leans across the shaft
    ctx.strokeStyle = '#a99658';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,60,34,0.8)';            // bamboo nodes
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 3; i++) {
        const u = i / 4;
        const nx2 = bx1 + (bx2 - bx1) * u, ny2 = by1 + (by2 - by1) * u;
        const dx = (bx2 - bx1), dy = (by2 - by1), dl = Math.hypot(dx, dy);
        ctx.beginPath();
        ctx.moveTo(nx2 - dy / dl * 3.5, ny2 + dx / dl * 3.5);
        ctx.lineTo(nx2 + dy / dl * 3.5, ny2 - dx / dl * 3.5);
        ctx.stroke();
    }
    /* rope lashings */
    ctx.strokeStyle = '#6b4a2b';
    ctx.lineWidth = 3;
    for (const u of [0.45, 0.62]) {
        const lx = bx1 + (bx2 - bx1) * u, ly = by1 + (by2 - by1) * u;
        ctx.beginPath();
        ctx.moveTo(lx - 5, ly - 4); ctx.lineTo(lx + 5, ly + 4);
        ctx.moveTo(lx - 5, ly + 1); ctx.lineTo(lx + 5, ly + 9);
        ctx.stroke();
    }

    /* base rubble */
    ctx.fillStyle = '#7a7266';
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 6, shaftH + 6); ctx.lineTo(-w / 2 + 8, shaftH - 2); ctx.lineTo(-w / 2 + 14, shaftH + 8);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, shaftH + 8); ctx.lineTo(w / 2 + 2, shaftH); ctx.lineTo(w / 2 + 12, shaftH + 8);
    ctx.closePath(); ctx.fill();

    ctx.restore();
}

/* ------------------------------------------------------------
   Top pole: transformer cluster, crooked cross-arms, bamboo
   extension, fracture.  Pivot at gap tip (0 = wire attach point).
   ------------------------------------------------------------ */
function drawTopPole(ctx, o, t) {
    const shaftH = o.gapTop;
    if (shaftH <= 30) return;
    const w = POLE_W;
    const sway = Math.sin(t * 1.1 + o.phase * 1.7) * 0.010;

    ctx.save();
    ctx.translate(o.x + w / 2, o.gapTop);
    ctx.rotate(o.leanTop + sway);

    /* concrete shaft */
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, '#bfb7aa');
    g.addColorStop(0.35, '#a19889');
    g.addColorStop(0.75, '#7e766a');
    g.addColorStop(1, '#5f584e');
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2, -shaftH - 4, w, shaftH + 8);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-w / 2, -shaftH - 4, 5, shaftH + 8);
    ctx.fillRect(w / 2 - 5, -shaftH - 4, 5, shaftH + 8);

    /* stains + cracks */
    ctx.fillStyle = 'rgba(90,80,66,0.16)';
    for (const s of o.stainsTop) {
        ctx.beginPath();
        ctx.ellipse(-w / 2 + s[0], -shaftH + s[1], s[2], s[3], 0, 0, 6.2832);
        ctx.fill();
    }
    ctx.strokeStyle = 'rgba(52,45,38,0.5)';
    ctx.lineWidth = 1.5;
    for (const c of o.cracksTop) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + c[0], -shaftH + c[1]);
        ctx.lineTo(-w / 2 + c[2], -shaftH + c[3]);
        ctx.stroke();
    }

    /* fracture with rebar */
    if (shaftH > 120) {
        const fy = -shaftH * 0.52;
        ctx.fillStyle = 'rgba(24,20,16,0.8)';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 9, fy - 12);
        ctx.lineTo(w / 2 - 9, fy - 4);
        ctx.lineTo(w / 2 - 15, fy + 6);
        ctx.lineTo(-w / 2 + 11, fy);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#4a3f38';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 10, fy - 9); ctx.lineTo(w / 2 - 13, fy + 4);
        ctx.moveTo(-w / 2 + 11, fy - 4); ctx.lineTo(w / 2 - 12, fy + 9);
        ctx.stroke();
    }

    /* crooked cross-arms near the top */
    ctx.save();
    ctx.translate(0, -shaftH + 18);
    ctx.rotate(0.07);
    ctx.fillStyle = '#4a3f33';
    ctx.fillRect(-(w / 2 + 16), -4, w + 32, 8);
    ctx.strokeStyle = '#15161a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-(w / 2 + 16), -4, w + 32, 8);
    ctx.fillStyle = '#c9cdd3';
    for (const ix of [-(w / 2 + 8), 0, w / 2 + 8]) {
        ctx.beginPath(); ctx.arc(ix, -7, 2.4, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(0, -shaftH + 44);
    ctx.rotate(-0.11);
    ctx.fillStyle = '#443a2e';
    ctx.fillRect(-(w / 2 + 8), -3.5, w + 16, 7);
    ctx.strokeStyle = '#15161a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-(w / 2 + 8), -3.5, w + 16, 7);
    ctx.restore();

    /* bamboo extension lashed above the pole */
    ctx.strokeStyle = '#a99658';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(2, -shaftH + 4);
    ctx.lineTo(10, -shaftH - 42);
    ctx.stroke();
    ctx.strokeStyle = '#6b4a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, -shaftH + 8); ctx.lineTo(7, -shaftH + 2);
    ctx.moveTo(-3, -shaftH + 15); ctx.lineTo(8, -shaftH + 9);
    ctx.stroke();

    /* transformer can (rusty) near the tip */
    ctx.fillStyle = '#5b4a3f';
    roundRectPath(ctx, -w / 2 + 6, -66, w - 12, 44, 4);
    ctx.fill();
    ctx.strokeStyle = '#12161c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,140,80,0.35)';   // rust streaks
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 14, -62); ctx.lineTo(-w / 2 + 16, -28);
    ctx.moveTo(w / 2 - 18, -60); ctx.lineTo(w / 2 - 15, -30);
    ctx.stroke();
    /* warning sticker */
    ctx.fillStyle = '#f0b429';
    ctx.fillRect(-w / 2 + 10, -58, 15, 13);
    ctx.fillStyle = '#15161a';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 17.5, -56);
    ctx.lineTo(-w / 2 + 13, -48);
    ctx.lineTo(-w / 2 + 22, -48);
    ctx.closePath(); ctx.fill();

    /* bracket plate at the tip (wire attach) */
    ctx.fillStyle = '#404a57';
    ctx.fillRect(-w / 2 - 10, -16, w + 20, 14);
    ctx.fillStyle = '#262c35';
    ctx.fillRect(-w / 2 - 10, -4, w + 20, 4);

    ctx.restore();
}

/* ------------------------------------------------------------
   Wire bundle stroke (world x offset applied to local points)
   ------------------------------------------------------------ */
function strokeWire(ctx, pts, offx) {
    if (!pts || pts.length < 2) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#101114';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(offx + pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(offx + pts[i].x, pts[i].y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(150,160,180,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(offx + pts[0].x, pts[0].y - 1.5);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(offx + pts[i].x, pts[i].y - 1.5);
    ctx.stroke();
}

/* ------------------------------------------------------------
   The makeshift launch ramp: cracked concrete slab on steel
   legs, rebar sticking out, rickshaw-space graffiti.
   ------------------------------------------------------------ */
function drawLaunchRamp(ctx) {
    const bx = RAMP_BASE.x, by = RAMP_BASE.y;
    const tx = RAMP_TIP.x, ty = RAMP_TIP.y;
    const nx = -(ty - by), ny = tx - bx;           // normal (pointing up-left)
    const nl = Math.hypot(nx, ny);
    const ux = nx / nl * 15, uy = ny / nl * 15;    // slab half-thickness

    /* steel legs */
    ctx.strokeStyle = '#3a4048';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bx + 110, by - 62); ctx.lineTo(bx + 96, GROUND_Y + 8);
    ctx.moveTo(bx + 190, by - 96); ctx.lineTo(bx + 172, GROUND_Y + 8);
    ctx.stroke();

    /* slab */
    ctx.beginPath();
    ctx.moveTo(bx + ux, by + uy);
    ctx.lineTo(tx + ux, ty + uy);
    ctx.lineTo(tx - ux, ty - uy);
    ctx.lineTo(bx - ux, by - uy);
    ctx.closePath();
    let g = ctx.createLinearGradient(bx, by, tx, ty);
    g.addColorStop(0, '#8d857a');
    g.addColorStop(0.5, '#a49b8e');
    g.addColorStop(1, '#b8afa1');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* slab cracks */
    ctx.strokeStyle = 'rgba(40,34,28,0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 70, by - 4); ctx.lineTo(bx + 84, by + 8);
    ctx.moveTo(bx + 150, by - 34); ctx.lineTo(bx + 166, by - 22);
    ctx.stroke();

    /* rebar sticking out of the lip */
    ctx.strokeStyle = '#6b4a2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx - ux, ty - uy); ctx.lineTo(tx - ux + 14, ty - uy - 4);
    ctx.moveTo(tx - ux + 2, ty - uy + 5); ctx.lineTo(tx - ux + 18, ty - uy + 7);
    ctx.stroke();

    /* graffiti on the slab side */
    ctx.save();
    ctx.translate(bx + 118, by - 46);
    ctx.rotate(RAMP_ANGLE);
    ctx.font = 'bold 15px "Nirmala UI","SolaimanLipi","Segoe UI",sans-serif';
    ctx.fillStyle = 'rgba(255,93,143,0.9)';
    ctx.fillText('রিকশা স্পেস', 0, 0);
    ctx.font = 'bold 11px "Segoe UI",sans-serif';
    ctx.fillStyle = 'rgba(76,201,240,0.85)';
    ctx.fillText('ELON WHO?', 6, 16);
    ctx.restore();
}
