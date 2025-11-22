/* sección [PRINCIPAL] Código que prepara todo y ejecuta todo */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Expandir el canvas para que ocupe más espacio en anchura
canvas.width = 1900;
canvas.height = 500;

// Iniciar la primera oleada
gameState.spawnQueue = generateWave();

function setupMapSelector() {
    // Crear selector de mapas en la UI
    const mapSelectorHTML = `
        <div id="map-selector" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 8px;">
            <div style="color: white; font-weight: bold; margin-bottom: 5px;">🗺️ MAPA:</div>
            <select id="map-select" style="padding: 5px; border-radius: 4px; cursor: pointer;">
                <option value="grass">🌿 Pradera</option>
                <option value="snow">❄️ Nieve</option>
                <option value="beach">🏖️ Playa</option>
                <option value="mountain">⛰️ Montaña</option>
            </select>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', mapSelectorHTML);
    
    const mapSelect = document.getElementById('map-select');
    mapSelect.value = gameState.currentMap;
    
    mapSelect.addEventListener('change', (e) => {
        setMapTheme(e.target.value);
    });
}

function gameLoop(timestamp) { 
    // CORRECCIÓN: Si se llama manualmente (primera vez), timestamp es undefined.
    // Asignamos performance.now() para evitar cálculos con NaN.
    if (timestamp === undefined) timestamp = performance.now();

    // Inicialización segura del tiempo
    if (!window.lastTime) window.lastTime = timestamp;
    
    let deltaTime = timestamp - window.lastTime;
    window.lastTime = timestamp;

    // Calcular dt relativo a 60FPS
    let dt = deltaTime / (1000 / 60);

    // Cap de seguridad para evitar saltos enormes (lag o cambio de pestaña)
    // Si dt es infinito o NaN, forzamos 1
    if (!isFinite(dt) || dt > 10) dt = 1; 

    update(dt); 
    draw();

    if(gameState.active) requestAnimationFrame(gameLoop); 
}
gameLoop();
// Al inicio del juego
initializeMap('grass'); // O 'snow', 'beach', 'mountain'
setupMapSelector(); // Crea el selector de mapas en la UI
/* [Fin de sección] */