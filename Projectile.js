/*sección [PROYECTILES] Código para los proyectiles*/
/**
 * PROYECTILES - Sistema de gestión de proyectiles
 * 
 * Funcionalidades principales:
 * - Clase Projectile con diferentes tipos (normal, cañón, hielo, magia)
 * - Movimiento y detección de colisiones con enemigos
 * - Efectos especiales por tipo de torre (ralentización, área de efecto, penetración)
 * - Sistema de sonidos diferenciado por tipo de proyectil
 * - Visualización personalizada para cada tipo de proyectil
 * - Gestión de daños y efectos de estado en enemigos
 */
class Projectile {
    constructor(x, y, target, stats, towerType) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = stats.damage;
        this.speed = stats.projSpeed;
        this.hit = false;
        this.isCannon = (stats.label === 'Bomb');
        this.towerType = towerType;
        this.isIce = (towerType === 'ice');
        this.isMage = (towerType === 'mage');
        this.isArrow = (towerType === 'archer' || towerType === 'sniper');
        
        // Calcular ángulo inicial para las flechas
        let dx = target.x - x;
        let dy = target.y - y;
        this.angle = Math.atan2(dy, dx);
    }

    update(dt = 1.0) {
        if (this.target.hp <= 0 && !this.isCannon && !this.isMage) {
            this.hit = true;
            return;
        }
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let dist = Math.hypot(dx, dy);
        
        // Actualizar ángulo para que la flecha apunte siempre al objetivo
        if (this.isArrow) {
            this.angle = Math.atan2(dy, dx);
        }
        
        if (dist < this.speed * dt) this.impact();
        else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
    
    impact() {
        this.hit = true;
        if (this.towerType === 'archer' || this.towerType === 'sniper') {
            Sounds.shootArrow();
        } else if (this.towerType === 'cannon') {
            Sounds.shootCannon();
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
            this.target.applySlow(90);
            this.target.markHit(4);
            Sounds.enemyHit();
            if (this.target.hp <= 0) killEnemy(this.target);
            addFloatText('SLOW', this.target.x, this.target.y, '#00bcd4', 14);
        } else {
            this.target.hp -= this.damage;
            this.target.markHit(4);
            Sounds.enemyHit();
            if (this.target.hp <= 0) killEnemy(this.target);
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isArrow) {
            // Rotar el contexto según el ángulo de la flecha
            ctx.rotate(this.angle);
            
            // Determinar color según tipo (sniper = dorado, archer = marrón oscuro)
            let shaftColor = this.towerType === 'sniper' ? '#8B7355' : '#5D4037';
            let tipColor = this.towerType === 'sniper' ? '#FFD700' : '#757575';
            let featherColor = this.towerType === 'sniper' ? '#FFD700' : '#FFEB3B';
            
            // Dibujar plumas/aletas traseras (3 plumas)
            ctx.fillStyle = featherColor;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(-12, -3);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-12, 3);
            ctx.closePath();
            ctx.fill();
            
            // Contorno de las plumas
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Dibujar cuerpo/astil de la flecha
            ctx.fillStyle = shaftColor;
            ctx.fillRect(-8, -1, 14, 2);
            
            // Sombra en el astil para dar volumen
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(-8, 0, 14, 1);
            
            // Dibujar punta de la flecha (triángulo metálico)
            ctx.fillStyle = tipColor;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(12, 0);
            ctx.lineTo(9, -2.5);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(12, 0);
            ctx.lineTo(9, 2.5);
            ctx.closePath();
            ctx.fill();
            
            // Brillo en la punta metálica
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(11, 0);
            ctx.lineTo(9.5, -1.5);
            ctx.closePath();
            ctx.fill();
            
            // Contorno de la punta para definición
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(12, 0);
            ctx.lineTo(9, -2.5);
            ctx.closePath();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(12, 0);
            ctx.lineTo(9, 2.5);
            ctx.closePath();
            ctx.stroke();
            
        } else if (this.isIce) {
            // Proyectil de hielo - cristal brillante
            ctx.rotate(this.angle + Math.PI / 4);
            
            // Cristal de hielo con gradiente
            let iceGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
            iceGrad.addColorStop(0, '#E0F7FA');
            iceGrad.addColorStop(0.5, '#00BCD4');
            iceGrad.addColorStop(1, '#0097A7');
            ctx.fillStyle = iceGrad;
            
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, -2);
            ctx.lineTo(6, 0);
            ctx.lineTo(4, 2);
            ctx.lineTo(0, 6);
            ctx.lineTo(-4, 2);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-4, -2);
            ctx.closePath();
            ctx.fill();
            
            // Brillo interno
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(-1, -1, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Contorno brillante
            ctx.strokeStyle = '#00E5FF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, -2);
            ctx.lineTo(6, 0);
            ctx.lineTo(4, 2);
            ctx.lineTo(0, 6);
            ctx.lineTo(-4, 2);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-4, -2);
            ctx.closePath();
            ctx.stroke();
            
        } else if (this.isMage) {
            // Proyectil mágico - esfera con aura
            let time = Date.now() * 0.01;
            
            // Aura exterior pulsante
            let auraRadius = 10 + Math.sin(time) * 2;
            let auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRadius);
            auraGrad.addColorStop(0, 'rgba(123, 31, 162, 0.8)');
            auraGrad.addColorStop(0.5, 'rgba(123, 31, 162, 0.4)');
            auraGrad.addColorStop(1, 'rgba(123, 31, 162, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Núcleo púrpura
            let coreGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, 7);
            coreGrad.addColorStop(0, '#E1BEE7');
            coreGrad.addColorStop(0.4, '#AB47BC');
            coreGrad.addColorStop(1, '#6A1B9A');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Anillo brillante
            ctx.strokeStyle = '#E1BEE7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Destellos rotatorios
            ctx.strokeStyle = 'rgba(225, 190, 231, 0.8)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                let sparkAngle = (time + i * Math.PI / 2) % (Math.PI * 2);
                let sparkX = Math.cos(sparkAngle) * 9;
                let sparkY = Math.sin(sparkAngle) * 9;
                ctx.beginPath();
                ctx.moveTo(sparkX * 0.7, sparkY * 0.7);
                ctx.lineTo(sparkX, sparkY);
                ctx.stroke();
            }
            
        } else if (this.isCannon) {
            // Bomba de cañón - esfera oscura
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo metálico
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-1.5, -1.5, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Mecha encendida
            ctx.strokeStyle = '#FF6F00';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(1, -8);
            ctx.stroke();
            
            // Chispa en la mecha
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(1, -8, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Resplandor de la chispa
            let sparkGrad = ctx.createRadialGradient(1, -8, 0, 1, -8, 5);
            sparkGrad.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
            sparkGrad.addColorStop(1, 'rgba(255, 235, 59, 0)');
            ctx.fillStyle = sparkGrad;
            ctx.beginPath();
            ctx.arc(1, -8, 5, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // Proyectil genérico (círculo blanco)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
/*[Fin de sección]*/