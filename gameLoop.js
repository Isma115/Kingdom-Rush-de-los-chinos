/*sección [GAMELOOP] Bucle principal del juego*/
function update(dt = 1.0) {
    if (!gameState.active) return;
// Timer del director afectado por delta time
    aiDirector.timer += dt;
    if (aiDirector.timer >= aiDirector.checkInterval) {
        aiDirector.evaluate();
        aiDirector.timer = 0;
    }

    if (gameState.spawnQueue.length > 0) {
        if (gameState.spawnTimer <= 0) {
            enemies.push(new Enemy(gameState.spawnQueue.shift()));
    let lastEnemy = enemies[enemies.length-1];
            // Spawn timer se define en frames, ahora se consumirá con dt
            gameState.spawnTimer = Math.max(20, 60 - (lastEnemy.speed * 10));
    } else gameState.spawnTimer -= dt;
    } else if (enemies.length === 0 && gameState.waveInProgress) {
        gameState.waveInProgress = false;
    gameState.waveTimer = 180;
    }

    if (!gameState.waveInProgress) {
        // Ajuste visual para el texto de la UI
        document.getElementById('wave').innerText = "Sig: " + Math.ceil(gameState.waveTimer/60);
    if (gameState.waveTimer <= 0) {
            gameState.wave++;
            gameState.spawnQueue = generateWave();
    gameState.waveInProgress = true;
            updateUI();
        } else gameState.waveTimer -= dt;
    } else {
        document.getElementById('wave').innerText = gameState.wave;
    }

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
        if(floatText[i].life <= 0) floatText.splice(i,1);
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
    // Añadir ligera variación de iluminación y un brillo ambiental dinámico
    // capa base
    ctx.fillStyle = '#5c9646';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Luz ambiental superior (sutil gradiente)
    let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, hexToRgba('#5c9646', 0.04));
    bgGrad.addColorStop(1, hexToRgba('#2e7d32', 0.04));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Resaltar casillas donde SÍ se puede construir con un verde ligeramente más claro
    for (let gx = 0; gx < 24; gx++) {          // 1200px / 50px = 24 columnas (nuevo ancho)
        for (let gy = 0; gy < 10; gy++) {      // 500px / 50px = 10 filas
            let cx = gx * 50 + 25;
    let cy = gy * 50 + 25;
            if (canBuild(cx, cy)) {
                ctx.fillStyle = '#639d4d';
                // Verde ligeramente más claro, menos contraste
                ctx.fillRect(gx * 50, gy * 50, 50, 50);
    }
        }
    }

    // Grid muy tenue (líneas de 1px, 8% opacidad) - SOLO EN CASILLAS CONSTRUIBLES
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    
    // Dibujar grid solo en casillas donde se puede construir (patrón tablero de ajedrez)
    for (let gx = 0; gx < 24; gx++) {          // 1200px / 50px = 24 columnas (nuevo ancho)
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
    // === PARTICULAS (debajo de entidades para profundidad) ===
    if (gameState.particles && Array.isArray(gameState.particles)) {
        for (let pt of gameState.particles) {
            ctx.globalAlpha = Math.max(0.03, Math.min(1, pt.opacity !== undefined ? pt.opacity : (pt.life / 60)));
// mezcla de color simple
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
        // Efecto de rebote sutil
        let bob = Math.sin((60 - ft.life) * 0.12) * 4;
        ctx.fillText(ft.text, ft.x, ft.y + bob);
    });
    // === PARTICULAS (encima de todo para ciertos efectos) ===
    if (gameState.particles && Array.isArray(gameState.particles)) {
        for (let pt of gameState.particles) {
            // dibujar de nuevo los pt con brillo si son especiales
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
    floatText.push({text, x, y, color, life: 60, size: size || 18});
}