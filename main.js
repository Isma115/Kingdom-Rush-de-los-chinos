/*sección [CÓDIGO PRINCIPAL] Código principal de todo el juego (main)*/
// Archivo: main.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Iniciar la primera oleada
gameState.spawnQueue = generateWave();

function gameLoop(timestamp) { 
    // CORRECCIÓN: Si se llama manualmente (primera vez), timestamp es undefined.
    // Asignamos performance.now() para evitar cálculos con NaN.
    if (timestamp === undefined) timestamp = performance.now();

    // Inicialización segura del tiempo
    if (!window.lastTime) window.lastTime = timestamp;
    
    let deltaTime = timestamp - window.lastTime;
    window.lastTime = timestamp;

    // Calcular dt relativo a 60FPS
    let dt = deltaTime / (1000 / 60);

    // Cap de seguridad para evitar saltos enormes (lag o cambio de pestaña)
    // Si dt es infinito o NaN, forzamos 1
    if (!isFinite(dt) || dt > 10) dt = 1; 

    update(dt); 
    draw();

    if(gameState.active) requestAnimationFrame(gameLoop); 
}
gameLoop();

/*[Fin de sección]*/