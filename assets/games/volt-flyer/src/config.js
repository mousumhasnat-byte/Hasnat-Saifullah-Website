'use strict';
/* ============================================================
   Flying Tesla of BD — Mission Impossible
   shared config & tiny math helpers
   Logical resolution is fixed; canvas is scaled to fit screen.
   ============================================================ */

const TITLE_L1 = 'FLYING TESLA OF BD';
const TITLE_L2 = 'MISSION IMPOSSIBLE';

const W = 450, H = 800;          // logical resolution
const GROUND_H = 70;             // road strip height
const GROUND_Y = H - GROUND_H;   // y of road surface (= kill line)

const PLAYER_X = 132;            // fixed horizontal seat of the car
const PLAYER_R = 16;             // collision circle radius

const GRAVITY = 2000;            // px/s^2
const FLAP_VY = -480;            // impulse on tap (hop height ~58px)
const MAX_FALL = 700;            // terminal velocity

const BASE_SPEED = 150;          // world scroll px/s
const SPEED_PER_SCORE = 3.5;
const MAX_SPEED = 275;

const BASE_GAP = 215;            // vertical gap between poles at score 0
const GAP_PER_SCORE = 2;
const MIN_GAP = 158;

const SPAWN_SPACING = 230;       // horizontal distance between pole pairs
const POLE_W = 66;               // pole width

const TOP_SAG_MAX = 0.22;        // top wires hang at most 22% of gap
const BOT_SAG_MAX = 0.10;        // bottom wires rise at most 10% of gap

const MENU_SCROLL = 70;          // background speed on menu
const HI_KEY = 'voltflyer_hi_v1';

/* ---- launch sequence (menu/dead -> ramp -> liftoff -> playing) ---- */
const RAMP_BASE = { x: -12, y: GROUND_Y + 10 };   // ramp foot (off left edge)
const RAMP_TIP = { x: 218, y: GROUND_Y - 142 };   // ramp lip
const RAMP_ANGLE = Math.atan2(RAMP_BASE.y - RAMP_TIP.y, RAMP_TIP.x - RAMP_BASE.x); // nose-up rad
const IGN_TIME = 0.7;            // thruster ignition on the ramp
const RAMP_TIME = 1.4;           // rickshaw has slid up the ramp
const LIFT_MAX = 3.0;            // absolute launch cutoff (s)
const LIFT_VY = -820;            // liftoff impulse (rise ~168px)
const LIFT_END_Y = 440;          // airborne at this height -> playing
const SKIP_AFTER = 0.25;         // 2nd tap after this skips the launch

/* ---- lethal pole-to-pole wire spans ---- */
const SPAN_SAG_MIN = 30;         // catenary sag bounds (px below tip line)
const SPAN_SAG_MAX = 55;
const SPAN_CLIMB_MAX = 90;       // max |cyB - cyA| between linked poles (fair climb)
const SPAN_R = PLAYER_R + 3;     // wire collision half-thickness
const MIN_CORRIDOR = 44;         // guaranteed clear vertical lane (px)

/* load shedding (Dhaka style): the grid dies, the rickshaw autopilots */
const LOADSHED_FIRST = 5;        // very first event after this many pillars
const LOADSHED_MIN = 10;         // gap between events: randomly 10 ...
const LOADSHED_MAX = 15;         // ... or 15 pillars of normal play
const LOADSHED_PILLARS = 5;      // event length: autopilot for this many pillars

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }

/* Quadratic bezier sample points */
function quadPts(x1, y1, cx, cy, x2, y2, n) {
    n = n || 10;
    const out = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        out.push({
            x: u * u * x1 + 2 * u * t * cx + t * t * x2,
            y: u * u * y1 + 2 * u * t * cy + t * t * y2
        });
    }
    return out;
}

/* Distance from point to segment */
function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* Circle vs axis-aligned rect overlap */
function circleRect(cx, cy, r, x, y, w, h) {
    const nx = clamp(cx, x, x + w);
    const ny = clamp(cy, y, y + h);
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
}

/* Deterministic PRNG for background tiles (stable between renders) */
function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/* Difficulty curves */
function gameSpeed(score) { return Math.min(MAX_SPEED, BASE_SPEED + score * SPEED_PER_SCORE); }
function gameGap(score) { return Math.max(MIN_GAP, BASE_GAP - score * GAP_PER_SCORE); }
