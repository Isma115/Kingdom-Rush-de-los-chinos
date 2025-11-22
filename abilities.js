/*sección [HABILIDADES] HABILIDADES O HECHIZOS*/
const abilities = {
    arrowRain: {
        name: 'Lluvia de Flechas',
        cooldown: 600, // Modificado: 1200 / 2
        currentCooldown: 0,
        range: 150, // Radio de efecto definido
        
        // 1. Se llama al pulsar el botón de la UI
        select: function() {
            if (this.currentCooldown > 0) return false;
            addFloatText('SELECCIONA OBJETIVO', canvas.width / 2, 100, '#fdd835', 20);
            return true;
        },

        // 2. Se llama al hacer click en el mapa (x, y)
        trigger: function(x, y) {
            const areaRadius = this.range;
            let hitCount = 0;

            // --- MODIFICACIÓN: Daño escalable ---
            // Daño base 100 + 15% por oleada
            const waveMult = Math.max(1, gameState.wave);
            const damage = Math.floor(100 * (1 + (waveMult - 1) * 0.15));
            // ------------------------------------

            enemies.forEach(e => {
                const dist = Math.hypot(e.x - x, e.y - y);
                if (dist <= areaRadius) {
                    e.hp -= damage;
                   
                    e.markHit(8);
                    hitCount++;
                    if (e.hp <= 0) killEnemy(e);
                    
                    // Efecto de impacto en enemigo
          
                    for (let i = 0; i < 8; i++) {
                        gameState.particles.push({
                            x: e.x + (Math.random() - 0.5) * 20,
                      
                            y: e.y + (Math.random() - 0.5) * 20,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                     
                            life: 40,
                            size: 3,
                            color: '#fdd835',
                            glow: true,
     
                            fade: true
                        });
                    }
                }
            });
            // Efectos visuales generales en el área seleccionada
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * areaRadius;
                gameState.particles.push({
                    x: x + Math.cos(angle) * radius,
                    y: y + Math.sin(angle) * radius,
                    vx: (Math.random() - 0.5) * 3,
                   
                    vy: -Math.random() * 5,
                    life: 60,
                    size: 2,
                    color: '#fdd835',
                    glow: true,
            
                    fade: true
                });
            }
            
            addFloatText(`LLUVIA: ${hitCount} IMPACTOS`, x, y - 50, '#fdd835', 24);
            this.currentCooldown = this.cooldown;
            updateAbilitiesUI();
        }
    },
    
    freeze: {
        name: 'Congelación de Área', 
        cooldown: 1050, // Modificado: 2100 / 2
        currentCooldown: 0,
        range: 200, // Radio de efecto definido
        baseDuration: 180, // Duración base en frames

        select: function() {
          
            if (this.currentCooldown > 0) return false;
            addFloatText('SELECCIONA ÁREA A CONGELAR', canvas.width / 2, 100, '#00bcd4', 20);
            return true;
        },

        trigger: function(x, y) {
            let frozenCount = 0;
            const areaRadius = this.range;
            
            // --- MODIFICACIÓN: Duración escalable ---
            // Duración base + 5 frames por oleada
            const waveMult = Math.max(1, gameState.wave);
            const duration = this.baseDuration + (waveMult * 5);
            // ----------------------------------------

            enemies.forEach(e => {
                const dist = Math.hypot(e.x - x, e.y - y);
                if (dist <= areaRadius) {
                    e.applySlow(duration);
             
                    e.markHit(6);
                    frozenCount++;
                    
                    // Efecto de congelación en enemigo
                    for (let i = 0; i < 10; 
                        i++) {
                        gameState.particles.push({
                            x: e.x + (Math.random() - 0.5) * 30,
                            y: e.y + (Math.random() - 0.5) * 30,
     
                            vx: (Math.random() - 0.5) * 1,
                            vy: (Math.random() - 0.5) * 1,
                            life: 50,
          
                            size: 3,
                            color: '#00bcd4',
                            glow: true,
                       
                            fade: true
                        });
                    }
                }
            });
            // Partículas en el área
            for (let i = 0; i < 60; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * areaRadius;
                gameState.particles.push({
                    x: x + Math.cos(angle) * r,
                    y: y + Math.sin(angle) * r,
                    vx: (Math.random() - 0.5) * 2,
                   
                    vy: (Math.random() - 0.5) * 2,
                    life: 80,
                    size: 4,
                    color: '#00bcd4',
                    glow: true,
          
                    fade: true
                });
            }
            
            addFloatText(`¡${frozenCount} CONGELADOS!`, x, y, '#00bcd4', 28);
            this.currentCooldown = this.cooldown;
            updateAbilitiesUI();
        }
    },
    
    fireBomb: {
        name: 'Bomba de Fuego',
        cooldown: 900, // Modificado: 1800 / 2
        currentCooldown: 0,
        range: 120, // Radio de explosión

        select: function() {
            if (this.currentCooldown > 0) return false;
            addFloatText('SELECCIONA OBJETIVO', canvas.width / 2, 50, '#ff5722', 20);
            return true;
        },

        trigger: function(x, y) {
            const explosionRadius = this.range;
            let hitCount = 0;

            // --- MODIFICACIÓN: Daño escalable ---
            // Daño base 250 + 20% por oleada
            const waveMult = Math.max(1, gameState.wave);
            const damage = Math.floor(250 * (1 + (waveMult - 1) * 0.20));
            // ------------------------------------

            enemies.forEach(e => {
                const dist = Math.hypot(e.x - x, e.y - y);
                if (dist <= explosionRadius) {
                    e.hp -= damage;
                   
                    e.markHit(10);
                    hitCount++;
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            // Efecto de explosión
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8;
                gameState.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
      
                    life: 60,
                    size: 4 + Math.random() * 4,
                    color: Math.random() > 0.5 ? '#ff5722' : '#ff9800',
                    glow: true,
            
                    fade: true
                });
            }
            
            addFloatText(`¡BOOM! ${hitCount} HITS`, x, y - 80, '#ff5722', 26);
            this.currentCooldown = this.cooldown;
            updateAbilitiesUI();
        }
    },

    // NUEVA HABILIDAD: Desplegar Soldado
    deploySoldier: {
        name: 'Desplegar Soldado',
        cooldown: 1200, // Aumentado para equilibrar (Original: 400)
        currentCooldown: 0,
        
        select: function() {
            if (this.currentCooldown > 0) return false;
            addFloatText('UBICAR SOLDADO', canvas.width / 2, 120, '#1565c0', 20);
            return true;
        },

        trigger: function(x, y) {
            // Spawnear el soldado en la posición
            gameState.soldiers.push(new Soldier(x, y));
            // Efecto de aparición
            for (let i = 0; i < 20; i++) {
                gameState.particles.push({
                    x: x,
                    y: y,
                  
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 40,
                    size: 3,
                    color: '#90caf9',
     
                    glow: true,
                    fade: true
                });
            }

            addFloatText('¡A LA CARGA!', x, y - 40, '#1565c0', 24);
            this.currentCooldown = this.cooldown;
            updateAbilitiesUI();
        }
    }
};

// --- FUNCIONES GLOBALES DE HABILIDADES ---

function activateAbility(abilityKey) {
    if (!gameState.active) return;
    // Si ya tenemos esta habilidad pendiente, la cancelamos (toggle)
    if (gameState.pendingAbility === abilityKey) {
        gameState.pendingAbility = null;
        return;
    }

    const ability = abilities[abilityKey];
    if (!ability) return;
    if (ability.currentCooldown > 0) {
        addFloatText('HABILIDAD EN COOLDOWN', canvas.width / 2, 100, '#ff5252', 18);
        return;
    }
    
    // Intentamos seleccionar (comprobar requisitos)
    const ready = ability.select();
    if (ready) {
        gameState.pendingAbility = abilityKey;
        // No actualizamos UI de cooldown todavía, esperamos al click
    }
}

// Esta es la función que te faltaba o no se encontraba:
function updateAbilityCooldowns(dt) {
    for (let key in abilities) {
        if (abilities[key].currentCooldown > 0) {
            abilities[key].currentCooldown = Math.max(0, abilities[key].currentCooldown - dt);
        }
    }
    updateAbilitiesUI();
}

function updateAbilitiesUI() {
    const abilityButtons = {
        'arrowRain': document.getElementById('ability-arrow-rain'),
        'freeze': document.getElementById('ability-freeze'),
        'fireBomb': document.getElementById('ability-fire-bomb'),
        'deploySoldier': document.getElementById('ability-deploy-soldier')
    };
    
    for (let key in abilities) {
        const ability = abilities[key];
        const button = abilityButtons[key];
        if (!button) continue;
        
        // Reset visual
        button.style.borderColor = '';
        button.style.transform = '';

        // Highlight si está pendiente de lanzarse
        if (gameState.pendingAbility === key) {
            button.style.borderColor = '#ffd700';
            button.style.transform = 'scale(1.1)';
        }

        const oldCooldownDiv = button.querySelector('.ability-cooldown');
        if (oldCooldownDiv) {
            oldCooldownDiv.remove();
        }
        
        if (ability.currentCooldown > 0) {
            button.classList.add('ability-disabled');
            const cooldownSeconds = Math.ceil(ability.currentCooldown / 60);
            const cooldownDiv = document.createElement('div');
            cooldownDiv.className = 'ability-cooldown';
            cooldownDiv.textContent = cooldownSeconds + 's';
            button.appendChild(cooldownDiv);
        } else {
            button.classList.remove('ability-disabled');
        }
    }
}
/*[Fin de sección]*/