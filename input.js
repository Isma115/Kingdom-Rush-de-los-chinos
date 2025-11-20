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

    // Buscar torre existente para mejorar
    const existingTower = towers.find(t => Math.hypot(t.x - x, t.y - y) < 35);

    if (existingTower) {
        // DEBUG: oro infinito permite mejorar gratis
        if (gameState.debug.infiniteGold || gameState.debug.godMode) {
            existingTower.level++;
            existingTower.stats.damage = Math.floor(existingTower.stats.damage * 1.5);
            existingTower.stats.range = existingTower.stats.range * 1.1;
            addFloatText("UPGRADE FREE!", existingTower.x, existingTower.y - 30, "#00e5ff", 20);
            Sounds.towerUpgrade();
            updateUI();
        } else {
            existingTower.upgrade();
        }
        return;
    }

    if (!canBuild(gridX, gridY)) return;

    const type = gameState.selectedTower;
    const cost = towerTypes[type].cost;

    // DEBUG: oro infinito = infinito → construir gratis
    if (gameState.debug.infiniteGold || gameState.debug.godMode || gameState.gold >= cost) {
        if (!(gameState.debug.infiniteGold || gameState.debug.godMode)) {
            gameState.gold -= cost;
        }
        towers.push(new Tower(gridX, gridY, type));
        updateUI();
    }
});

// CORRECCIÓN: Eliminar los event listeners de teclado que ya no son necesarios
// ya que ahora se mejora directamente al hacer clic
/*[Fin de sección]*/