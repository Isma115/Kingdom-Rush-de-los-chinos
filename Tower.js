/*sección [ESTRUCTURAS] Código para la gestión de estructuras*/
class Tower {
    constructor(x, y, typeKey) {
        this.x = x;
        this.y = y;
        this.level = 1;

        let baseStats = towerTypes[typeKey];

        if (!baseStats) {
            console.error(`Tower type ${typeKey} not found in towerTypes`);
            return;
        }

        this.stats = { ...baseStats };
        this.baseCost = baseStats.cost;

        this.cooldown = this.stats.fireRate;
        this.type = typeKey;

        this.recoil = 0;
        this.charge = 0;

        this.currentTarget = null;
        this.laserOpacity = 0;
        this.beamActive = false;
    }

    upgrade() {
        if (this.level >= 10) {
            addFloatText("MAX LEVEL", this.x, this.y - 30, "#ffeb3b", 16);
            return;
        }

        let upgradeCost = this.baseCost * Math.pow(2, this.level);
        if (gameState.gold >= upgradeCost) {
            gameState.gold -= upgradeCost;
            this.level++;
            this.stats.damage = Math.floor(this.stats.damage * 1.5);
            this.stats.range = this.stats.range * 1.1;
            addFloatText("UPGRADE!", this.x, this.y - 30, "#00e5ff", 20);
            addFloatText(`-${upgradeCost}g`, this.x, this.y - 10, "#ffeb3b", 16);
            Sounds.towerUpgrade();
            updateUI();
        } else {
            addFloatText(`Necesitas ${upgradeCost}g`, this.x, this.y - 30, "red", 16);
        }
    }

    update(dt = 1.0) {
        if (this.type !== 'infernal') {
            if (this.cooldown > 0) this.cooldown -= dt;
            if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - 0.5 * dt);

            // CORRECCIÓN: Verificar this.type en lugar de this.stats.type para detectar minas
            if (this.type === 'mine') {
                if (this.cooldown <= 0) {
                    gameState.gold += this.stats.damage;
                    addFloatText(`+${this.stats.damage}g`, this.x, this.y - 30, '#ffd700', 20);
                    updateUI();
                    this.cooldown = this.stats.fireRate;
                    this.recoil = 4;
                }
            } else {
                if (this.type === 'mage' || this.type === 'sniper') {
                    this.charge = Math.max(0, this.charge - 0.5 * dt);
                }

                if (this.cooldown <= 0) {
                    let target = this.findTarget();
                    if (target) {
                        projectiles.push(new Projectile(this.x, this.y, target, this.stats, this.type));
                        this.cooldown = this.stats.fireRate;
                        this.recoil = 6;
                        if (this.type === 'mage' || this.type === 'sniper') this.charge = 18;
                    }
                }
            }
            return;
        }

        // === LÓGICA EXCLUSIVA DE LA TORRE INFERNAL (láser constante) ===
        this.currentTarget = this.findTarget();
        if (this.currentTarget) {
            this.beamActive = true;
            this.laserOpacity = Math.min(1, this.laserOpacity + 0.08 * dt);

            let dps = this.stats.damage;
            this.currentTarget.hp -= dps * dt / 60;
            this.currentTarget.markHit(3);
            if (Math.random() < 0.35) {
                gameState.particles.push({
                    x: this.currentTarget.x + (Math.random() - 0.5) * 12,
                    y: this.currentTarget.y + (Math.random() - 0.5) * 12,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    life: 20,
                    size: 3 + Math.random() * 3,
                    color: '#ff1744',
                    glow: true,
                    fade: true
                });
            }

            if (this.currentTarget.hp <= 0) {
                killEnemy(this.currentTarget);
                this.currentTarget = null;
            }
        } else {
            this.beamActive = false;
            this.laserOpacity = Math.max(0, this.laserOpacity - 0.06 * dt);
        }

        if (this.beamActive) {
            this.recoil = 3 + Math.sin(Date.now() * 0.02) * 1;
        } else {
            this.recoil = Math.max(0, this.recoil - 0.3 * dt);
        }
    }

    findTarget() {
        let target = null;
        let minDist = this.stats.range;
        let maxProgress = -1;
        for (let e of enemies) {
            let d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d <= minDist) {
                if (e.wpIndex > maxProgress) {
                    maxProgress = e.wpIndex;
                    target = e;
                }
            }
        }
        return target;
    }

    draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#212121';
    ctx.fillRect(-12, -12, 24, 24);
    let recoilOffset = -this.recoil * 0.6;
    ctx.translate(0, recoilOffset);

    if (this.type === 'infernal' && this.beamActive) {
        const gRadius = 22 + Math.sin(Date.now() * 0.01) * 5;
        let gg = ctx.createRadialGradient(0, 0, 8, 0, 0, gRadius);
        gg.addColorStop(0, hexToRgba('#ff1744', 0.6));
        gg.addColorStop(1, hexToRgba('#ff1744', 0));
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(0, 0, gRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = this.type === 'infernal' ? '#212121' : (this.stats.color || '#555');
    ctx.fillRect(-15, -15, 30, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let displayLabel = this.stats.label || (this.type === 'infernal' ? 'fire' : '?');
    ctx.fillText(displayLabel, 0, 2);

    ctx.fillStyle = "#ffff00";
    ctx.font = "10px Arial";
    ctx.textBaseline = 'alphabetic';
    let starsText = this.level > 4 ? `${this.level} ⭐` : "⭐".repeat(this.level);
    ctx.fillText(starsText, 0, -20);
    
    if ((this.type === 'mage' || this.type === 'sniper') && this.charge > 0) {
        ctx.globalAlpha = Math.min(1, this.charge / 18);
        let r = 22 + (18 - this.charge) * 0.6;
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(this.stats.color || '#fff', 0.85);
        ctx.lineWidth = 2;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // === RAYO INFERNAL MEJORADO VISUALMENTE ===
    if (this.type === 'infernal' && this.currentTarget && this.laserOpacity > 0) {
        let opacity = this.laserOpacity;
        let tx = this.currentTarget.x;
        let ty = this.currentTarget.y;
        let time = Date.now() * 0.004;

        // 1. Núcleo rojo intenso pulsante
        ctx.strokeStyle = `rgba(255, 50, 50, ${opacity})`;
        ctx.lineWidth = 5 + Math.sin(time * 3) * 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // 2. Halo blanco brillante interno
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        ctx.lineWidth = 2.5 + Math.sin(time * 4) * 0.8;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // 3. Borde rojo oscuro exterior con ondulación
        ctx.strokeStyle = `rgba(200, 0, 0, ${opacity * 0.7})`;
        ctx.lineWidth = 9 + Math.sin(time * 2.5) * 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // 4. Efecto de "energía inestable" con líneas zig-zag aleatorias
        ctx.strokeStyle = `rgba(255, 100, 100, ${opacity * 0.6})`;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            let offset = (i - 1) * 8 + Math.sin(time * 5 + i) * 4;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            let steps = 12;
            for (let s = 1; s < steps; s++) {
                let t = s / steps;
                let px = this.x + (tx - this.x) * t + (Math.random() - 0.5) * offset;
                let py = this.y + (ty - this.y) * t + (Math.random() - 0.5) * offset;
                ctx.lineTo(px, py);
            }
            ctx.lineTo(tx, ty);
            ctx.stroke();
        }

        // 5. Impacto en el enemigo: anillo expansivo + partículas brillantes
        let impactRadius = 12 + Math.sin(time * 8) * 4;
        let impactGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, impactRadius);
        impactGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        impactGrad.addColorStop(0.4, `rgba(255, 100, 100, ${opacity * 0.8})`);
        impactGrad.addColorStop(1, `rgba(255, 20, 20, 0)`);
        ctx.fillStyle = impactGrad;
        ctx.beginPath();
        ctx.arc(tx, ty, impactRadius, 0, Math.PI * 2);
        ctx.fill();

        // Partículas brillantes en el punto de impacto
        if (Math.random() < 0.6) {
            gameState.particles.push({
                x: tx + (Math.random() - 0.5) * 20,
                y: ty + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 15 + Math.random() * 10,
                size: 3 + Math.random() * 4,
                color: '#ffffff',
                glow: true,
                fade: true
            });
        }
    }
}

}
/*[Fin de sección]*/