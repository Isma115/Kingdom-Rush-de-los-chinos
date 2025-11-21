/*sección [INPUT] Código que gestiona el input*/
// TRACKING DEL MOUSE PARA PREVISUALIZACIÓN DE HABILIDADES
document.getElementById('gameCanvas').addEventListener('mousemove', (e) => {
    if (!gameState.active) return;
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;
});

document.getElementById('gameCanvas').addEventListener('click', (e) => {
    if (!gameState.active) return;
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. GESTIÓN DE HABILIDADES PENDIENTES (Click en el mapa para lanzar)
    if (gameState.pendingAbility) {
        const abilityKey = gameState.pendingAbility;
        const ability = abilities[abilityKey];
        
        
        if (ability) {
            // Ejecutar efecto en X, Y
            ability.trigger(x, y);
            // Limpiar estado pendiente
            gameState.pendingAbility = null;
            // Quitar resaltado de botones
            updateAbilitiesUI();
           
            return; // Detener propagación (no construir torres ni seleccionar nada más)
        }
    }

    // Snap al grid de 50×50
    const gridSize = 50;
    const gridX = Math.floor(x / gridSize) * gridSize + 25;  
    const gridY = Math.floor(y / gridSize) * gridSize + 25;

    // Buscar torre existente para mejorar O eliminar
    const existingTower = towers.find(t => Math.hypot(t.x - x, t.y - y) < 35);

    // === LÓGICA DE LA PALA (ELIMINAR ESTRUCTURA) ===
    if (gameState.selectedTower === 'shovel') {
        if (existingTower) {
            // Calcular reembolso (70% del coste base por nivel)
            const refund = Math.floor((existingTower.baseCost * existingTower.level) * 0.7);
            gameState.gold += refund;
            
            // Texto flotante de venta
            addFloatText(`+${refund}g`, existingTower.x, existingTower.y - 20, '#ffd700', 20);
            addFloatText("SOLD", existingTower.x, existingTower.y - 40, '#ff5252', 16);
            
            // Eliminar torre del array
            const index = towers.indexOf(existingTower);
            if (index > -1) {
                towers.splice(index, 1);
            }
            
            // Sonido de venta (usamos el de hit como feedback genérico por ahora)
            if (Sounds && Sounds.enemyHit) Sounds.enemyHit();
            
            updateUI();
        }
        return; // La pala no construye ni mejora, solo elimina o no hace nada
    }

    if (existingTower) {
        // DEBUG: oro infinito permite mejorar gratis PERO CON LÍMITE DE NIVEL 10
        if (gameState.debug.infiniteGold || gameState.debug.godMode) {
            if (existingTower.level >= 10) {
                addFloatText("MAX LEVEL", existingTower.x, existingTower.y - 30, "#ffeb3b", 16);
                return;
            }
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
    // Si por error se intenta construir la pala como torre, evitamos el crash
    if (type === 'shovel') return;

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