// gameLoop.js
/*sección [GAMELOOP] Bucle principal del juego*/
function update() {
    if (!gameState.active) return;

    aiDirector.timer++;
    if (aiDirector.timer >= aiDirector.checkInterval) {
        aiDirector.evaluate();
        aiDirector.timer = 0;
    }

    if (gameState.spawnQueue.length > 0) {
        if (gameState.spawnTimer <= 0) {
            enemies.push(new Enemy(gameState.spawnQueue.shift()));
            let lastEnemy = enemies[enemies.length-1];
            gameState.spawnTimer = Math.max(20, 60 - (lastEnemy.speed * 10)); 
        } else gameState.spawnTimer--;
    } else if (enemies.length === 0 && gameState.waveInProgress) {
        gameState.waveInProgress = false;
        gameState.waveTimer = 180;
    }

    if (!gameState.waveInProgress) {
        document.getElementById('wave').innerText = "Sig: " + Math.ceil(gameState.waveTimer/60);
        if (gameState.waveTimer <= 0) {
            gameState.wave++;
            gameState.spawnQueue = generateWave();
            gameState.waveInProgress = true;
            updateUI();
        } else gameState.waveTimer--;
    } else {
        document.getElementById('wave').innerText = gameState.wave;
    }

    enemies.forEach(e => e.update());
    towers.forEach(t => t.update());
    projectiles.forEach(p => p.update());
    
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].hp <= 0) enemies.splice(i, 1);
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hit) projectiles.splice(i, 1);
    for (let i = floatText.length - 1; i >= 0; i--) {
        floatText[i].y -= 0.5;
        floatText[i].life--;
        if(floatText[i].life <= 0) floatText.splice(i,1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // === FONDO CON GRID SUTIL Y CASILLAS CONSTRUIBLES ===
    ctx.fillStyle = '#5c9646';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Resaltar casillas donde SÍ se puede construir con un verde ligeramente más claro
    for (let gx = 0; gx < 16; gx++) {          // 800px / 50px = 16 columnas
        for (let gy = 0; gy < 10; gy++) {      // 500px / 50px = 10 filas
            let cx = gx * 50 + 25;
            let cy = gy * 50 + 25;
            if (canBuild(cx, cy)) {
                ctx.fillStyle = '#639d4d'; // Verde ligeramente más claro, menos contraste
                ctx.fillRect(gx * 50, gy * 50, 50, 50);
            }
        }
    }

    // Grid muy tenue (líneas de 1px, 8% opacidad) - SOLO EN CASILLAS CONSTRUIBLES
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    
    // Dibujar grid solo en casillas donde se puede construir (patrón tablero de ajedrez)
    for (let gx = 0; gx < 16; gx++) {          // 800px / 50px = 16 columnas
        for (let gy = 0; gy < 10; gy++) {      // 500px / 50px = 10 filas
            // Solo dibujar si cumple el patrón de tablero de ajedrez
            if ((gx + gy) % 2 === 0) {
                let x = gx * 50;
                let y = gy * 50;
                
                // Líneas verticales (izquierda y derecha de la casilla)
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 50);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + 50, y);
                ctx.lineTo(x + 50, y + 50);
                ctx.stroke();
                
                // Líneas horizontales (arriba y abajo de la casilla)
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

    // === ENTIDADES ===
    towers.forEach(t => t.draw());
    enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.draw());
    
    // === TEXTO FLOTANTE ===
    floatText.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = (ft.size || 14) + 'px Arial';
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
    });
}

function addFloatText(text, x, y, color, size) {
    floatText.push({text, x, y, color, life: 60, size: size || 18});
}

/*[Fin de sección]*/