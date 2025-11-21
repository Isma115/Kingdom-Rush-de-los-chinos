// gameState.js
/*sección [ESTADO DE JUEGO] Control del estado de juego*/
// --- GLOBALS ---
const enemies = [];
const towers = [];
const projectiles = [];
const floatText = [];

// --- GAME STATE ---
let gameState = {
    lives: 25, gold: 250, wave: 1, active: true,
    selectedTower: 'archer', spawnQueue: [], spawnTimer: 0, waveTimer: 0, waveInProgress: true,
    
    // NUEVO: Sistema de apuntado de habilidades
    pendingAbility: null, // String: 'arrowRain', 'freeze', etc.
    mouseX: 0,
    mouseY: 0,

    // NUEVO: sistema de partículas y ajustes visuales globales
    particles: [],
    settings: {
        particleLimit: 400
    },
    // === DEBUG CONTROLES (solo desarrollo) ===
    debug: {
        infiniteLives: false,
        infiniteGold: false,
        instantWave: false,
        godMode: false,          // vidas infinitas + oro infinito + oleadas instantáneas
        killAllEnemies: false,   // se activa un frame y mata todo
        skipWave: false          // salta directamente a la siguiente oleada
    }
};

function killEnemy(enemy) {
    if(enemy.dead) return;
    enemy.dead = true;
    gameState.gold += enemy.reward;

    // DEBUG: si está activo el modo dios o vidas infinitas, no restamos vidas
    if (!gameState.debug.godMode && !gameState.debug.infiniteLives) {
        if (enemy.reachBase && enemy.reachBase === true) {
            gameState.lives--;
        }
    }

    aiDirector.recordDeath(enemy);
    updateUI();

    // DEBUG: matar todos los enemigos en un solo frame
    if (gameState.debug.killAllEnemies) {
        gameState.debug.killAllEnemies = false;
        enemies.forEach(e => {
            if (!e.dead) {
                e.hp = 0;
                killEnemy(e);
            }
        });
    }
}

function generateWave() {
    let queue = [];
    let wave = gameState.wave;
    let baseCount = 5;
    let waveMultiplier = 1.2;
    let count = baseCount + Math.floor(wave * waveMultiplier);
    let maxTier = Math.min(36, Math.floor(wave * 0.8)); // Aumentado a 36 para incluir nuevos enemigos
    let minTier = Math.max(0, maxTier - 4);
    
    // NUEVOS ENEMIGOS PROGRESIVOS POR OLEADAS ALTAS
    if (wave >= 30 && wave < 40) {
        // Oleadas 30-39: Aparece Fénix (id: 30)
        maxTier = Math.max(maxTier, 30);
    } else if (wave >= 40 && wave < 50) {
        // Oleadas 40-49: Aparecen Fénix y Kraken
        maxTier = Math.max(maxTier, 31);
    } else if (wave >= 50 && wave < 60) {
        // Oleadas 50-59: Aparecen Fénix, Kraken y Centinela
        maxTier = Math.max(maxTier, 32);
    } else if (wave >= 60 && wave < 70) {
        // Oleadas 60-69: Aparecen hasta Leviatán
        maxTier = Math.max(maxTier, 33);
    } else if (wave >= 70 && wave < 80) {
        // Oleadas 70-79: Aparecen hasta Anciano
        maxTier = Math.max(maxTier, 34);
    } else if (wave >= 80 && wave < 90) {
        // Oleadas 80-89: Aparecen hasta Celestial
        maxTier = Math.max(maxTier, 35);
    } else if (wave >= 90) {
        // Oleadas 90+: Aparecen todos incluyendo Abismal
        maxTier = Math.max(maxTier, 36);
    }
    
    // Aumento adicional de enemigos para oleadas más altas
    if (wave > 20) {
        count += Math.floor((wave - 20) * 0.5);
    }
    if (wave > 50) {
        count += Math.floor((wave - 50) * 0.3);
    }
    if (wave > 100) {
        count += Math.floor((wave - 100) * 0.2);
    }
    
    // Cada 10 oleadas, generar un jefe
    if (wave % 10 === 0 && wave > 0) {
        const bossTier = Math.min(29, 26 + Math.floor(wave / 10) - 1);
        queue.push(bossTier);
        count = Math.max(1, count - 1);
        addFloatText(`¡JEFE DE OLEADA ${wave}!`, canvas.width / 2, 100, '#ff0000', 32);
    }
    
    for(let i = 0; i < count; i++) {
        let r = Math.random();
        let selectedId = minTier;
        
        // MEJORADA: Distribución más inteligente de enemigos
        if (r > 0.85) {
            // 15% de probabilidad para el enemigo más fuerte disponible
            selectedId = maxTier;
        } else if (r > 0.60) {
            // 25% de probabilidad para el segundo más fuerte
            selectedId = Math.max(minTier, maxTier - 1);
        } else if (r > 0.30) {
            // 30% de probabilidad para el tercero más fuerte
            selectedId = Math.max(minTier, maxTier - 2);
        } else {
            // 30% de probabilidad para el más débil del rango
            selectedId = minTier;
        }

        // Cada 5 oleadas, el último enemigo es más fuerte
        if (wave % 5 === 0 && i === count - 1) {
            selectedId = Math.min(maxTier, selectedId + 2);
        }
        
        queue.push(selectedId);
    }
    queue.sort((a,b) => a - b);
    Sounds.waveStart();
    return queue;
}

/*[Fin de sección]*/