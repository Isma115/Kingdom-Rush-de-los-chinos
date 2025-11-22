/*sección [UTILS] Utiles para el código*/
function canBuild(x, y) {
    // IMPORTANTE: solo permitir centros exactos del grid 50×50
    if (x % 50 !== 25 || y % 50 !== 25) return false;

    // NUEVO: Ahora hay dos filas de torres posibles
    // Fila superior: Y = 75 → 425 (gridY 1 a 8)
    // Fila inferior (nueva): Y = 525 → 875 (gridY 10 a 17)
    const gridY = Math.floor(y / 50);
    const isTopRow = gridY >= 1 && gridY <= 8;
    const isBottomRow = gridY >= 10 && gridY <= 17;
    if (!isTopRow && !isBottomRow) return false;

    // Patrón de tablero de ajedrez solo en las filas permitidas
    const gridX = Math.floor(x / 50);
    if ((gridX + gridY) % 2 !== 0) return false;

    // Fuera de bordes (ancho ampliado a 1900px, alto ahora permite hasta Y ≈ 900)
    if (x < 25 || x > 1875 || y < 75 || y > 875) return false;

    // Colisión con torres existentes
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

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = {
            tl: radius.tl || 0,
            tr: radius.tr || 0,
            br: radius.br || 0,
            bl: radius.bl || 0
        };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

/*[Fin de sección]*/