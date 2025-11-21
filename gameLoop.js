/*sección [GAMELOOP] Bucle principal del juego*/
function update(dt = 1.0) {
    if (!gameState.active) return;

    // === DEBUG: God Mode / Oro infinito ===
    if (gameState.debug.infiniteGold || gameState.debug.godMode) {
        gameState.gold = 999999;
    }
    if (gameState.debug.infiniteLives || gameState.debug.godMode) {
        gameState.lives = 999;
    }
    updateUI();

    // Timer del director
    aiDirector.timer += dt;
    if (aiDirector.timer >= aiDirector.checkInterval) {
        aiDirector.evaluate();
        aiDirector.timer = 0;
    }

    // DEBUG: oleadas instantáneas o salto manual
    if (gameState.debug.instantWave || gameState.debug.godMode) {
        gameState.waveTimer = 0;
    }
    if (gameState.debug.skipWave) {
        gameState.debug.skipWave = false;
        gameState.wave++;
        gameState.spawnQueue = generateWave();
        gameState.waveInProgress = true;
        gameState.waveTimer = 0;
        updateUI();
    }

    if (gameState.spawnQueue.length > 0) {
        if (gameState.spawnTimer <= 0) {
            enemies.push(new Enemy(gameState.spawnQueue.shift()));
            let lastEnemy = enemies[enemies.length - 1];
            gameState.spawnTimer = Math.max(20, 60 - (lastEnemy.speed * 10));
            // DEBUG: oleadas instantáneas → spawn inmediato
            if (gameState.debug.instantWave || gameState.debug.godMode) {
                gameState.spawnTimer = 0;
            }
        } else gameState.spawnTimer -= dt;
    } else if (enemies.length === 0 && gameState.waveInProgress) {
        gameState.waveInProgress = false;
        gameState.waveTimer = 180;
    }

    if (!gameState.waveInProgress) {
        document.getElementById('wave').innerText = "Sig: " + Math.ceil(gameState.waveTimer / 60);
        if (gameState.waveTimer <= 0) {
            gameState.wave++;
            gameState.spawnQueue = generateWave();
            gameState.waveInProgress = true;
            updateUI();
        } else gameState.waveTimer -= dt;
    } else {
        document.getElementById('wave').innerText = gameState.wave;
    }

    // === CORRECCIÓN: actualizar cooldowns de habilidades ===
    updateAbilityCooldowns(dt);   // ← ← ← ESTA ES LA LÍNEA QUE FALTABA

    // Pasar dt a las entidades
    enemies.forEach(e => e.update(dt));
    towers.forEach(t => t.update(dt));
    projectiles.forEach(p => p.update(dt));

    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].hp <= 0) enemies.splice(i, 1);
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hit) projectiles.splice(i, 1);

    // Texto flotante suavizado con dt
    for (let i = floatText.length - 1; i >= 0; i--) {
        floatText[i].y -= 0.5 * dt;
        floatText[i].life -= dt;
        if (floatText[i].life <= 0) floatText.splice(i, 1);
    }

    // Partículas suavizadas con dt
    if (gameState.particles && Array.isArray(gameState.particles)) {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            let pt = gameState.particles[i];
            pt.x += (pt.vx || 0) * dt;
            pt.y += (pt.vy || 0) * dt;
            // aplicar gravedad leve escalada por dt
            if (!pt.noGravity) pt.vy += 0.03 * dt;
            pt.life -= dt;
            if (pt.fade) {
                pt.opacity = (pt.life / 60);
            }
            if (pt.life <= 0) gameState.particles.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // === FONDO CON GRID SUTIL Y CASILLAS CONSTRUIBLES ===
    ctx.fillStyle = '#5c9646';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Luz ambiental superior (sutil gradiente)
    let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, hexToRgba('#5c9646', 0.04));
    bgGrad.addColorStop(1, hexToRgba('#2e7d32', 0.04));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Resaltar casillas donde SÍ se puede construir (filas 1-8 y 10-17)
    for (let gx = 0; gx < 38; gx++) {
        for (let gy = 0; gy < 18; gy++) {
            let cx = gx * 50 + 25;
            let cy = gy * 50 + 25;
            if (canBuild(cx, cy)) {
                ctx.fillStyle = '#639d4d';
                ctx.fillRect(gx * 50, gy * 50, 50, 50);
            }
        }
    }

    // Grid muy tenue solo en casillas construibles
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < 38; gx++) {
        for (let gy = 0; gy < 18; gy++) {
            const gridY = gy;
            const isTopRow = gridY >= 1 && gridY <= 8;
            const isBottomRow = gridY >= 10 && gridY <= 17;
            if (!isTopRow && !isBottomRow) continue;

            if ((gx + gridY) % 2 === 0) {
                let x = gx * 50;
                let y = gy * 50;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 50);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + 50, y);
                ctx.lineTo(x + 50, y + 50);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 50, y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x, y + 50);
                ctx.lineTo(x + 50, y + 50);
                ctx.stroke();
            }
        }
    }

    // === CAMINO ===
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 52;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();

    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 44;
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();

    // === PARTICULAS (debajo de entidades) ===
    if (gameState.particles && Array.isArray(gameState.particles)) {
        for (let pt of gameState.particles) {
            ctx.globalAlpha = Math.max(0.03, Math.min(1, pt.opacity !== undefined ? pt.opacity : (pt.life / 50)));
            if (pt.color) ctx.fillStyle = pt.color;
            else ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size || 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // === ENTIDADES ===
    towers.forEach(t => t.draw());
    enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.draw());

    // === TEXTO FLOTANTE ===
    floatText.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = (ft.size || 14) + 'px Arial';
        ctx.textAlign = "center";
        let bob = Math.sin((60 - ft.life) * 0.12) * 4;
        ctx.fillText(ft.text, ft.x, ft.y + bob);
    });

    // === PARTICULAS ENCIMA (glow) ===
    if (gameState.particles && Array.isArray(gameState.particles)) {
        for (let pt of gameState.particles) {
            if (pt.glow) {
                ctx.globalAlpha = Math.max(0.02, Math.min(0.9, (pt.life / 60)));
                let rg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.size * 6);
                rg.addColorStop(0, hexToRgba(pt.color || '#fff', 0.45));
                rg.addColorStop(1, hexToRgba(pt.color || '#fff', 0));
                ctx.fillStyle = rg;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size * 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }
}

function addFloatText(text, x, y, color, size) {
    floatText.push({ text, x, y, color, life: 60, size: size || 18 });
}

/*[Fin de sección]*/