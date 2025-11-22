/* sección [HÉROE] Código de lógica del héroe */

class Hero extends Soldier {
    constructor(x, y) {
        // Modificación: El héroe aparece al final del mapa (última posición del path)
        let finalPosition = path[path.length - 1];
        let heroX = finalPosition ? finalPosition.x : x;
        let heroY = finalPosition ? finalPosition.y : y;
        
        super(heroX, heroY);
        
        // --- MODIFICACIÓN: Estadísticas base del héroe ---
        const baseHp = 500;
        const baseDamage = 15;
        const baseSpeed = 4.4;
        const baseAttackCooldown = 40;
        const baseDetectionRange = 180;
        
        // Obtener la oleada actual
        let currentWave = (typeof gameState !== 'undefined' && gameState.wave) ? gameState.wave : 1;
        
        // Calcular el multiplicador de mejora (2% por cada ronda que pase desde la ronda 1)
        // Ronda 1 = 1.00x (sin bonificación)
        // Ronda 2 = 1.02x (+2%)
        // Ronda 3 = 1.04x (+4%)
        // etc.
        let statMultiplier = 1 + ((currentWave - 1) * 0.02);
        
        // Aplicar el escalado a todas las estadísticas
        this.hp = Math.floor(baseHp * statMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(baseDamage * statMultiplier);
        this.speed = baseSpeed * statMultiplier;
        this.actualAttackCoolDown = Math.max(10, Math.floor(baseAttackCooldown / statMultiplier));
        this.detectionRange = Math.floor(baseDetectionRange * statMultiplier);
        // ----------------------------------------------------
        
        // Aspecto visual distintivo
        this.color = '#FFD700'; // Dorado
        this.radius = 12; // Ligeramente más grande
        
        // Rango de golpeo (heredado de Soldier, pero lo mantenemos)
        this.range = 40;
        
        // --- NUEVA PROPIEDAD: Objetivo del click del jugador ---
        this.playerOrderX = heroX;
        this.playerOrderY = heroY;
        
        // --- NUEVA PROPIEDAD: Flag para saber si está ejecutando orden del jugador ---
        this.followingPlayerOrder = false;
        
        // --- NUEVAS PROPIEDADES: Gestión de muerte y reaparición ---
        this.respawnTime = 0;
        this.isRespawning = false;
        this.originalSpawnX = heroX;
        this.originalSpawnY = heroY;
    }

    // --- MODIFICACIÓN: Sobrescritura de update para prioridad de movimiento ---
    update(dt = 1.0) {
        if (this.dead) {
            // Si el héroe está muerto, no hace nada más aquí
            return;
        }

        // 1. PRIORIDAD MÁXIMA: Si hay una orden del jugador activa, SOLO moverse hacia ella
        if (this.followingPlayerOrder) {
            let distToOrder = Math.hypot(this.playerOrderX - this.x, this.playerOrderY - this.y);

            // Si aún estamos lejos del objetivo (> 5px), seguir moviéndonos
            if (distToOrder > 5) {
                let dx = this.playerOrderX - this.x;
                let dy = this.playerOrderY - this.y;

                // Mover hacia el destino ordenado
                this.x += (dx / distToOrder) * this.speed * dt;
                this.y += (dy / distToOrder) * this.speed * dt;

                // Reducimos cooldown mientras caminamos
                if (this.attackCooldown > 0) this.attackCooldown -= dt;

                // IMPORTANTE: Salimos aquí, ignorando completamente a los enemigos
                return;
            } else {
                // Ya llegamos al destino de la orden
                this.followingPlayerOrder = false;
                // Actualizamos nuestra posición de "hogar" al punto donde nos ordenaron ir
                this.spawnX = this.playerOrderX;
                this.spawnY = this.playerOrderY;
            }
        }

        // 2. MODO VIGILANCIA: Sin órdenes activas, comportamiento autónomo
        // Aquí usamos la lógica completa del soldado para detectar y perseguir enemigos
        super.update(dt);
    }

    // --- NUEVO MÉTODO: Sobrescribir takeDamage para gestionar la muerte del héroe ---
    takeDamage(amount) {
        if (this.dead) return;
        
        this.hp -= amount;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            this.isRespawning = true;
            this.respawnTime = 600; // 10 segundos a 60 fps (10 * 60 = 600 frames)
            
            // Efecto visual de muerte
            addFloatText('💀 HÉROE CAÍDO', this.x, this.y, '#ff0000', 24);
            addFloatText('Reaparición en 10s', this.x, this.y - 30, '#ffff00', 18);
            
            // Partículas de muerte
            for (let i = 0; i < 30; i++) {
                gameState.particles.push({
                    x: this.x + (Math.random() - 0.5) * 40,
                    y: this.y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 60,
                    size: 4,
                    color: '#FFD700',
                    glow: true,
                    fade: true
                });
            }
            
            // Activar temporizador global de reaparición
            gameState.heroRespawnTimer = this.respawnTime;
        } else {
            addFloatText(`-${amount}`, this.x, this.y - 20, '#ff5252', 12);
        }
    }

    // --- NUEVO MÉTODO: Reaparición del héroe ---
    respawn() {
        // Obtener la oleada actual para recalcular estadísticas
        let currentWave = (typeof gameState !== 'undefined' && gameState.wave) ? gameState.wave : 1;
        
        // Estadísticas base
        const baseHp = 500;
        const baseDamage = 15;
        const baseSpeed = 4.4;
        const baseAttackCooldown = 40;
        const baseDetectionRange = 180;
        
        // Recalcular multiplicador según la ronda actual
        let statMultiplier = 1 + ((currentWave - 1) * 0.02);
        
        // Restaurar estadísticas escaladas a la ronda actual
        this.hp = Math.floor(baseHp * statMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.floor(baseDamage * statMultiplier);
        this.speed = baseSpeed * statMultiplier;
        this.actualAttackCoolDown = Math.max(10, Math.floor(baseAttackCooldown / statMultiplier));
        this.detectionRange = Math.floor(baseDetectionRange * statMultiplier);
        
        // Restaurar posición original (final del mapa)
        this.x = this.originalSpawnX;
        this.y = this.originalSpawnY;
        this.spawnX = this.originalSpawnX;
        this.spawnY = this.originalSpawnY;
        this.playerOrderX = this.originalSpawnX;
        this.playerOrderY = this.originalSpawnY;
        
        // Resetear estados
        this.dead = false;
        this.isRespawning = false;
        this.respawnTime = 0;
        this.followingPlayerOrder = false;
        this.attackCooldown = 0;
        
        // Efecto visual de reaparición
        addFloatText('👑 HÉROE HA REGRESADO', this.x, this.y, '#00ff00', 24);
        
        // Partículas de reaparición
        for (let i = 0; i < 50; i++) {
            gameState.particles.push({
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 80,
                size: 5,
                color: '#FFD700',
                glow: true,
                fade: true
            });
        }
    }

    draw() {
        if (this.dead) return;

        // Aura del héroe
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();

        // Reutilizamos el dibujado base pero con los colores actualizados del constructor
        super.draw();

        // Distintivo de corona/estrella
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', this.x, this.y - this.radius - 15);
    }
}
/* [Fin de sección] */