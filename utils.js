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


function setMapTheme(themeName) {
    if (!mapThemes[themeName]) {
        console.error(`Tema de mapa "${themeName}" no existe. Usando 'grass' por defecto.`);
themeName = 'grass';
    }
    
    gameState.currentMap = themeName;
// Efecto visual de cambio de mapa
    addFloatText(`¡MAPA CAMBIADO: ${mapThemes[themeName].name}!`, canvas.width / 2, canvas.height / 2, '#ffd700', 32);
// Partículas de transición
    for (let i = 0; i < 100; i++) {
        gameState.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            
life: 60,
            size: 3 + Math.random() * 4,
            color: mapThemes[themeName].buildableTile,
            glow: true,
            fade: true
        });
}
    
    console.log(`Mapa cambiado a: ${mapThemes[themeName].name}`);
}

function initializeMap(themeName) {
    if (!themeName) {
        themeName = 'grass';
// Mapa por defecto
    }
    
    if (!mapThemes[themeName]) {
        console.warn(`Tema "${themeName}" no encontrado. Usando 'grass'.`);
themeName = 'grass';
    }
    
    gameState.currentMap = themeName;
    console.log(`Mapa inicializado: ${mapThemes[themeName].name}`);
}

function distToSegment(p, v, w) {
    let l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);
let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function selectTower(type) {
    // Modificación: Verificación de desbloqueo
    if (towerTypes[type] && towerTypes[type].unlockWave) {
        if (gameState.wave < towerTypes[type].unlockWave) {
            // Si está bloqueada, no hacer nada (o mostrar mensaje)
            return;
        }
    }
    
    gameState.selectedTower = type;
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('selected'));
    // Buscar el botón específico por ID si es una torre, o por el event target
    let btn = document.getElementById('btn-' + type) || event.currentTarget;
    if(btn) btn.classList.add('selected');
}

function updateUI() {
    document.getElementById('lives').innerText = gameState.lives;
    document.getElementById('gold').innerText = Math.floor(gameState.gold);
    
    // Modificación: Actualización de estado de botones (Bloqueo/Desbloqueo)
    for (let type in towerTypes) {
        const btn = document.getElementById('btn-' + type);
        if (btn) {
            const unlockWave = towerTypes[type].unlockWave || 1;
            const smallText = btn.querySelector('small');
            
            if (gameState.wave < unlockWave) {
                btn.classList.add('locked');
                if (smallText) smallText.innerText = `Lvl ${unlockWave}`;
            } else {
                if (btn.classList.contains('locked')) {
                    // Efecto visual al desbloquear
                    btn.classList.remove('locked');
                    // Podríamos añadir un efecto visual aquí si quisiéramos
                }
                if (smallText) smallText.innerText = `(${towerTypes[type].cost}g)`;
            }
        }
    }
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
            tl: radius.tl ||
0,
            tr: radius.tr ||
0,
            br: radius.br ||
0,
            bl: radius.bl ||
0
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