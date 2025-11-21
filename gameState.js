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
    let count = 5 + Math.floor(wave * 1.2);
    let maxTier = Math.min(25, Math.floor(wave * 0.8));
    let minTier = Math.max(0, maxTier - 4);
    
    // Cada 10 oleadas, generar un jefe
    if (wave % 10 === 0 && wave > 0) {
        const bossTier = Math.min(29, 26 + Math.floor(wave / 10) - 1); // Jefes progresivos
        queue.push(bossTier);
        count = Math.max(1, count - 1); // Reducir enemigos normales cuando hay jefe
        addFloatText(`¡JEFE DE OLEADA ${wave}!`, canvas.width / 2, 100, '#ff0000', 32);
    }
    
    for(let i = 0; i < count; i++) {
        let r = Math.random();
        let selectedId = minTier;
        if (r > 0.9) selectedId = maxTier;
        else if (r > 0.4) selectedId = Math.max(minTier, maxTier - 1);
        else selectedId = minTier;

        if (wave % 5 === 0 && i === count - 1) selectedId = Math.min(25, maxTier + 1);
        queue.push(selectedId);
    }
    queue.sort((a,b) => a - b);
    Sounds.waveStart();
    return queue;
}

/*[Fin de sección]*/