/* sección [PROYECTILES] Código para los proyectiles */
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
/* [Fin de sección] */