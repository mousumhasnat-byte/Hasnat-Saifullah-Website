'use strict';
/* ============================================================
   Flying Tesla of BD — obstacles

   Top:    transformer-cluster pole (crooked cross-arms, rusty
           can, bamboo extension); sagging wire loops hang into
           the gap (max TOP_SAG_MAX of gap height).
   Bottom: fractured concrete pole (rebar, bamboo brace, posters,
           junction box); wire loops rise (max BOT_SAG_MAX).
   Spans:  each pole is linked to the PREVIOUS pole by a lethal
           catenary span (nearest-neighbour tangle).  Fairness:
           gap centres are clamped to SPAN_CLIMB_MAX so the
           rickshaw can always climb the span, sag is capped, and
           the corridor is re-verified at spawn (fallback: no
           span).
   Hitboxes: box for pole bodies, sampled line segments
   (radius PLAYER_R + 3) for every wire + span.
   ============================================================ */

const Obstacles = {
    list: [],

    reset() {
        this.list.length = 0;
    },

    /* ---- spawning ---- */
    spawn(score) {
        const h = gameGap(score);
        const prev = this.list[this.list.length - 1] || null;

        // vertical placement; linked poles are clamped so the climb is feasible
        const minCy = h / 2 + 110;
        const maxCy = GROUND_Y - h / 2 - 64;
        let cy = minCy + Math.random() * Math.max(1, maxCy - minCy);
        if (prev) cy = clamp(cy, prev.cy - SPAN_CLIMB_MAX, prev.cy + SPAN_CLIMB_MAX);
        const gapTop = cy - h / 2;
        const gapBottom = cy + h / 2;

        const o = {
            x: Math.max(W + 40, prev ? prev.x + SPAWN_SPACING : W + 40),
            w: POLE_W,
            h: h,
            cy: cy,
            gapTop: gapTop,
            gapBottom: gapBottom,
            scored: false,
            wires: [],           // local-coordinate polylines (nests)
            span: null,          // local-coordinate polyline back to prev pole
            topSagMax: 0,
            botSagMax: 0,
            leanTop: (Math.random() - 0.5) * 0.09,
            leanBot: (Math.random() - 0.5) * 0.10,
            phase: Math.random() * 6.2832,
            cracks: [], stains: [], posters: [],
            cracksTop: [], stainsTop: []
        };

        /* --- deco: bottom pole (y measured from the gap tip) --- */
        for (let i = 0; i < 6; i++) {
            const y1 = 20 + Math.random() * Math.max(10, (GROUND_Y - gapBottom) - 40);
            o.cracks.push([
                6 + Math.random() * (POLE_W - 12), y1,
                6 + Math.random() * (POLE_W - 12), y1 + 14 + Math.random() * 40
            ]);
        }
        for (let i = 0; i < 4; i++) {
            o.stains.push([
                6 + Math.random() * (POLE_W - 12),
                16 + Math.random() * Math.max(10, (GROUND_Y - gapBottom) - 32),
                5 + Math.random() * 12, 8 + Math.random() * 22
            ]);
        }
        const botH = GROUND_Y - gapBottom;
        const posterCols = ['#e8e3d3', '#d9e8d0', '#f3d9c5', '#d5e2ef', '#f0e6a8'];
        const nPosters = botH > 150 ? (1 + (Math.random() * 2 | 0)) : 0;
        for (let i = 0; i < nPosters; i++) {
            o.posters.push({
                x: 8 + Math.random() * (POLE_W - 32),
                y: botH - 130 - Math.random() * Math.max(10, botH * 0.3),
                w: 16 + Math.random() * 12,
                h: 26 + Math.random() * 12,
                rot: (Math.random() - 0.5) * 0.16,
                color: posterCols[(Math.random() * posterCols.length) | 0]
            });
        }

        /* --- deco: top pole (y measured from screen top) --- */
        for (let i = 0; i < 5; i++) {
            const y1 = 14 + Math.random() * Math.max(10, gapTop - 80);
            o.cracksTop.push([
                6 + Math.random() * (POLE_W - 12), y1,
                6 + Math.random() * (POLE_W - 12), y1 + 10 + Math.random() * 34
            ]);
        }
        for (let i = 0; i < 3; i++) {
            o.stainsTop.push([
                6 + Math.random() * (POLE_W - 12),
                10 + Math.random() * Math.max(10, gapTop - 70),
                5 + Math.random() * 10, 8 + Math.random() * 20
            ]);
        }

        /* --- top wire loops off the bracket --- */
        const nTop = 4 + (Math.random() * 2 | 0);
        for (let i = 0; i < nTop; i++) {
            const midX = 8 + (i + 0.5) * (POLE_W - 16) / nTop + (Math.random() - 0.5) * 8;
            const spread = 12 + Math.random() * 12;
            const sagFrac = 0.16 + Math.random() * (TOP_SAG_MAX - 0.16);
            if (sagFrac > o.topSagMax) o.topSagMax = sagFrac;
            const yA = gapTop;
            o.wires.push(quadPts(midX - spread, yA, midX, yA + 2 * sagFrac * h, midX + spread, yA, 12));
        }

        /* --- bottom wire loops off the junction box --- */
        const nBot = 2 + (Math.random() * 2 | 0);
        for (let i = 0; i < nBot; i++) {
            const midX = 12 + (i + 0.5) * (POLE_W - 24) / nBot + (Math.random() - 0.5) * 6;
            const spread = 14 + Math.random() * 10;
            const sagFrac = 0.05 + Math.random() * (BOT_SAG_MAX - 0.05);
            if (sagFrac > o.botSagMax) o.botSagMax = sagFrac;
            const yA = gapBottom;
            o.wires.push(quadPts(midX - spread, yA, midX, yA - 2 * sagFrac * h, midX + spread, yA, 12));
        }

        /* --- lethal span back to the previous pole's tip --- */
        if (prev) {
            const x1 = (prev.x + prev.w / 2) - o.x;   // prev tip, local to new pole
            const y1 = prev.gapTop;
            const x2 = o.w / 2, y2 = gapTop;
            const sag0 = SPAN_SAG_MIN + Math.random() * (SPAN_SAG_MAX - SPAN_SAG_MIN);
            const mk = (s) => quadPts(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2 + 2 * s, x2, y2, 18);
            for (const s of [sag0, sag0 * 0.5, sag0 * 0.25]) {
                const pts = mk(s);
                if (this.corridorOK(pts, o, prev)) { o.span = pts; break; }
            }
            // no variant passed -> no span between this pair (fair fallback)
        }

        this.list.push(o);
    },

    /* Guaranteed clear lane between the span above and everything below,
       for BOTH poles' nests — plus the hop-arc tap rule: a tap taken at
       the floor apexes 66px further along (max speed × 0.24s), so that
       landing point must clear the span too, or the spot is a death
       trap no human could fly. */
    corridorOK(spanPts, o, prev) {
        const HOP_ADV = 66;
        const x0 = spanPts[0].x, xEnd = spanPts[spanPts.length - 1].x;
        const wireY = (xq) => {
            const x = Math.max(x0, Math.min(xEnd, xq));
            if (x <= spanPts[0].x) return spanPts[0].y;
            for (let j = 0; j < spanPts.length - 1; j++) {
                const a = spanPts[j], b = spanPts[j + 1];
                if (x >= a.x && x <= b.x) {
                    return a.y + (b.y - a.y) * ((x - a.x) / Math.max(1e-6, b.x - a.x));
                }
            }
            return spanPts[spanPts.length - 1].y;
        };
        for (let i = 0; i <= 14; i++) {
            const xLocal = x0 + (xEnd - x0) * (i / 14);
            const worldX = o.x + xLocal;
            let ceiling = wireY(xLocal) + SPAN_R;
            let floor = GROUND_Y - PLAYER_R;
            if (worldX >= o.x - PLAYER_R && worldX <= o.x + o.w + PLAYER_R) {
                ceiling = Math.min(ceiling, o.gapTop + o.topSagMax * o.h + PLAYER_R);
                floor = o.gapBottom - o.botSagMax * o.h - PLAYER_R;
            }
            if (prev && worldX >= prev.x - PLAYER_R && worldX <= prev.x + prev.w + PLAYER_R) {
                ceiling = Math.min(ceiling, prev.gapTop + prev.topSagMax * prev.h + PLAYER_R);
                floor = Math.min(floor, prev.gapBottom - prev.botSagMax * prev.h - PLAYER_R);
            }
            if (floor - ceiling < MIN_CORRIDOR) return false;
            if (floor < Math.max(wireY(xLocal), wireY(xLocal + HOP_ADV)) + 77 + 4) return false;
        }
        return true;
    },

    /* ---- per-frame update: move, spawn, score, collide ---- */
    update(dt, speed, score, onScored) {
        const last = this.list[this.list.length - 1];
        if (!last || last.x < W - SPAWN_SPACING) this.spawn(score);

        let hit = false;
        for (const o of this.list) {
            o.x -= speed * dt;

            if (!o.scored && o.x + o.w < Player.x - PLAYER_R) {
                o.scored = true;
                if (onScored) onScored();
            }
            if (this.collide(o, Player)) hit = true;
        }
        while (this.list.length && this.list[0].x < -POLE_W - 320) this.list.shift(); // keep spans drawable
        return hit;
    },

    collide(o, p) {
        /* concrete pole bodies only — the electric wires (nest loops,
           junction loops, pole-to-pole spans) are decorative now: the
           rickshaw flies straight through them */
        if (circleRect(p.x, p.y, PLAYER_R, o.x, -4, POLE_W, o.gapTop + 4)) return true;
        if (circleRect(p.x, p.y, PLAYER_R, o.x, o.gapBottom, POLE_W, GROUND_Y - o.gapBottom)) return true;
        return false;
    },

    draw(ctx, t) {
        for (const o of this.list) {
            if (o.span) strokeWire(ctx, o.span, o.x);   // spans under everything
        }
        for (const o of this.list) {
            drawTopPole(ctx, o, t);
            drawBottomPole(ctx, o, t);
            for (const pts of o.wires) strokeWire(ctx, pts, o.x);
        }
    }
};
