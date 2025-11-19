// input.js
/*sección [INPUT] Código que gestiona el input*/
document.getElementById('gameCanvas').addEventListener('click', (e) => {
    if (!gameState.active) return;
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Snap al grid de 50×50
    const gridSize = 50;
    const gridX = Math.floor(x / gridSize) * gridSize + 25;  
    const gridY = Math.floor(y / gridSize) * gridSize + 25;

    // CORRECCIÓN: Buscar torre existente con tolerancia de radio aumentada a 35
    const existingTower = towers.find(t => {
        const distance = Math.hypot(t.x - x, t.y - y);
        return distance < 35; // Aumentado de 25 a 35 para facilitar la selección
    });

    if (existingTower) {
        // CORRECCIÓN: Mejorar directamente sin establecer torre seleccionada
        existingTower.upgrade();
        return;
    }

    // Si el punto exacto del grid no es válido → no construir
    if (!canBuild(gridX, gridY)) {
        return;
    }

    const type = gameState.selectedTower;
    const cost = towerTypes[type].cost;
    if (gameState.gold >= cost) {
        towers.push(new Tower(gridX, gridY, type));
        gameState.gold -= cost;
        updateUI();
    }
});

// CORRECCIÓN: Eliminar los event listeners de teclado que ya no son necesarios
// ya que ahora se mejora directamente al hacer clic
/*[Fin de sección]*/