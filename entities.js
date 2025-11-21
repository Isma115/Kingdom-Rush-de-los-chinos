// entities.js
/*sección [ENTIDADES] Gestión de entidades*/
// --- CLASES ---

// ==== FUNCIÓN GLOBAL PARA RECTÁNGULOS REDONDEADOS ====


function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = {
            tl: radius.tl || 0,
            tr: radius.tr || 0,
            br: radius.br || 0,
            bl: radius.bl || 0
        };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}


class Enemy {
    constructor(rosterId) {
        const stats = enemyRoster[rosterId];
        if (!stats) {
            const defaultStats = enemyRoster[0];
            this.x = path[0].x;
            this.y = path[0].y;
            this.wpIndex = 0;
            let mult = aiDirector.difficultyMultiplier;
            this.hp = defaultStats.hp * mult;
            this.maxHp = this.hp;
            // Modificación: Velocidad multiplicada por 2
            this.speed = defaultStats.speed * 0.82 * (1 + (mult - 1) * 0.1) * 1.55 * 2;
            this.reward = Math.floor(defaultStats.reward * mult);
            this.radius = defaultStats.size;
            this.color = getEnemyColorByTier(0);
            this.label = defaultStats.label || defaultStats.name.substring(0, 1);
            this.rosterId = 0;
            this.isBoss = false;
            return;
        }

        this.x = path[0].x;
        this.y = path[0].y;
        this.wpIndex = 0;
        let mult = aiDirector.difficultyMultiplier;
        
        // Si es un jefe, usar la clase Boss
        // Modificación: Comprobamos que no seamos ya una instancia de Boss para evitar recursión infinita
        if (stats.isBoss && this.constructor === Enemy) {
            return new Boss(rosterId);
        }
        
        this.hp = stats.hp * mult;
        this.maxHp = this.hp;
        // Modificación: Velocidad multiplicada por 2
        this.speed = stats.speed * 0.82 * (1 + (mult - 1) * 0.1) * 1.55 * 2;
        this.reward = Math.floor(stats.reward * mult);
        this.radius = stats.size;
        this.color = getEnemyColorByTier(rosterId);
        this.label = stats.label || stats.name.substring(0, 1);
        this.rosterId = rosterId;
        this.slowed = false;
        this.slowTimer = 0;
        this.hitFlash = 0;
        this.trailAcc = 0;
        this.auraPulse = Math.random() * 100;
        this.isBoss = false;
    }

    update(dt = 1.0) {
        if (!isFinite(dt)) dt = 1.0;
        if (this.slowed) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) this.slowed = false;
        }

        let effectiveSpeed = this.slowed ?
            this.speed * 0.5 : this.speed;

        let target = path[this.wpIndex + 1];
        if (!target) return;

        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.hypot(dx, dy);
        if (dist < effectiveSpeed * dt) {
            this.wpIndex++;
            if (this.wpIndex >= path.length - 1) this.reachBase();
        } else {
            if (dist > 0.01) {
                this.x += (dx / dist) * effectiveSpeed * dt;
                this.y += (dy / dist) * effectiveSpeed * dt;
            }
        }

        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.trailAcc += Math.min(1, effectiveSpeed / 6) * dt;
        if (this.trailAcc >= 1) {
            this.trailAcc = 0;
            if (gameState && Array.isArray(gameState.particles)) {
                gameState.particles.push({
                    x: this.x + (Math.random() - 0.5) * 4,
                    y: this.y + (Math.random() - 0.5) * 4,
                    vx: (Math.random() - 0.5) * 0.3,
 
                    vy: (Math.random() - 0.5) * 0.3,
                    life: 30,
                    size: Math.max(1, this.radius * 0.12),
                    color: this.color,
          
                    fade: true
                });
            }
        }
    }

    draw() {
        if (!isFinite(this.x) || !isFinite(this.y)) return;
        const pulse = 1 + Math.sin((Date.now() * 0.004) + this.auraPulse) * 0.08;
        const auraRadius = Math.max(0, this.radius + 6 * pulse);
        
        let g = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, auraRadius);
        let base = this.color || '#ffffff';
        g.addColorStop(0, hexToRgba(base, 0.18));
        g.addColorStop(1, hexToRgba(base, 0.0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        let val = parseInt(this.color.substring(1, 3), 16);
        ctx.fillStyle = val > 127 ? 'black' : 'white';
        ctx.font = `${this.radius + 8}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y + 8);

        const barWidth = this.radius * 2.5;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRect(ctx, barX - 1, barY - 1, barWidth + 2, barHeight + 2, 3, true, false);
        ctx.fillStyle = '#b71c1c';
        roundRect(ctx, barX, barY, barWidth, barHeight, 3, true, false);
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#4caf50';
        roundRect(ctx, barX, barY, barWidth * healthPercent, barHeight, 3, true, false);
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        if (this.slowed) {
            ctx.strokeStyle = '#00bcd4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.hitFlash > 0) {
            ctx.globalAlpha = Math.min(1, this.hitFlash / 8);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    reachBase() {
        this.hp = 0;
        if (!gameState.debug.godMode && !gameState.debug.infiniteLives) {
            gameState.lives--;
        }

        updateUI();
        if (gameState.lives <= 0 && !gameState.debug.godMode && !gameState.debug.infiniteLives) {
            gameOver();
        }
    }

    applySlow(duration) {
        this.slowed = true;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    markHit(intensity) {
        this.hitFlash = Math.max(this.hitFlash, Math.min(8, intensity || 4));
    }
}

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

            // Modificación: Verificar this.stats.type en lugar de this.type para detectar minas
            if (this.stats.type === 'eco') {
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
        
        let displayLabel = this.stats.label || (this.type === 'infernal' ? '🔥' : '?');
        ctx.fillText(displayLabel, 0, 2);

        ctx.fillStyle = "#ffff00";
        ctx.font = "10px Arial";
        ctx.textBaseline = 'alphabetic';
        let starsText = this.level > 4 ? `${this.level}⭐` : "⭐".repeat(this.level);
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

        if (this.type === 'infernal' && this.currentTarget && this.laserOpacity > 0) {
            let opacity = this.laserOpacity;
            let tx = this.currentTarget.x;
            let ty = this.currentTarget.y;

            ctx.strokeStyle = `rgba(255, 20, 20, ${opacity})`;
            ctx.lineWidth = 4 + Math.sin(Date.now() * 0.02) * 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(tx, ty, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

class Boss extends Enemy {
    constructor(rosterId) {
        // Modificación: Llamada obligatoria a super() antes de usar 'this'
        super(rosterId);
        const stats = enemyRoster[rosterId];
        if (!stats) {
            const defaultStats = enemyRoster[0];
            this.x = path[0].x;
            this.y = path[0].y;
            this.wpIndex = 0;
            let mult = aiDirector.difficultyMultiplier;
            this.hp = defaultStats.hp * mult;
            this.maxHp = this.hp;
            // Modificación: Velocidad multiplicada por 2
            this.speed = defaultStats.speed * 0.82 * (1 + (mult - 1) * 0.1) * 1.55 * 2;
            this.reward = Math.floor(defaultStats.reward * mult);
            this.radius = defaultStats.size;
            this.color = getEnemyColorByTier(0);
            this.label = defaultStats.label || defaultStats.name.substring(0, 1);
            this.rosterId = 0;
            this.isBoss = false;
            return;
        }

        this.x = path[0].x;
        this.y = path[0].y;
        this.wpIndex = 0;
        let mult = aiDirector.difficultyMultiplier;
        
        this.isBoss = true;
        this.phase = 1;
        this.shieldActive = false;
        this.shieldCooldown = 0;
        this.shieldDuration = 0;
        this.areaAttackCooldown = 0;
        this.regenerationRate = 0.5; // HP por segundo
        this.lastRegenTime = Date.now();
        // Stats específicos de jefe
        const bossStats = enemyRoster[rosterId];
        this.maxHp = bossStats.hp * mult * 3; // 3x más fuerte que enemigos normales
        this.hp = this.maxHp;
        this.shieldMaxHp = this.maxHp * 0.3; // Escudo del 30% de HP máximo
        this.shieldHp = this.shieldMaxHp;
        this.areaAttackDamage = this.maxHp * 0.1; // 10% del HP máximo como daño de área
        // Modificación: Velocidad multiplicada por 2
        this.speed = bossStats.speed * 0.82 * (1 + (mult - 1) * 0.1) * 1.55 * 2;
        this.reward = Math.floor(bossStats.reward * mult * 5); // 5x recompensa
        this.radius = bossStats.size;
        this.color = bossStats.color;
        this.label = bossStats.label || bossStats.name.substring(0, 1);
        this.rosterId = rosterId;
        this.slowed = false;
        this.slowTimer = 0;
        this.hitFlash = 0;
        this.trailAcc = 0;
        this.auraPulse = Math.random() * 100;
    }

    update(dt = 1.0) {
        if (!isFinite(dt)) dt = 1.0;
        // Regeneración lenta
        const now = Date.now();
        if (now - this.lastRegenTime > 1000) { // Cada segundo
            this.hp = Math.min(this.maxHp, this.hp + this.regenerationRate);
            this.lastRegenTime = now;
        }

        // Gestión de escudo temporal
        if (this.shieldCooldown > 0) {
            this.shieldCooldown -= dt;
        } else if (!this.shieldActive && this.shieldHp > 0) {
            this.shieldActive = true;
            this.shieldDuration = 300; // 5 segundos a 60fps
        }

        if (this.shieldActive) {
            this.shieldDuration -= dt;
            if (this.shieldDuration <= 0 || this.shieldHp <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = 600; // 10 segundos de cooldown
                if (this.shieldHp <= 0) {
                    this.shieldHp = 0;
                }
            }
        }

        // Golpes de área
        if (this.areaAttackCooldown > 0) {
            this.areaAttackCooldown -= dt;
        } else {
            //this.performAreaAttack();
            this.areaAttackCooldown = 450;
            // 7.5 segundos entre ataques
        }

        // Transición de fase
        if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
            this.phase = 2;
            this.activatePhase2();
        }

        if (this.slowed) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) this.slowed = false;
        }

        let effectiveSpeed = this.slowed ?
            this.speed * 0.5 : this.speed;

        let target = path[this.wpIndex + 1];
        if (!target) return;

        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.hypot(dx, dy);
        if (dist < effectiveSpeed * dt) {
            this.wpIndex++;
            if (this.wpIndex >= path.length - 1) this.reachBase();
        } else {
            if (dist > 0.01) {
                this.x += (dx / dist) * effectiveSpeed * dt;
                this.y += (dy / dist) * effectiveSpeed * dt;
            }
        }

        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.trailAcc += Math.min(1, effectiveSpeed / 6) * dt;
        if (this.trailAcc >= 1) {
            this.trailAcc = 0;
            if (gameState && Array.isArray(gameState.particles)) {
                gameState.particles.push({
                    x: this.x + (Math.random() - 0.5) * 4,
                    y: this.y + (Math.random() - 0.5) * 4,
                    vx: (Math.random() - 0.5) * 0.3,
 
                    vy: (Math.random() - 0.5) * 0.3,
                    life: 30,
                    size: Math.max(1, this.radius * 0.12),
                    color: this.color,
          
                    fade: true
                });
            }
        }
    }

    activatePhase2() {
        // Mejora de stats en fase 2
        this.speed *= 1.3;
        this.regenerationRate *= 2;
        this.areaAttackCooldown *= 0.7; // Ataques más frecuentes
        this.shieldCooldown *= 0.8;
        // Escudos más frecuentes
        
        // Efecto visual de transformación
        for (let i = 0; i < 50; i++) {
            gameState.particles.push({
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y + (Math.random() - 0.5) * 60,
  
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 60,
                size: 6,
                color: '#ff0000',
         
                glow: true,
                fade: true
            });
        }
        
        addFloatText('¡FASE 2 ACTIVADA!', this.x, this.y - 90, '#ff0000', 24);
    }

    takeDamage(damage, projectileType) {
        if (this.shieldActive && this.shieldHp > 0) {
            // El escudo absorbe el daño
            this.shieldHp = Math.max(0, this.shieldHp - damage);
            this.markHit(6);
            addFloatText('ESCUDO', this.x, this.y - 40, '#00bcd4', 16);
            
            // Efecto visual de escudo golpeado
            for (let i = 0; i < 8; i++) {
                gameState.particles.push({
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y + 
                    (Math.random() - 0.5) * 30,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 30,
                    size: 3,
    
                    color: '#00bcd4',
                    glow: true,
                    fade: true
                });
            }
        } else {
            // Daño directo a HP
            this.hp -= damage;
            this.markHit(4);
        }
    }

    draw() {
        if (!isFinite(this.x) || !isFinite(this.y)) return;
        // Dibujar barra de escudo si está activo
        if (this.shieldActive && this.shieldHp > 0) {
            const shieldBarWidth = this.radius * 2.5;
            const shieldBarHeight = 4;
            const shieldBarX = this.x - shieldBarWidth / 2;
            const shieldBarY = this.y - this.radius - 20;
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            roundRect(ctx, shieldBarX - 1, shieldBarY - 1, shieldBarWidth + 2, shieldBarHeight + 2, 2, true, false);
            ctx.fillStyle = 'rgba(0, 188, 212, 0.7)';
            const shieldPercent = Math.max(0, this.shieldHp / this.shieldMaxHp);
            roundRect(ctx, shieldBarX, shieldBarY, shieldBarWidth * shieldPercent, shieldBarHeight, 2, true, false);
        }

        const pulse = 1 + Math.sin((Date.now() * 0.004) + this.auraPulse) * 0.08;
        const auraRadius = Math.max(0, this.radius + 6 * pulse);
        
        let g = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, auraRadius);
        let base = this.color || '#ffffff';
        g.addColorStop(0, hexToRgba(base, 0.18));
        g.addColorStop(1, hexToRgba(base, 0.0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        // Efecto visual de escudo activo
        if (this.shieldActive && this.shieldHp > 0) {
            ctx.strokeStyle = 'rgba(0, 188, 212, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            // Efecto de partículas de escudo
            if (Math.random() < 0.3) {
                gameState.particles.push({
                    x: this.x + (Math.random() - 0.5) * (this.radius + 10),
                    y: this.y + (Math.random() - 0.5) * (this.radius + 10),
     
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: 20,
                    size: 2,
             
                    color: '#00bcd4',
                    glow: true,
                    fade: true
                });
            }
        }

        // Indicador de fase
        if (this.phase === 2) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        let val = parseInt(this.color.substring(1, 3), 16);
        ctx.fillStyle = val > 127 ? 'black' : 'white';
        ctx.font = `${this.radius + 8}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y + 8);

        const barWidth = this.radius * 2.5;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRect(ctx, barX - 1, barY - 1, barWidth + 2, barHeight + 2, 3, true, false);
        ctx.fillStyle = '#b71c1c';
        roundRect(ctx, barX, barY, barWidth, barHeight, 3, true, false);
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#4caf50';
        roundRect(ctx, barX, barY, barWidth * healthPercent, barHeight, 3, true, false);
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        if (this.slowed) {
            ctx.strokeStyle = '#00bcd4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.hitFlash > 0) {
            ctx.globalAlpha = Math.min(1, this.hitFlash / 8);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Texto de jefe
        ctx.fillStyle = '#ffd700';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('JEFE', this.x, this.y - this.radius - 35);
        // Indicador de fase
        ctx.fillStyle = this.phase === 1 ? '#00ff00' : '#ff0000';
        ctx.fillText(`FASE ${this.phase}`, this.x, this.y - this.radius - 45);
    }

    reachBase() {
        this.hp = 0;
        if (!gameState.debug.godMode && !gameState.debug.infiniteLives) {
            gameState.lives -= 5;
            // Los jefes quitan más vidas
        }

        updateUI();
        if (gameState.lives <= 0 && !gameState.debug.godMode && !gameState.debug.infiniteLives) {
            gameOver();
        }
    }

    applySlow(duration) {
        this.slowed = true;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    markHit(intensity) {
        this.hitFlash = Math.max(this.hitFlash, Math.min(8, intensity || 4));
    }
}

class Projectile {
    constructor(x, y, target, stats, towerType) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = stats.damage;
        this.speed = stats.projSpeed;
        this.hit = false;
        this.isCannon = (stats.label === 'Bomb');
        this.towerType = towerType; // NUEVO: Tipo de torre que disparó
        // NUEVO: Efectos especiales
        this.isIce = (towerType === 'ice');
        this.isMage = (towerType === 'mage');
    }
    update(dt = 1.0) {
        if (this.target.hp <= 0 && !this.isCannon && !this.isMage) {
            this.hit = true;
            return;
        }
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let dist = Math.hypot(dx, dy);
        
        // Movimiento y detección de impacto escalado con dt
        if (dist < this.speed * dt) this.impact();
        else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
    impact() {
        this.hit = true;
        // SONIDOS DE DISPARO SEGÚN TIPO DE TORRE
        if (this.towerType === 'archer' || this.towerType === 'sniper') {
            Sounds.shootArrow();
        } else if (this.towerType === 'cannon') {
            Sounds.shootCannon();
            // explosión al impactar
        } else if (this.towerType === 'mage') {
            Sounds.shootMage();
        } else if (this.towerType === 'ice') {
            Sounds.shootIce();
        }

        if (this.isCannon) {
            enemies.forEach(e => {
                if (Math.hypot(e.x - this.x, e.y - this.y) < 50) {
                    e.hp -= this.damage;
                    e.markHit(7);
         
                    Sounds.enemyHit();
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            addFloatText('BOOM', this.x, this.y, 'orange', 20);

        } else if (this.isMage) {
            // Proyectil mágico que atraviesa
            let hitCount = 0;
            enemies.forEach(e => {
                if (Math.hypot(e.x - this.x, e.y - this.y) < 60) {
                    e.hp -= this.damage;
                    e.markHit(5);
                    Sounds.enemyHit();
           
                    hitCount++;
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (hitCount > 1) {
                addFloatText(`${hitCount} HITS`, this.x, this.y, '#7b1fa2', 16);
            }

        } else if (this.isIce) {
            this.target.hp -= this.damage;
            this.target.applySlow(90); // 1.5 segundos de ralentización
            this.target.markHit(4);
            Sounds.enemyHit();
            if (this.target.hp <= 0) killEnemy(this.target);
            addFloatText('SLOW', this.target.x, this.target.y, '#00bcd4', 14);
        } else {
            // Disparo normal (arquero, francotirador, etc.)
            this.target.hp -= this.damage;
            this.target.markHit(4);
            Sounds.enemyHit();
            if (this.target.hp <= 0) killEnemy(this.target);
        }
    }
    draw() {
        if (this.isIce) {
            // Proyectil de hielo azul
            ctx.fillStyle = '#00bcd4';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isMage) {
            // Proyectil mágico púrpura
            ctx.fillStyle = '#7b1fa2';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            ctx.fill();
            // Efecto brillante
            ctx.strokeStyle = '#e1bee7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = this.isCannon ?
                'black' : 'white';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.isCannon ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
const Sounds = {
    // Contexto de audio compartido (Singleton) para evitar saturar el hardware
    _ctx: null,
    // Contador de sonidos activos de proyectiles
    _activeProjectileSounds: 0,
    // Límite máximo de sonidos de proyectiles simultáneos
    _maxProjectileSounds: 4,

    getContext: function () {
        if (!this._ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
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



/*[Fin de sección]*/