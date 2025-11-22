/*sección [ENEMIGOS] Código para los enemigos del juego*/
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
            // Daño por defecto
            this.damage = 5;
            this.attackCooldown = 0;
            return;
        }

        this.x = path[0].x;
        this.y = path[0].y;
        this.wpIndex = 0;
        let mult = aiDirector.difficultyMultiplier;
        
        // Si es un jefe, usar la clase Boss
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
        
        // Propiedades de combate contra Soldado
        this.damage = stats.damage || 5; 
        this.attackCooldown = 0;
    }

    update(dt = 1.0) {
        if (!isFinite(dt)) dt = 1.0;
        
        // Lógica de combate contra Soldado
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        let engagedSoldier = null;
        if (gameState.soldiers && gameState.soldiers.length > 0) {
            for (let s of gameState.soldiers) {
                if (s.dead) continue;
                if (Math.hypot(s.x - this.x, s.y - this.y) < 30) {
                    engagedSoldier = s;
                    break;
                }
            }
        }

        if (engagedSoldier) {
            if (this.attackCooldown <= 0) {
                engagedSoldier.takeDamage(this.damage);
                this.attackCooldown = 60; 
            }
            return;
        }

        if (this.slowed) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) this.slowed = false;
        }

        let effectiveSpeed = this.slowed ? this.speed * 0.5 : this.speed;

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

    // --- NUEVO MÉTODO AÑADIDO PARA CORREGIR EL ERROR ---
    takeDamage(amount) {
        this.hp -= amount;
        this.markHit(5); // Feedback visual
        if (this.hp <= 0) {
            killEnemy(this);
        }
    }
    // ---------------------------------------------------

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
/*[Fin de sección]*/