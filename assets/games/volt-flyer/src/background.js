'use strict';
/* ============================================================
   Flying Tesla of BD — 3-layer parallax background
   Layer 1 (far): dusty sunset skyline            scroll 0.15x
   Layer 1b:      distant pole-and-wire network   scroll 0.30x
                  (nearest-neighbour + long far spans)
   Layer 2 (mid):  neon shop-sign strip           scroll 0.45x
   Layer 3 (near): dusty road with dashes         scroll 1.00x
   Tiles are baked once into offscreen canvases.
   ============================================================ */

const Bg = (() => {
    const FAR_W = 900, FAR_H = 320;
    const MID_W = 900, MID_H = 122;
    const POLE_W2 = 900, POLE_H = 300;      // distant pole layer tile

    let farTile = null, midTile = null, poleTile = null;
    let skyGrad = null, sunGlow = null, hazeGrad = null;
    let offFar = 0, offMid = 0, offGround = 0, offPole = 0;

    const dustSpecks = (() => {
        const r = mulberry32(1337);
        const arr = [];
        for (let i = 0; i < 40; i++) {
            arr.push({ x: r() * FAR_W, y: GROUND_Y - 6 - r() * 50, a: 0.05 + r() * 0.12, s: 1 + r() * 2.2 });
        }
        return arr;
    })();

    function buildFar() {
        const cv = document.createElement('canvas');
        cv.width = FAR_W; cv.height = FAR_H;
        const c = cv.getContext('2d');
        const r = mulberry32(42);

        let x = -30;
        while (x < FAR_W + 40) {
            const bw = 46 + r() * 78;
            const bh = 90 + r() * 215;
            const y = FAR_H - bh;
            const shade = 0.55 + r() * 0.35;
            const col = `rgba(${Math.floor(88 * shade)},${Math.floor(70 * shade)},${Math.floor(115 * shade)},1)`;
            // draw twice for seamless wrap
            for (const dx of [x, x - FAR_W]) {
                c.fillStyle = col;
                c.fillRect(dx, y, bw, bh);
                // roof clutter
                c.fillRect(dx + bw * 0.2, y - 8, bw * 0.25, 8);
                // antenna
                if (r() > 0.5) {
                    c.fillRect(dx + bw * 0.65, y - 26, 2, 26);
                }
                // hazy windows
                c.fillStyle = 'rgba(255,214,150,0.10)';
                for (let wy = y + 12; wy < FAR_H - 14; wy += 22) {
                    for (let wx = dx + 8; wx < dx + bw - 12; wx += 18) {
                        if (r() > 0.55) c.fillRect(wx, wy, 7, 9);
                    }
                }
            }
            x += bw + 8 + r() * 26;
        }
        return cv;
    }

    function buildMid() {
        const cv = document.createElement('canvas');
        cv.width = MID_W; cv.height = MID_H;
        const c = cv.getContext('2d');
        const r = mulberry32(777);

        // base dark band (just above the road)
        c.fillStyle = '#221c2e';
        c.fillRect(0, 40, MID_W, MID_H - 40);

        // shop fronts
        let x = -10;
        while (x < MID_W + 30) {
            const sw = 70 + r() * 90;
            const sh = 52 + r() * 42;
            const y = MID_H - sh;
            for (const dx of [x, x - MID_W]) {
                c.fillStyle = '#2c2438';
                c.fillRect(dx, y, sw, sh);
                // awning
                c.fillStyle = r() > 0.5 ? '#3f3450' : '#4a3141';
                c.beginPath();
                c.moveTo(dx - 4, y);
                c.lineTo(dx + sw + 4, y);
                c.lineTo(dx + sw - 4, y + 12);
                c.lineTo(dx + 4, y + 12);
                c.closePath();
                c.fill();
                // glowing doorway
                c.fillStyle = 'rgba(255,205,130,0.28)';
                c.fillRect(dx + sw * 0.35, y + 18, sw * 0.3, sh - 18);
            }
            x += sw + 6 + r() * 20;
        }

        // neon signs (drawn twice for seamless wrap)
        const signs = [
            { x: 30, w: 150, y: 32, h: 30, col: '#ff5d8f', text: 'INVERTER TEA STALL' },
            { x: 215, w: 165, y: 38, h: 30, col: '#4cc9f0', text: 'ROOF-WIRE GARAGE' },
            { x: 425, w: 155, y: 32, h: 28, col: '#ffd166', text: 'CHARGING: TK 20!' },
            { x: 615, w: 175, y: 36, h: 32, col: '#90e0a0', text: 'রিকশা অটোপাইলট' },
            { x: 805, w: 130, y: 32, h: 28, col: '#c77dff', text: 'বিজলি অফিস: সরি' },
            { x: 40, w: 150, y: 74, h: 26, col: '#ff9f6e', text: 'MOONLIGHT SALON' },
            { x: 640, w: 150, y: 76, h: 26, col: '#74c0fc', text: 'MIND THE CABLES' }
        ];
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        for (const s of signs) {
            for (const dx of [s.x, s.x - MID_W]) {
                c.save();
                c.shadowColor = s.col;
                c.shadowBlur = 16;
                c.fillStyle = 'rgba(10,8,16,0.9)';
                c.fillRect(dx, s.y, s.w, s.h);
                c.strokeStyle = s.col;
                c.lineWidth = 2;
                c.strokeRect(dx + 1, s.y + 1, s.w - 2, s.h - 2);
                c.fillStyle = s.col;
                c.font = 'bold 16px "Nirmala UI","SolaimanLipi","Segoe UI",sans-serif';
                c.fillText(s.text, dx + s.w / 2, s.y + s.h / 2 + 1, s.w - 12);
                c.restore();
            }
        }
        return cv;
    }

    /* Distant utility-pole layer: thin leaning poles with cross-arms,
       wired nearest-neighbour + long far spans (seamless 900px tile). */
    function buildPoles() {
        const cv = document.createElement('canvas');
        cv.width = POLE_W2; cv.height = POLE_H;
        const c = cv.getContext('2d');
        const r = mulberry32(2026);

        // pole positions along the tile
        const poles = [];
        let x = 20;
        while (x < POLE_W2) {
            poles.push({ x: x, top: 60 + r() * 90, lean: (r() - 0.5) * 0.10 });
            x += 110 + r() * 90;
        }

        const dark = 'rgba(38,28,50,0.95)';
        // shafts + cross-arms (drawn twice for seamless wrap)
        for (const p of poles) {
            for (const dx of [p.x, p.x - POLE_W2]) {
                c.save();
                c.translate(dx, POLE_H);
                c.rotate(p.lean);
                c.strokeStyle = dark;
                c.lineWidth = 7;
                c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -(POLE_H - p.top)); c.stroke();
                c.lineWidth = 4;
                c.beginPath();
                c.moveTo(-16, -(POLE_H - p.top) + 14); c.lineTo(16, -(POLE_H - p.top) + 14);
                c.moveTo(-12, -(POLE_H - p.top) + 36); c.lineTo(12, -(POLE_H - p.top) + 36);
                c.stroke();
                c.restore();
            }
        }

        // wires: nearest-neighbour catenaries + long far spans
        c.strokeStyle = 'rgba(30,22,42,0.9)';
        c.lineWidth = 2.2;
        for (let i = 0; i < poles.length; i++) {
            const a = poles[i];
            const near = poles[i + 1] || { ...poles[0], x: poles[0].x + POLE_W2 };
            const far = poles[i + 2] || { ...poles[0], x: poles[0].x + POLE_W2 };
            const spans = [
                [a.x, a.top, near.x, near.top, 18 + r() * 14],
                [a.x, a.top + 22, far.x, far.top + 22, 30 + r() * 26]
            ];
            for (const [x1, y1, x2, y2, sag] of spans) {
                for (const dx of [0, -POLE_W2]) {
                    c.beginPath();
                    c.moveTo(x1 + dx, y1);
                    c.quadraticCurveTo((x1 + x2) / 2 + dx, (y1 + y2) / 2 + 2 * sag, x2 + dx, y2);
                    c.stroke();
                }
            }
        }
        return cv;
    }

    return {
        update(dt, speed) {
            offFar += speed * 0.15 * dt;
            offPole += speed * 0.30 * dt;
            offMid += speed * 0.45 * dt;
            offGround += speed * dt;
        },
        draw(ctx) {
            if (!farTile) { farTile = buildFar(); midTile = buildMid(); poleTile = buildPoles(); }
            if (!skyGrad) {
                skyGrad = ctx.createLinearGradient(0, 0, 0, H);
                skyGrad.addColorStop(0, '#39305f');
                skyGrad.addColorStop(0.3, '#6e4270');
                skyGrad.addColorStop(0.55, '#b4654e');
                skyGrad.addColorStop(0.78, '#e0964f');
                skyGrad.addColorStop(0.92, '#f2c078');
                sunGlow = ctx.createRadialGradient(345, 320, 10, 345, 320, 150);
                sunGlow.addColorStop(0, 'rgba(255,224,168,0.95)');
                sunGlow.addColorStop(0.25, 'rgba(255,196,130,0.55)');
                sunGlow.addColorStop(1, 'rgba(255,180,110,0)');
                hazeGrad = ctx.createLinearGradient(0, GROUND_Y - 260, 0, GROUND_Y);
                hazeGrad.addColorStop(0, 'rgba(255,200,140,0)');
                hazeGrad.addColorStop(1, 'rgba(255,190,130,0.42)');
            }

            /* sky + sun */
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = sunGlow;
            ctx.fillRect(150, 160, 390, 340);

            /* far skyline */
            const dxFar = -(offFar % FAR_W);
            const farTop = GROUND_Y - FAR_H;
            ctx.drawImage(farTile, dxFar, farTop);
            ctx.drawImage(farTile, dxFar + FAR_W, farTop);

            /* haze over skyline */
            ctx.fillStyle = hazeGrad;
            ctx.fillRect(0, GROUND_Y - 260, W, 260);

            /* distant pole + wire network */
            const dxPole = -(offPole % POLE_W2);
            const poleTop = GROUND_Y - POLE_H;
            ctx.drawImage(poleTile, dxPole, poleTop);
            ctx.drawImage(poleTile, dxPole + POLE_W2, poleTop);

            /* mid neon strip */
            const dxMid = -(offMid % MID_W);
            const midTop = GROUND_Y - MID_H;
            ctx.drawImage(midTile, dxMid, midTop);
            ctx.drawImage(midTile, dxMid + MID_W, midTop);

            /* road */
            let rg = ctx.createLinearGradient(0, GROUND_Y, 0, H);
            rg.addColorStop(0, '#4a4550');
            rg.addColorStop(1, '#312d38');
            ctx.fillStyle = rg;
            ctx.fillRect(0, GROUND_Y, W, GROUND_H);

            /* curb: yellow/black stripes */
            ctx.fillStyle = '#e9c46a';
            ctx.fillRect(0, GROUND_Y, W, 6);
            const cw = 30;
            const oc = offGround % (cw * 2);
            ctx.fillStyle = '#17181c';
            for (let x = -oc; x < W; x += cw * 2) ctx.fillRect(x, GROUND_Y, cw, 6);

            /* dashed centre line */
            const dw = 46, gap = 40, period = dw + gap;
            const od = offGround % period;
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for (let x = -od; x < W; x += period) ctx.fillRect(x, GROUND_Y + 42, dw, 5);

            /* dust specks near the road */
            const og = offGround % FAR_W;
            ctx.fillStyle = '#f2c078';
            for (const d of dustSpecks) {
                let sx = d.x - og;
                if (sx < 0) sx += FAR_W;
                ctx.globalAlpha = d.a;
                ctx.fillRect(sx, d.y, d.s, d.s);
            }
            ctx.globalAlpha = 1;
        }
    };
})();
