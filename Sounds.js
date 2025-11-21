/* sección [SONIDO] Gestión del sonido */
const Sounds = {
    // Contexto de audio compartido (Singleton) para evitar saturar el hardware
    _ctx: null,
    // Contador de sonidos activos de proyectiles
    _activeProjectileSounds: 0,
    // Límite máximo de sonidos de proyectiles simultáneos
    _maxProjectileSounds: 4,

    getContext: function () {
        if (!this._ctx) {
            const AudioContext = window.AudioContext ||
                window.webkitAudioContext;
            if (AudioContext) {
                this._ctx = new AudioContext();
            }
        }
        // Intentar reanudar el contexto si está suspendido (requisito de navegadores modernos)
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume().catch(() => { });
        }
        return this._ctx;
    },

    _canPlayProjectileSound: function () {
        return this._activeProjectileSounds < this._maxProjectileSounds;
    },

    _startProjectileSound: function () {
        this._activeProjectileSounds++;
    },

    _endProjectileSound: function () {
        this._activeProjectileSounds = Math.max(0, this._activeProjectileSounds - 1);
    },

    shootArrow: () => {
        if (!Sounds._canPlayProjectileSound()) return;
        try {
            const a = Sounds.getContext();
            if (!a) return;
            Sounds._startProjectileSound();
            const o = a.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(800, a.currentTime);
            o.frequency.exponentialRampToValueAtTime(200, a.currentTime + 0.05);
            const g = a.createGain();
            g.gain.setValueAtTime(0.09, a.currentTime);
            o.connect(g);
            g.connect(a.destination);
            o.start();
            o.stop(a.currentTime + 0.05);

            // Programar la liberación del slot de sonido
            setTimeout(() => {
                Sounds._endProjectileSound();
            }, 50);
        } catch (e) {
            Sounds._endProjectileSound();
        }
    },
    shootCannon: () => {
        if (!Sounds._canPlayProjectileSound()) return;
        try {
            const a = Sounds.getContext();
            if (!a) return;
            Sounds._startProjectileSound();
            const o = a.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(80, a.currentTime);
            const g = a.createGain();
            g.gain.setValueAtTime(0.18, a.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.2);
            o.connect(g); g.connect(a.destination);
            o.start(); o.stop(a.currentTime + 0.2);

            setTimeout(() => {
                Sounds._endProjectileSound();
            }, 200);
        } catch (e) {
            Sounds._endProjectileSound();
        }
    },
    shootMage: () => {
        if (!Sounds._canPlayProjectileSound()) return;
        try {
            const a = Sounds.getContext();
            if (!a) return;
            Sounds._startProjectileSound();
            const o = a.createOscillator();
            o.type = 'triangle';
            o.frequency.setValueAtTime(300, a.currentTime);
            o.frequency.exponentialRampToValueAtTime(800, a.currentTime + 0.15);
            const g = a.createGain();
            g.gain.setValueAtTime(0.13, a.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.15);
            o.connect(g); g.connect(a.destination);
            o.start(); o.stop(a.currentTime + 0.15);
            setTimeout(() => {
                Sounds._endProjectileSound();
            }, 150);
        } catch (e) {
            Sounds._endProjectileSound();
        }
    },
    shootIce: () => {
        if (!Sounds._canPlayProjectileSound()) return;
        try {
            const a = Sounds.getContext();
            if (!a) return;
            Sounds._startProjectileSound();
            const o = a.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(600, a.currentTime);
            o.frequency.exponentialRampToValueAtTime(300, a.currentTime + 0.1);
            const g = a.createGain();
            g.gain.setValueAtTime(0.09, a.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.12);
            o.connect(g); g.connect(a.destination);
            o.start(); o.stop(a.currentTime + 0.12);
            setTimeout(() => {
                Sounds._endProjectileSound();
            }, 120);
        } catch (e) {
            Sounds._endProjectileSound();
        }
    },
    enemyHit: () => {
        if (!Sounds._canPlayProjectileSound()) return;
        try {
            const a = Sounds.getContext();
            if (!a) return;
            Sounds._startProjectileSound();
            const o = a.createOscillator();
            o.type = 'square';
            o.frequency.setValueAtTime(150, a.currentTime);
            o.frequency.exponentialRampToValueAtTime(50, a.currentTime + 0.05);
            const g = a.createGain();
            g.gain.setValueAtTime(0.08, a.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.05);
            o.connect(g); g.connect(a.destination);
            o.start(); o.stop(a.currentTime + 0.05);
            setTimeout(() => {
                Sounds._endProjectileSound();
            }, 50);
        } catch (e) {
            Sounds._endProjectileSound();
        }
    },
    towerUpgrade: () => {
        // Este sonido no cuenta en el límite de proyectiles
        try {
            const a = Sounds.getContext();
            if (!a) return;
            const o = a.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(400, a.currentTime);
            o.frequency.exponentialRampToValueAtTime(1200, a.currentTime + 0.1);
            const g = a.createGain();
            g.gain.setValueAtTime(0.5, a.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.15);
            o.connect(g); g.connect(a.destination);
            o.start(); o.stop(a.currentTime + 0.15);
        } catch (e) { }
    },
    waveStart: () => {
        // Este sonido no cuenta en el límite de proyectiles
        try {
            const a = Sounds.getContext();
            if (!a) return;
            const notes = [300, 400, 500];
            notes.forEach((f, i) => {
                const o = a.createOscillator();
                o.type = 'triangle';
                o.frequency.value = f;
                const g = a.createGain();
                g.gain.setValueAtTime(0.18, a.currentTime + i * 0.08);
                g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + i * 0.08 + 0.2);
                o.connect(g); g.connect(a.destination);
                o.start(a.currentTime + i * 0.08);
                o.stop(a.currentTime + i * 0.08 + 0.2);
            });
        } catch (e) { }
    }
};
/* [Fin de sección] */