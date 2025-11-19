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
    // NUEVO: sistema de partículas y ajustes visuales globales
    particles: [],
    settings: {
        particleLimit: 400
    }
};

function killEnemy(enemy) {
    if(enemy.dead) return;
    enemy.dead = true;
    gameState.gold += enemy.reward;
    aiDirector.recordDeath(enemy);
    updateUI();
    // Opcional: sonido de muerte (aquí o en enemy.reachBase)
}

function generateWave() {
    let queue = [];
    let wave = gameState.wave;
    let count = 5 + Math.floor(wave * 1.2);
    let maxTier = Math.min(19, Math.floor(wave * 0.8));
    let minTier = Math.max(0, maxTier - 4);
    for(let i=0; i<count; i++) {
        let r = Math.random();
        let selectedId = minTier;
        if (r > 0.9) selectedId = maxTier;
        else if (r > 0.4) selectedId = Math.max(minTier, maxTier - 1);
        else selectedId = minTier;
        if (wave % 5 === 0 && i === count - 1) selectedId = Math.min(19, maxTier + 1);
        queue.push(selectedId);
    }
    queue.sort((a,b) => a - b);
    Sounds.waveStart(); // ← Sonido al generar nueva oleada
    return queue;
}

/*[Fin de sección]*/