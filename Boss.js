/*sección [BOSSES] Código para los bosses del juego*/
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

        // --- MODIFICACIÓN SOLICITADA: reducir ligeramente la salud del jefe ---
        // Antes: this.maxHp = bossStats.hp * mult * 3; // 3x más fuerte que enemigos normales
        // Ahora: reducir el multiplicador global para que los jefes sean algo menos resistentes
        this.maxHp = bossStats.hp * mult * 2.4; // 2.4x en lugar de 3x
        // ---------------------------------------------------------------

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
/*[Fin de sección]*/