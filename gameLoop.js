/*sección [GAMELOOP] Bucle principal del juego*/
/**
 * GAMELOOP - Bucle principal del juego
 * * Funcionalidades principales:
 * - Gestión del ciclo de actualización y renderizado del juego
 * - Control de estados de debug (God Mode, oro infinito, vidas infinitas)
 * - Sistema de oleadas de enemigos con temporizador
 * - Actualización de entidades (enemigos, torres, proyectiles)
 * - Sistema de partículas y texto flotante
 * - Gestión de cooldowns de habilidades
 * - Renderizado del mapa con grid, camino y casillas construibles
 */
function update(dt = 1.0) {
    if (!gameState.active) return;
    
    // === GESTIÓN DEL HÉROE Y SU REAPARICIÓN ===
    if (gameState.hero) {
        if (gameState.hero.dead && gameState.hero.isRespawning) {
            // Decrementar temporizador global de reaparición
            if (gameState.heroRespawnTimer > 0) {
                gameState.heroRespawnTimer -= dt;
                
                // Mostrar temporizador cada segundo
                if (Math.floor(gameState.heroRespawnTimer / 60) !== Math.floor((gameState.heroRespawnTimer + dt) / 60)) {
                    let secondsLeft = Math.ceil(gameState.heroRespawnTimer / 60);
                    if (secondsLeft > 0) {
                        addFloatText(`Héroe reaparece en ${secondsLeft}s`, canvas.width / 2, 150, '#ffff00', 20);
                    }
                }
                
                // Cuando el temporizador llega a 0, reaparece el héroe
                if (gameState.heroRespawnTimer <= 0) {
                    gameState.hero.respawn();
                    gameState.heroRespawnTimer = 0;
                }
            }
        } else if (!gameState.hero.dead) {
            // Actualizar héroe si está vivo
            gameState.hero.update(dt);
        }
    }
    
    // === ACTUALIZAR SOLDADOS ===
    if (gameState.soldiers) {
        for (let s of gameState.soldiers) {
            if (!s.dead) s.update(dt);
        }
        // Eliminar soldados muertos del array sin reasignarlo
        for (let i = gameState.soldiers.length - 1; i >= 0; i--) {
            if (gameState.soldiers[i].dead) {
                gameState.soldiers.splice(i, 1);
            }
        }
    }

    // === GESTIÓN DE DEBUG ===
    if (gameState.debug.godMode) {
        gameState.debug.infiniteLives = true;
        gameState.debug.infiniteGold = true;
        gameState.debug.instantWave = true;
    }
    if (gameState.debug.infiniteGold) {
        gameState.gold = 999999;
    }

    // === GESTIÓN DE OLEADAS ===
    if (gameState.debug.killAllEnemies) {
        for (let e of enemies) {
            e.hp = 0;
            killEnemy(e);
        }
        gameState.debug.killAllEnemies = false;
    }
    if (gameState.debug.skipWave) {
        for (let e of enemies) {
            e.hp = 0;
            killEnemy(e);
        }
        gameState.waveInProgress = false;
        gameState.waveTimer = 0;
        gameState.debug.skipWave = false;
    }

    // === COOLDOWNS DE HABILIDADES ===
    for (let key in abilities) {
        if (abilities[key].currentCooldown > 0) {
            abilities[key].currentCooldown -= dt;
            if (abilities[key].currentCooldown < 0) {
                abilities[key].currentCooldown = 0;
            }
        }
    }
    updateAbilitiesUI();

    // === TORRES ===
    for (let t of towers) {
        t.update(dt);
    }

    // === ENEMIGOS ===
    if (gameState.spawnQueue.length > 0) {
        gameState.spawnTimer += dt;
        if (gameState.spawnTimer >= (gameState.debug.instantWave ? 1 : 25)) {
            gameState.spawnTimer = 0;
            let rosterId = gameState.spawnQueue.shift();
            enemies.push(new Enemy(rosterId));
        }
    } else if (enemies.length === 0 && gameState.waveInProgress) {
        gameState.waveInProgress = false;
        gameState.waveTimer = 180;
    }

    if (!gameState.waveInProgress) {
        document.getElementById('wave').innerText = "Sig: " + Math.ceil(gameState.waveTimer / 60);
        if (gameState.waveTimer <= 0) {
            gameState.wave++;
            aiDirector.increaseDifficulty(0.02);
            gameState.spawnQueue = generateWave();
            gameState.waveInProgress = true;
            updateUI();
        } else {
            gameState.waveTimer -= dt;
        }
    }

    for (let e of enemies) {
        e.update(dt);
    }
    
    // Eliminar enemigos muertos usando splice para mutar el array sin reasignarlo
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
            enemies.splice(i, 1);
        }
    }

    // === PROYECTILES ===
    for (let p of projectiles) {
        p.update(dt);
    }
    
    // Eliminar proyectiles que ya impactaron usando splice
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].hit) {
            projectiles.splice(i, 1);
        }
    }

    // === TEXTO FLOTANTE ===
    for (let t of floatText) {
        t.y -= 0.8 * dt;
        t.life -= dt;
    }
    
    // Eliminar textos que expiraron usando splice
    for (let i = floatText.length - 1; i >= 0; i--) {
        if (floatText[i].life <= 0) {
            floatText.splice(i, 1);
        }
    }

    // === PARTÍCULAS ===
    if (gameState.particles && Array.isArray(gameState.particles)) {
        for (let pt of gameState.particles) {
            pt.x += (pt.vx || 0) * dt;
            pt.y += (pt.vy || 0) * dt;
            pt.life -= dt;
            if (pt.fade) {
                pt.opacity = Math.max(0, pt.life / 60);
            }
        }
        
        // Eliminar partículas muertas usando splice
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            if (gameState.particles[i].life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
        
        if (gameState.particles.length > gameState.settings.particleLimit) {
            gameState.particles.splice(0, gameState.particles.length - gameState.settings.particleLimit);
        }
    }

    // === EVALUACIÓN DE DIFICULTAD ===
    aiDirector.timer += dt;
    if (aiDirector.timer >= aiDirector.checkInterval) {
        aiDirector.timer = 0;
        aiDirector.evaluate();
    }
}

function draw() {
    // Obtener el tema actual
    const theme = mapThemes[gameState.currentMap] || mapThemes.grass;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // === FONDO CON TEMA ACTUAL ===
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Luz ambiental superior (sutil gradiente)
    let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, hexToRgba(theme.backgroundGradientTop, 0.04));
    bgGrad.addColorStop(1, hexToRgba(theme.backgroundGradientBottom, 0.04));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Resaltar casillas donde SÍ se puede construir (filas 1-8 y 10-17)
    for (let gx = 0; gx < 38; gx++) {
        for (let gy = 0; gy < 18; gy++) {
            let cx = gx * 50 + 25;
            let cy = gy * 50 + 25;
            if (canBuild(cx, cy)) {
                ctx.fillStyle = theme.buildableTile;
                ctx.fillRect(gx * 50, gy * 50, 50, 50);
            }
        }
    }

    // Grid muy tenue solo en casillas construibles
    ctx.strokeStyle = theme.gridLine;
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

    // === CAMINO CON COLORES DEL TEMA ===
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = theme.pathBorder;
    ctx.lineWidth = 52;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    ctx.strokeStyle = theme.pathFill;
    ctx.lineWidth = 44;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    
    // === PARTÍCULAS (debajo de entidades) ===
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
    if (gameState.soldiers) gameState.soldiers.forEach(s => s.draw()); // Dibujar soldados
    
    // === DIBUJAR HÉROE ===
    if (gameState.hero) gameState.hero.draw();

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
    
    // === PARTÍCULAS ENCIMA (glow) ===
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