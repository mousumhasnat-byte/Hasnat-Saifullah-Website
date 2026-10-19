'use strict';
/* ============================================================
   Flying Tesla of BD — the flying rickshaw (player)
   Gravity + tap impulse + velocity tilt + plasma/smoke effects
   ============================================================ */

const Player = {
    x: PLAYER_X,
    y: H * 0.42,
    vy: 0,
    rot: 0,
    alive: true,
    thrust: 0,
    spin: 0,           // wheel rotation
    flapCount: 0,      // for the comedic soot sputter
    nextSputter: 4,

    reset() {
        this.x = PLAYER_X;
        this.y = H * 0.42;
        this.vy = 0;
        this.rot = 0;
        this.alive = true;
        this.thrust = 0;
        this.spin = 0;
        this.flapCount = 0;
        this.nextSputter = 3 + (Math.random() * 5 | 0);
    },

    flap() {
        if (!this.alive) return;
        this.vy = FLAP_VY;
        this.rot = -0.5;
        this.thrust = 1;
        Sfx.flap();

        // blue plasma puffs from the nozzle
        for (let i = 0; i < 6; i++) {
            Particles.push({
                x: this.x - 30 - Math.random() * 24,
                y: this.y + 6 + Math.random() * 8,
                vx: -130 - Math.random() * 170,
                vy: 30 + Math.random() * 90,
                life: 0, max: 0.25 + Math.random() * 0.2,
                r: 2.5 + Math.random() * 3,
                col: Math.random() < 0.5 ? '#7ccdff' : '#2b6cff',
                grav: 0, grow: 0
            });
        }
        // gray exhaust smoke
        for (let i = 0; i < 4; i++) {
            Particles.push({
                x: this.x - 34 - Math.random() * 18,
                y: this.y + 4 + Math.random() * 10,
                vx: -80 - Math.random() * 90,
                vy: -10 - Math.random() * 40,
                life: 0, max: 0.5 + Math.random() * 0.45,
                r: 3 + Math.random() * 3,
                col: 'rgba(122,122,132,0.55)',
                grav: -20, grow: 14
            });
        }

        // comedic black-soot sputter every few flaps ("held together with hope")
        this.flapCount++;
        if (this.flapCount >= this.nextSputter) {
            this.flapCount = 0;
            this.nextSputter = 3 + (Math.random() * 5 | 0);
            for (let i = 0; i < 10; i++) {
                const a = -0.6 - Math.random() * 1.6;
                Particles.push({
                    x: this.x - 36,
                    y: this.y + 2,
                    vx: Math.cos(a) * (50 + Math.random() * 120),
                    vy: Math.sin(a) * (40 + Math.random() * 80),
                    life: 0, max: 0.6 + Math.random() * 0.5,
                    r: 3 + Math.random() * 4,
                    col: 'rgba(35,35,40,0.7)',
                    grav: -40, grow: 16
                });
            }
            if (typeof addShake === 'function') addShake(3);
        }
    },

    /* powered=true: normal flight; false: post-death tumble */
    update(dt, powered) {
        if (powered) {
            this.vy += GRAVITY * dt;
            if (this.vy > MAX_FALL) this.vy = MAX_FALL;
        }
        this.y += this.vy * dt;

        if (this.y < PLAYER_R && powered) {
            this.y = PLAYER_R;
            if (this.vy < 0) this.vy = 0;
        }

        const target = clamp(this.vy / 600, -0.5, 1.15);
        this.rot += (target - this.rot) * (1 - Math.exp(-8 * dt));

        this.thrust = Math.max(0, this.thrust - dt * 3.2);
        this.spin += dt * (powered ? (6 + this.thrust * 22) : 2);

        // continuous smoky exhaust while thrusting
        if (powered && this.thrust > 0.4 && Math.random() < 0.55) {
            Particles.push({
                x: this.x - 32,
                y: this.y + 8,
                vx: -50 - Math.random() * 60,
                vy: 10 + Math.random() * 40,
                life: 0, max: 0.35 + Math.random() * 0.25,
                r: 2.5 + Math.random() * 2.5,
                col: 'rgba(140,140,150,0.5)',
                grav: -30, grow: 12
            });
        }
    },

    draw(ctx, t) {
        drawRickshaw(ctx, this.x, this.y, this.rot, this.alive ? this.thrust : 0, t, this.spin);
    }
};
