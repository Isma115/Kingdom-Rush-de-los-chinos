/*sección [UTILS] Utiles para el código*/
function canBuild(x, y) {
    // IMPORTANTE: solo permitir centros exactos del grid 50×50
    // (x e y ya vienen "snapeados" desde el input)
    // Se ha movido aquí para ser la primera comprobación y
    // asegurar que x e y son centros de grid antes de las demás comprobaciones.
    if (x % 50 !== 25 || y % 50 !== 25) return false;
    // NUEVO: Reducir a la mitad las casillas construibles
    // Solo permitir construir en casillas con patrón de tablero de ajedrez
    const gridX = Math.floor(x / 50);
    const gridY = Math.floor(y / 50);
    if ((gridX + gridY) % 2 !== 0) return false;
    // Fuera de bordes
    // (Nota: Los bordes originales ya implican los centros [25, 475])
    if (x < 25 || x > 1175 || y < 25 || y > 475) return false;
    // 25 = centro del primer cuadrado, 1175 = centro del último (nuevo ancho: 1200px)

    // Colisión con torres existentes (radio 35 como antes)
    for (let t of towers) {
        if (Math.hypot(t.x - x, t.y - y) < 35) return false;
    }

    // Colisión con el camino
    for (let i = 0; i < path.length - 1; i++) {
        if (distToSegment({x, y}, path[i], path[i+1]) < 35) return false;
    }

    return true;
}

function distToSegment(p, v, w) {
    let l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
    if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function selectTower(type) {
    gameState.selectedTower = type;
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function updateUI() {
    document.getElementById('lives').innerText = gameState.lives;
    document.getElementById('gold').innerText = Math.floor(gameState.gold);
}

function gameOver() {
    gameState.active = false;
    document.getElementById('game-over').style.display = 'block';
}