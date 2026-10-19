'use strict';
/* ============================================================
   Flying Tesla of BD — audio (all SFX synthesized with WebAudio,
   zero audio files).  Ambient transformer hum + random
   rickshaw-horn honks for the Desi street vibe; every flap
   rings the rickshaw bell.
   ============================================================ */

const Sfx = (() => {
    let ctx = null, master = null, noiseBuf = null;
    let humStarted = false, hornTimer = null, muted = false;

    function ensure() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!ctx) {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = muted ? 0 : 1;
            master.connect(ctx.destination);
            noiseBuf = makeNoise();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function makeNoise() {
        const len = Math.floor(ctx.sampleRate * 1.0);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    function noiseSrc() {
        const s = ctx.createBufferSource();
        s.buffer = noiseBuf;
        return s;
    }

    /* --- low transformer hum, starts once --- */
    function startHum() {
        if (humStarted) return;
        humStarted = true;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 220;
        const g = ctx.createGain();
        g.gain.value = 0.05;
        lp.connect(g); g.connect(master);

        const o1 = ctx.createOscillator();
        o1.type = 'sawtooth';
        o1.frequency.value = 50;
        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = 100.7;
        o1.connect(lp); o2.connect(lp);
        o1.start(); o2.start();
    }

    /* --- random distant horn honks --- */
    function scheduleHorn() {
        if (hornTimer) return;
        const tick = () => {
            hornTimer = setTimeout(() => {
                if (ctx && ctx.state === 'running' && Math.random() < 0.75) horn();
                tick();
            }, 5000 + Math.random() * 8000);
        };
        tick();
    }

    function horn() {
        const t = ctx.currentTime;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.035, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        g.connect(master);
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(415, t);
        o.frequency.linearRampToValueAtTime(395, t + 0.3);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1200;
        o.connect(lp); lp.connect(g);
        o.start(t); o.stop(t + 0.4);
    }

    /* --- rickshaw handlebar bell: sharp metallic ting --- */
    function bellPing(t, freq, vol) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        g.connect(master);
        for (const [f, v] of [[freq, 1], [freq * 2.76, 0.4], [freq * 5.4, 0.18]]) {
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = f;
            const og = ctx.createGain();
            og.gain.value = v;
            o.connect(og); og.connect(g);
            o.start(t); o.stop(t + 0.34);
        }
    }

    return {
        init() {
            if (!ensure()) return;
            startHum();
            scheduleHorn();
        },
        toggleMute() {
            muted = !muted;
            if (master) master.gain.value = muted ? 0 : 1;
            return muted;
        },
        get muted() { return muted; },

        /* bicycle bell on flap: "cring-cring" — two bright metallic rings,
           the second slightly lower like the clapper bouncing back */
        flap() {
            if (!ensure()) return;
            const t = ctx.currentTime;
            bellPing(t, 2093, 0.30);          // cring!
            bellPing(t + 0.11, 1760, 0.22);   // cring!
        },

        /* double bell ring on scoring a pole */
        score() {
            if (!ensure()) return;
            const t = ctx.currentTime;
            bellPing(t, 1320, 0.14);
            bellPing(t + 0.10, 1760, 0.12);
        },

        /* launch rumble: igniting the thruster rig on the ramp */
        launch() {
            if (!ensure()) return;
            const t = ctx.currentTime;

            // deep noise rumble
            const n = noiseSrc();
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(180, t);
            lp.frequency.linearRampToValueAtTime(700, t + 0.7);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
            g.gain.setValueAtTime(0.5, t + 0.55);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
            n.connect(lp); lp.connect(g); g.connect(master);
            n.start(t); n.stop(t + 1.35);

            // rising jet whoosh
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(60, t);
            o.frequency.exponentialRampToValueAtTime(240, t + 0.9);
            const lp2 = ctx.createBiquadFilter();
            lp2.type = 'lowpass';
            lp2.frequency.value = 900;
            const g2 = ctx.createGain();
            g2.gain.setValueAtTime(0.0001, t);
            g2.gain.exponentialRampToValueAtTime(0.14, t + 0.25);
            g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
            o.connect(lp2); lp2.connect(g2); g2.connect(master);
            o.start(t); o.stop(t + 1.15);
        },

        /* load shed: inverter "beep-beep", breaker clunks, the grid powers down */
        brownout() {
            if (!ensure()) return;
            const t = ctx.currentTime;

            // inverter/UPS alarm — the classic "power gone" cue
            for (let i = 0; i < 2; i++) {
                const b = ctx.createOscillator();
                b.type = 'square';
                b.frequency.value = 1046;
                const bg = ctx.createGain();
                bg.gain.setValueAtTime(0.0001, t + i * 0.18);
                bg.gain.exponentialRampToValueAtTime(0.13, t + i * 0.18 + 0.01);
                bg.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.11);
                b.connect(bg); bg.connect(master);
                b.start(t + i * 0.18); b.stop(t + i * 0.18 + 0.13);
            }

            // breaker trip thump
            const th = ctx.createOscillator();
            th.type = 'sine';
            th.frequency.setValueAtTime(120, t);
            th.frequency.exponentialRampToValueAtTime(42, t + 0.14);
            const tg = ctx.createGain();
            tg.gain.setValueAtTime(0.5, t);
            tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
            th.connect(tg); tg.connect(master);
            th.start(t); th.stop(t + 0.2);

            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(120, t);
            o.frequency.exponentialRampToValueAtTime(38, t + 0.7);
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(600, t);
            lp.frequency.exponentialRampToValueAtTime(90, t + 0.7);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
            o.connect(lp); lp.connect(g); g.connect(master);
            o.start(t); o.stop(t + 0.8);
            const c = ctx.createOscillator();
            c.type = 'square';
            c.frequency.value = 90;
            const cg = ctx.createGain();
            cg.gain.setValueAtTime(0.10, t + 0.68);
            cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.78);
            c.connect(cg); cg.connect(master);
            c.start(t + 0.68); c.stop(t + 0.8);
        },

        /* power returns: relay clacks twice + a rising mains hum */
        powerOn() {
            if (!ensure()) return;
            const t = ctx.currentTime;
            for (let i = 0; i < 2; i++) {
                const c = ctx.createOscillator();
                c.type = 'square';
                c.frequency.value = 120 - i * 30;
                const cg = ctx.createGain();
                cg.gain.setValueAtTime(0.12, t + i * 0.12);
                cg.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.06);
                c.connect(cg); cg.connect(master);
                c.start(t + i * 0.12); c.stop(t + i * 0.12 + 0.08);
            }
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(70, t + 0.2);
            o.frequency.exponentialRampToValueAtTime(210, t + 0.55);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t + 0.2);
            g.gain.exponentialRampToValueAtTime(0.16, t + 0.3);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
            o.connect(g); g.connect(master);
            o.start(t + 0.2); o.stop(t + 0.62);
        },

        /* lethal electric shock: arc crackle + mains buzz + zaaaap + clunk */
        die() {
            if (!ensure()) return;
            const t = ctx.currentTime;

            // arc crackle: fluttering high-band noise
            const n = noiseSrc();
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 3200;
            bp.Q.value = 0.8;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.0001, t);
            for (let i = 0; i < 8; i++) {
                ng.gain.exponentialRampToValueAtTime(0.22 * (i % 2 ? 0.35 : 1), t + 0.02 + i * 0.035);
            }
            ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
            n.connect(bp); bp.connect(ng); ng.connect(master);
            n.start(t); n.stop(t + 0.5);

            // harsh mains buzz: two detuned squares falling away
            for (const f of [124, 131]) {
                const o = ctx.createOscillator();
                o.type = 'square';
                o.frequency.setValueAtTime(f, t);
                o.frequency.linearRampToValueAtTime(f * 0.6, t + 0.35);
                const og = ctx.createGain();
                og.gain.setValueAtTime(0.13, t);
                og.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 1800;
                o.connect(lp); lp.connect(og); og.connect(master);
                o.start(t); o.stop(t + 0.42);
            }

            // zaaaap: bright descending shock
            const z = ctx.createOscillator();
            z.type = 'sawtooth';
            z.frequency.setValueAtTime(1200, t);
            z.frequency.exponentialRampToValueAtTime(70, t + 0.3);
            const zg = ctx.createGain();
            zg.gain.setValueAtTime(0.18, t);
            zg.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
            z.connect(zg); zg.connect(master);
            z.start(t); z.stop(t + 0.36);

            // clunk: hitting the road
            const cl = ctx.createOscillator();
            cl.type = 'sine';
            cl.frequency.setValueAtTime(100, t + 0.28);
            cl.frequency.exponentialRampToValueAtTime(36, t + 0.55);
            const cg = ctx.createGain();
            cg.gain.setValueAtTime(0.45, t + 0.28);
            cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
            cl.connect(cg); cg.connect(master);
            cl.start(t + 0.28); cl.stop(t + 0.62);
        }
    };
})();
