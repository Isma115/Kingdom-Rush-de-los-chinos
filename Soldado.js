/*sección [SOLDADO] Clase para la entidad Soldado*/
class Soldier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Guardamos la posición original para volver si no hay enemigos
        this.spawnX = x;
        this.spawnY = y;
        
        // --- MODIFICACIÓN: Escalado de estadísticas por oleada ---
        // Obtenemos la oleada actual, asegurando que sea al menos 1
        let currentWave = (typeof gameState !== 'undefined' && gameState.wave) ?
            gameState.wave : 1;
        
        // Vida base 500 + 20% por cada oleada adicional
        this.hp = Math.floor(500 * (1 + (currentWave - 1) * 0.20));
        this.maxHp = this.hp;
        
        // Daño base 20 + 10% por cada oleada adicional
        this.damage = Math.floor(20 * (1 + (currentWave - 1) * 0.10));
        // ---------------------------------------------------------

        // RANGOS
        this.range = 40;
        // Distancia para golpear (cuerpo a cuerpo)
        this.detectionRange = 150;
        // Distancia para empezar a perseguir
        
        this.attackCooldown = 0;
        this.attackSpeed = 60;
        this.dead = false;
        
        // MOVIMIENTO
        this.speed = 1.8;
        // Velocidad de persecución
        
        this.color = '#1565c0';
        this.radius = 8;
    }

    update(dt = 1.0) {
        if (this.dead) return;
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // 1. BUSCAR OBJETIVO MÁS CERCANO
        let target = null;
        let minDistance = this.detectionRange; // Solo nos interesan los que estén dentro del rango de detección

        for (let e of enemies) {
            let dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist <= minDistance) {
                minDistance = dist;
                target = e;
            }
        }

        // 2. LÓGICA DE MOVIMIENTO Y ATAQUE
        if (target) {
            // Distancia actual al objetivo
            let distToTarget = Math.hypot(target.x - this.x, target.y - this.y);
            // A. Si estamos en rango de ataque -> PEGAR
            if (distToTarget <= this.range) {
                if (this.attackCooldown <= 0) {
                    // Usamos la corrección (takeDamage o directa)
                    if (typeof target.takeDamage === 'function') {
    
                        target.takeDamage(this.damage);
                    } else {
                        target.hp -= this.damage;
                        if(target.markHit) target.markHit(5);
                        if (target.hp <= 0) killEnemy(target);
                    }
                    
                    this.attackCooldown = this.attackSpeed;
                    // Efecto visual del golpe
                    if (gameState.particles) {
                        gameState.particles.push({
                            x: target.x,
                     
                            y: target.y,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                           
                            life: 20,
                            size: 2,
                     
                            color: '#ffffff',
                            fade: true
          
                        });
                    }
                }
            } 
            // B. Si no estamos en rango de ataque pero sí de visión -> PERSEGUIR
            else {
                let dx = target.x - this.x;
                let dy = target.y - this.y;
                // Normalizar vector y mover
                this.x += (dx / distToTarget) * this.speed * dt;
                this.y += (dy / distToTarget) * this.speed * dt;
            }

        } else {
            // 3. RETORNO A POSICIÓN (Si no hay enemigos)
            // Si no hay nadie a quien atacar, vuelve a su puesto original
            let distToSpawn = Math.hypot(this.spawnX - this.x, this.spawnY - this.y);
            if (distToSpawn > 2) {
                let dx = this.spawnX - this.x;
                let dy = this.spawnY - this.y;
                this.x += (dx / distToSpawn) * this.speed * dt;
                this.y += (dy / distToSpawn) * this.speed * dt;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            addFloatText('☠️', this.x, this.y, '#1565c0', 20);
        } else {
            addFloatText(`-${amount}`, this.x, this.y - 20, '#ff5252', 12);
        }
    }

    draw() {
        if (this.dead) return;
        // Opcional: Dibujar rango de detección muy tenue (debug visual)
        /*
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.detectionRange, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(21, 101, 192, 0.1)';
        ctx.stroke();
        */

        // Dibujar cuerpo
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dibujar casco/distintivo
        ctx.fillStyle = '#90caf9';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 3, 0, Math.PI * 2);
        ctx.fill();
        // Barra de vida
        const barWidth = 20;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 8;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
}

// --- CLASE HÉROE (HERENCIA) ---
class Hero extends Soldier {
    constructor(x, y) {
        super(x, y);
        // Estadísticas fijas para el Héroe
        this.hp = 4000;
        this.maxHp = 4000;
        
        // Aspecto visual distintivo
        this.color = '#FFD700'; // Dorado
        this.radius = 12; // Ligeramente más grande
        
        // Estadísticas de combate mejoradas
        this.damage = 80; 
        this.attackSpeed = 45; // Ataca más rápido
        // --- MODIFICACIÓN: Velocidad duplicada (Antes 2.2, ahora 4.4) ---
        this.speed = 4.4;
        
        // --- MODIFICACIÓN: Rango de detección mayor para el héroe ---
        this.detectionRange = 200; // Mayor rango que los soldados normales
        
        // --- NUEVA PROPIEDAD: Objetivo del click del jugador ---
        this.playerOrderX = x;
        this.playerOrderY = y;
        
        // --- NUEVA PROPIEDAD: Flag para saber si está ejecutando orden del jugador ---
        this.followingPlayerOrder = false;
    }

    // --- MODIFICACIÓN: Sobrescritura de update para prioridad de movimiento ---
    update(dt = 1.0) {
        if (this.dead) return;

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
/*[Fin de sección]*/