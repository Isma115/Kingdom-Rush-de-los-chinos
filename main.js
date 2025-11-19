// main.js
/*sección [CÓDIGO PRINCIPAL] Código principal de todo el juego (main)*/
// Archivo: main.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Iniciar la primera oleada
gameState.spawnQueue = generateWave();

function gameLoop() { 
    update(); 
    draw(); 
    if(gameState.active) requestAnimationFrame(gameLoop); 
}

gameLoop();

/*[Fin de sección]*/