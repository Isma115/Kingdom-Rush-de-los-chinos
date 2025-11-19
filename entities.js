// entities.js
/*sección [ENTIDADES] Gestión de entidades*/
// --- CLASES ---

class Enemy {
    constructor(rosterId) {
        // VERIFICAR que el rosterId existe antes de acceder a sus propiedades
        const stats = enemyRoster[rosterId];
        if (!stats) {
            console.error(`Enemy with rosterId ${rosterId} not found in enemyRoster`);
            // Usar un enemigo por defecto (primer enemigo) para evitar el crash
            const defaultStats = enemyRoster[0];
            this.x = path[0].x;
            this.y = path[0].y;
            this.wpIndex = 0;
            
            let mult = aiDirector.difficultyMultiplier;
            
            this.hp = defaultStats.hp * mult;
            this.maxHp = this.hp;
            this.speed = defaultStats.speed * 0.82 * (1 + (mult - 1) * 0.1);
            this.reward = Math.floor(defaultStats.reward * mult);
            this.radius = defaultStats.size;
            // Modificado: Usar el color basado en el nivel
            this.color = getEnemyColorByTier(0); 
            this.label = defaultStats.label || defaultStats.name.substring(0, 1);
            this.rosterId = 0; // Guardar el ID
            return;
            // Salir temprano para evitar ejecutar el resto del código
        }
        
        this.x = path[0].x;
        this.y = path[0].y;
        this.wpIndex = 0;
        
        let mult = aiDirector.difficultyMultiplier;
        
        this.hp = stats.hp * mult;
        this.maxHp = this.hp;
        this.speed = stats.speed * 0.82 * (1 + (mult - 1) * 0.1);
        this.reward = Math.floor(stats.reward * mult);
        this.radius = stats.size;
        // Modificado: Usar el color basado en el nivel
        this.color = getEnemyColorByTier(rosterId); 
        this.label = stats.label || stats.name.substring(0, 1); // Añadir label/icono
        this.rosterId = rosterId; // Guardar el ID
        // NUEVO: Efectos de estado
        this.slowed = false;
        this.slowTimer = 0;

        // NUEVO: Visual FX state
        this.hitFlash = 0;      // frames to show hit flash
        this.trailAcc = 0;      // accumulator for trail spawning
        this.auraPulse = Math.random() * 100; // phase offset for aura pulso
    }

    update() {
        // Aplicar efectos de estado
        if (this.slowed) {
            this.slowTimer--;
            if (this.slowTimer <= 0) {
                this.slowed = false;
            }
        }
        
        let effectiveSpeed = this.slowed ? this.speed * 0.5 : this.speed;
        
        let target = path[this.wpIndex + 1];
        if (!target) return; 
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.hypot(dx, dy);
        if (dist < effectiveSpeed) {
            this.wpIndex++;
            if (this.wpIndex >= path.length - 1) this.reachBase();
        } else {
            this.x += (dx / dist) * effectiveSpeed;
            this.y += (dy / dist) * effectiveSpeed;
        }

        // NUEVO: actualizar visual FX
        if (this.hitFlash > 0) this.hitFlash--;
        this.trailAcc += Math.min(1, effectiveSpeed / 6);
        if (this.trailAcc >= 1) {
            this.trailAcc = 0;
            // Añadir partícula de estela (usa gameState.particles)
            if (gameState && Array.isArray(gameState.particles)) {
                gameState.particles.push({
                    x: this.x + (Math.random()-0.5)*4,
                    y: this.y + (Math.random()-0.5)*4,
                    vx: (Math.random()-0.5) * 0.3,
                    vy: (Math.random()-0.5) * 0.3,
                    life: 30,
                    size: Math.max(1, this.radius * 0.12),
                    color: this.color,
                    fade: true
                });
            }
        }
    }

    draw() {
        // AURA PULSANTE (según una fase y vida restante)
        const pulse = 1 + Math.sin((Date.now() * 0.004) + this.auraPulse) * 0.08;
        const auraRadius = this.radius + 6 * pulse;

        // Gradiente radial para aura
        let g = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, auraRadius);
        // Usar color translúcido derivado del color base
        let base = this.color || '#ffffff';
        g.addColorStop(0, hexToRgba(base, 0.18));
        g.addColorStop(1, hexToRgba(base, 0.0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Base - Círculo Negro Exterior (Sombra o Borde)
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2); // Un poco más grande
        ctx.fill();
        
        // Cuerpo - Círculo (El color cambia de blanco a negro según la dificultad)
        // Si está golpeado, mostrar un flash blanco momentáneo
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fill();
        
        // Icono
        // El color del texto del icono es el INVERSO del color de fondo del círculo para asegurar el contraste.
        // Si el color es claro (blanco/gris claro), el icono será negro, y viceversa.
        let val = parseInt(this.color.substring(1, 3), 16); // Valor RGB del color (0 a 255)
        // Si el valor es > 127 (claro), el texto es negro. Si es < 127 (oscuro), el texto es blanco.
        ctx.fillStyle = val > 127 ? 'black' : 'white';
        ctx.font = `${this.radius + 8}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y + 8);
        
        // Barra de vida con degradado y suavizado
        const barWidth = this.radius * 2.5;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;
        
        // Fondo oscuro translúcido
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRect(ctx, barX - 1, barY - 1, barWidth + 2, barHeight + 2, 3, true, false);

        // Fondo rojo (vida perdida)
        ctx.fillStyle = '#b71c1c';
        roundRect(ctx, barX, barY, barWidth, barHeight, 3, true, false);
        
        // Barra con gradiente (de verde a amarillo)
        const healthPercent = Math.max(0, this.hp / this.maxHp);
        let hg = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        hg.addColorStop(0, '#4caf50');
        hg.addColorStop(1, '#ffd600');
        ctx.fillStyle = hg;
        roundRect(ctx, barX, barY, barWidth * healthPercent, barHeight, 3, true, false);
        
        // Borde de la barra
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // NUEVO: Indicador de efecto de hielo
        if (this.slowed) {
            ctx.strokeStyle = '#00bcd4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Pequeño destello si fue golpeado recientemente
        if (this.hitFlash > 0) {
            ctx.globalAlpha = this.hitFlash / 8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    reachBase() {
        this.hp = 0;
        gameState.lives--;
        updateUI();
        if (gameState.lives <= 0) gameOver();
    }
    
    // NUEVO: Método para aplicar efectos
    applySlow(duration) {
        this.slowed = true;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    // NUEVO: marcar golpe para FX (llamar desde Projectile.impact o killEnemy si corresponde)
    markHit(intensity) {
        this.hitFlash = Math.max(this.hitFlash, Math.min(8, intensity || 4));
    }
}

class Tower {
    constructor(x, y, typeKey) {
        this.x = x;
        this.y = y;
        this.level = 1;
        
        // CLONAR el objeto de stats para que sea único por torre
        // Importante para que las mejoras no afecten a todas las torres del mismo tipo
        const baseStats = towerTypes[typeKey];
        // CORRECCIÓN: Verificar que baseStats existe antes de clonar
        if (!baseStats) {
            console.error(`Tower type ${typeKey} not found in towerTypes`);
            return;
        }
        
        this.stats = { ...baseStats }; // Copia superficial
        this.baseCost = baseStats.cost;
        // Recordar coste original para calcular mejoras
        
        this.cooldown = this.stats.fireRate;
        this.type = typeKey; // NUEVO: Guardar el tipo de torre

        // NUEVO: Visual state
        this.recoil = 0;      // para animación al disparar
        this.charge = 0;      // para mago / sniper carga visual
    }

    upgrade() {
        // Máximo de mejoras es 10 (Nivel 10)
        if (this.level >= 10) {
            addFloatText("MAX LEVEL", this.x, this.y - 30, "#ffeb3b", 16);
            return;
        }

        // Fórmula: Coste = Precio Original * (2 ^ Nivel Actual)
        // Nivel 1 -> 2 = Coste Base * 2
        // Nivel 2 -> 3 = Coste Base * 4
        let upgradeCost = this.baseCost * Math.pow(2, this.level);
        if (gameState.gold >= upgradeCost) {
            gameState.gold -= upgradeCost;
            this.level++;
            // Mejorar Stats
            this.stats.damage = Math.floor(this.stats.damage * 1.5);
            // +50% Daño
            this.stats.range = this.stats.range * 1.1;
            // +10% Rango
            
            // CORRECCIÓN: Eliminar doble multiplicador para torres eco
            // Las torres eco ya se benefician del aumento de daño estándar
            
            addFloatText("UPGRADE!", this.x, this.y - 30, "#00e5ff", 20);
            addFloatText(`-${upgradeCost}g`, this.x, this.y - 10, "#ffeb3b", 16);
            updateUI();

            // Efecto visual de mejora: partículas y glow
            if (gameState && Array.isArray(gameState.particles)) {
                for (let i = 0; i < 8; i++) {
                    gameState.particles.push({
                        x: this.x + (Math.random()-0.5)*18,
                        y: this.y + (Math.random()-0.5)*18,
                        vx: (Math.random()-0.5) * 1.2,
                        vy: -Math.random() * 1.5,
                        life: 45,
                        size: 2 + Math.random()*3,
                        color: '#ffd54f',
                        fade: true
                    });
                }
            }
        } else {
            addFloatText(`Necesitas ${upgradeCost}g`, this.x, this.y - 30, "red", 16);
        }
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
        // Actualizar visuales
        if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - 0.5);
        if (this.stats.type === 'eco') {
            if (this.cooldown <= 0) {
                gameState.gold += this.stats.damage;
                addFloatText(`+${this.stats.damage}g`, this.x, this.y - 30, '#ffd700', 20);
                updateUI();
                this.cooldown = this.stats.fireRate;
                // Pequeño pulso visual
                this.recoil = 4;
            }
        } else {
            // Visual: carga para mago/sniper
            if (this.type === 'mage' || this.type === 'sniper') {
                this.charge = Math.max(0, this.charge - 0.5);
            }
            if (this.cooldown <= 0) {
                let target = this.findTarget();
                if (target) {
                    projectiles.push(new Projectile(this.x, this.y, target, this.stats, this.type));
                    this.cooldown = this.stats.fireRate;
                    // Recoil visual y carga
                    this.recoil = 6;
                    if (this.type === 'mage' || this.type === 'sniper') this.charge = 18;
                }
            }
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
        // Base con sombra
        ctx.save();
        ctx.translate(this.x, this.y);

        // Sombra/relieve
        ctx.fillStyle = '#212121';
        ctx.fillRect(-12, -12, 24, 24);
        
        // Recoil translación: empujar el sprite ligeramente al disparar
        let recoilOffset = -this.recoil * 0.6;
        ctx.translate(0, recoilOffset);

        // Cuerpo cambia ligeramente con nivel (más brillante)
        // Para torres de mayor nivel, añadir un glow pulsante
        if (this.level >= 5) {
            // glow externo
            const gRadius = 18 + Math.sin(Date.now() * 0.006 + this.x) * 3;
            let gg = ctx.createRadialGradient(0, 0, 8, 0, 0, gRadius);
            gg.addColorStop(0, hexToRgba(this.stats.color, 0.25));
            gg.addColorStop(1, hexToRgba(this.stats.color, 0));
            ctx.fillStyle = gg;
            ctx.beginPath(); ctx.arc(0, 0, gRadius, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = this.stats.color;
        ctx.fillRect(-15, -15, 30, 30);
        
        // Icono
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.stats.label, 0, 8);
        // INDICADOR DE NIVEL (Estrellas)
        ctx.fillStyle = "#ffff00";
        ctx.font = "10px Arial";
        let starsText = this.level > 4 ? `${this.level}⭐` : "⭐".repeat(this.level);
        ctx.fillText(starsText, 0, -20);

        // Carga visual para mago/sniper
        if (this.charge > 0) {
            ctx.globalAlpha = Math.min(1, this.charge / 18);
            let r = 22 + (18 - this.charge) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = hexToRgba(this.stats.color, 0.85);
            ctx.lineWidth = 2;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
        
        // ELIMINADO: Dibujado del rango cuando la torre está seleccionada
    }
}

class Projectile {
    constructor(x, y, target, stats, towerType) {
        this.x = x;
        this.y = y; this.target = target;
        this.damage = stats.damage;
        this.speed = stats.projSpeed;
        this.hit = false;
        this.isCannon = (stats.label === '💣');
        this.towerType = towerType; // NUEVO: Tipo de torre que disparó
        // NUEVO: Efectos especiales
        this.isIce = (towerType === 'ice');
        this.isMage = (towerType === 'mage');
    }

    update() {
        if (this.target.hp <= 0 && !this.isCannon && !this.isMage) { 
            this.hit = true;
            return; 
        }
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let dist = Math.hypot(dx, dy);

        if (dist < this.speed) this.impact();
        else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    impact() {
        this.hit = true;
        if (this.isCannon) {
            enemies.forEach(e => {
                if (Math.hypot(e.x - this.x, e.y - this.y) < 50) { 
                    e.hp -= this.damage;
                    if(e.hp <= 0) killEnemy(e);
                }
            });
            addFloatText('BOOM', this.x, this.y, 'orange', 20);
        } else if (this.isMage) {
            // NUEVO: Proyectil mágico que atraviesa enemigos
            let hitCount = 0;
            enemies.forEach(e => {
                if (Math.hypot(e.x - this.x, e.y - this.y) < 60) { 
                    e.hp -= this.damage;
                    hitCount++;
                    if(e.hp <= 0) killEnemy(e);
                }
            });
            if (hitCount > 1) {
                addFloatText(`${hitCount} HITS`, this.x, this.y, '#7b1fa2', 16);
            }
        } else if (this.isIce) {
            // NUEVO: Proyectil de hielo que ralentiza
            this.target.hp -= this.damage;
            this.target.applySlow(90); // Ralentiza por 90 frames (1.5 segundos)
            if (this.target.hp <= 0) killEnemy(this.target);
            addFloatText('SLOW', this.target.x, this.target.y, '#00bcd4', 14);
        } else {
            this.target.hp -= this.damage;
            if (this.target.hp <= 0) killEnemy(this.target);
        }
    }

    draw() {
        if (this.isIce) {
            // NUEVO: Proyectil de hielo azul
            ctx.fillStyle = '#00bcd4';
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); 
            ctx.fill();
        } else if (this.isMage) {
            // NUEVO: Proyectil mágico púrpura
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
            ctx.fillStyle = this.isCannon ? 'black' : 'white';
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.isCannon ? 5 : 3, 0, Math.PI * 2); 
            ctx.fill();
        }
    }
}

// ELIMINADO: Variable global para torre seleccionada ya que no se usa para mostrar rango

/*[Fin de sección]*/