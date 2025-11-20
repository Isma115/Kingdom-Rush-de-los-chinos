/*sección [CONFIGURACIÓN] Cónfiguración (config.js)*/
const maps = [
    { name: "Serpiente", points: [{x:0,y:100}, {x:350,y:100}, {x:350,y:400}, {x:700,y:400}, {x:700,y:150}, {x:1050,y:150}, {x:1050,y:350}, {x:1400,y:350}, {x:1400,y:250}, {x:1650,y:250}, {x:1650,y:450}, {x:1900,y:450}] },
    { name: "Herradura", points: [{x:0,y:400}, {x:550,y:400}, {x:550,y:100}, {x:1100,y:100}, {x:1100,y:400}, {x:1650,y:400}] },
    { name: "ZigZag", points: [{x:0,y:50}, {x:400,y:50}, {x:700,y:250}, {x:1100,y:250}, {x:1400,y:50}, {x:1650,y:50}, {x:1650,y:450}, {x:1900,y:450}] },

    /* === NUEVOS 4 MAPAS AÑADIDOS === */

    { 
        name: "Laberinto",
        points: [
            {x:0,y:250}, {x:300,y:250}, {x:300,y:100},
            {x:600,y:100}, {x:600,y:400}, {x:900,y:400},
            {x:900,y:150}, {x:1200,y:150}, {x:1200,y:350},
            {x:1500,y:350}, {x:1500,y:200}, {x:1900,y:200}
        ]
    },

    { 
        name: "Espiral",
        points: [
            {x:0,y:250}, {x:400,y:250}, {x:400,y:50},
            {x:800,y:50}, {x:800,y:450}, {x:1200,y:450},
            {x:1200,y:100}, {x:1600,y:100}, {x:1600,y:400},
            {x:1900,y:400}
        ]
    },

    { 
        name: "Río",
        points: [
            {x:0,y:300}, {x:250,y:250}, {x:500,y:300},
            {x:750,y:350}, {x:1000,y:300}, {x:1250,y:250},
            {x:1500,y:300}, {x:1750,y:350}, {x:1900,y:350}
        ]
    },

    { 
        name: "Columna",
        points: [
            {x:0,y:50}, {x:250,y:450}, {x:500,y:50},
            {x:750,y:450}, {x:1000,y:50}, {x:1250,y:450},
            {x:1500,y:50}, {x:1750,y:450}, {x:1900,y:450}
        ]
    }
];
const selectedMap = maps[Math.floor(Math.random() * maps.length)];
const path = selectedMap.points;
// --- BESTIARIO (Tier System) ---
const enemyRoster = [
    { id: 0,  name: "Limo",       color: "#aeea00", hp: 15,   speed: 1.15, reward: 5,  size: 6, label: "🟢" },
    { id: 1,  name: "Goblin",     color: "#64dd17", hp: 25,   speed: 1.0,  reward: 7,  size: 8, label: "👺" },
    { id: 2,  name: "Explorador", color: "#00c853", hp: 40,   speed: 0.9,  reward: 9,  size: 9, label: "🧭" },
    { 
id: 3,  name: "Lobo",       color: "#00bfa5", hp: 55,   speed: 1.3,  reward: 11, size: 10, label: "🐺" }, 
    { id: 4,  name: "Orco",       color: "#0091ea", hp: 80,   speed: 0.66, reward: 14, size: 12, label: "👹" },
    
    { id: 5,  name: "Guerrero",   color: "#304ffe", hp: 120,  speed: 0.58, reward: 18, size: 13, label: "⚔️" },
    { id: 6,  name: "Bárbaro",    color: 
"#6200ea", hp: 160,  speed: 0.66, reward: 22, size: 13, label: "🪓" },
    { id: 7,  name: "Chamán",     color: "#aa00ff", hp: 200,  speed: 0.5,  reward: 25, size: 14, label: "🔮" },
    { id: 8,  name: "Ogro",       color: "#c51162", hp: 300,  speed: 0.41, reward: 30, size: 16, label: "👾" },
    { id: 9,  name: "Gárgola",    color: "#d50000", hp: 250,  speed: 1.07, reward: 35, size: 11, label: "🦇" }, 

    
{ id: 10, name: "Caballero",  color: "#ff6d00", hp: 500,  speed: 0.33, reward: 45, size: 15, label: "⚔️" },
    { id: 11, name: "Asesino",    color: "#ffd600", hp: 350,  speed: 1.4,  reward: 50, size: 10, label: "🗡️" }, 
    { id: 12, name: "Troll",      color: "#795548", hp: 800,  speed: 0.25, reward: 60, size: 18, label: "🧌" },
    { id: 13, name: "Gólem",      color: "#5d4037", hp: 1200, speed: 0.21, reward: 80, size: 20, label: "🗿" },
 
   { id: 14, name: "Espectro",   color: "#607d8b", hp: 700,  speed: 0.75, reward: 70, size: 14, label: "👻" },

    { id: 15, name: "Gigante",    color: "#455a64", hp: 2000, speed: 0.21, reward: 120, size: 22, label: "🦍" },
    { id: 16, name: "Dragón",     color: "#37474f", hp: 3000, speed: 0.33, reward: 150, size: 24, label: "🐉" },
    { id: 17, name: "Titán",      color: "#263238", hp: 5000, speed: 0.15, reward: 200, size: 26, label: "🗽" },
  
   { id: 18, name: "Señor Void", color: "#000000", hp: 7500, speed: 0.18, reward: 300, size: 18, label: "🌑" },
    { id: 19, name: "REY DORADO", color: "#ffd700", hp: 12000, speed: 0.15, reward: 500, size: 30, label: "👑" },
    
        // --- NUEVOS ENEMIGOS (HASTA LA Z) ---
    { id: 20, name: "Bruja",      color: "#9c27b0", hp: 15000, speed: 0.5,  reward: 400, size: 16, label: "🧙‍♀️" },
    { id: 21, name: "Cíclope",    
color: "#7e57c2", hp: 18000, speed: 0.21, reward: 600, size: 28, label: "👁️" },
    { id: 22, name: "Yeti",       color: "#e0e0e0", hp: 22000, speed: 0.41, reward: 750, size: 25, label: "❄️" },
    { id: 23, name: "Zombi",      color: "#4caf50", hp: 25000, speed: 0.58, reward: 900, size: 17, label: "🧟" },
    { id: 24, name: "Xilófago",   color: "#795548", hp: 30000, speed: 0.33, reward: 1100, size: 20, label: "🪲" },
    { id: 25, name: "Quimera",    
color: "#f44336", hp: 40000, speed: 0.29, reward: 1500, size: 32, label: "🦁🐍🐉" }
];
const towerTypes = {
    archer: { cost: 70, range: 140, damage: 15, fireRate: 35, color: '#fdd835', type: 'combat', label: '🏹', projSpeed: 6 },
    cannon: { cost: 150, range: 110, damage: 60, fireRate: 90, color: '#424242', type: 'combat', label: '💣', projSpeed: 3 },
    mine: { cost: 100, range: 0, damage: 15, fireRate: 180, color: '#8d6e63', type: 'eco', label: '⛏️' },
    mage: { cost: 200, range: 160, damage: 25, fireRate: 60, color: '#7b1fa2', type: 'combat', label: '🔮', projSpeed: 8 },
    sniper: { cost: 180, range: 250, damage: 80, fireRate: 120, color: '#1565c0', type: 'combat', label: '🎯', projSpeed: 12 },
    ice: { cost: 120, range: 130, damage: 10, fireRate: 45, color: '#00bcd4', type: 'combat', label: '❄️', projSpeed: 5 },
    infernal: { 
        name: 'Infernal', 
        cost: 500, 
        range: 220, 
        damage: 180,
        fireRate: 0,
        color: '#212121', 
        type: 'combat', 
        label: '🔥' 
    }
};
// (En un comentario) [FUNCIÓN MODIFICADA] getEnemyColorByTier (config.js)
function getEnemyColorByTier(rosterId) {
    // Número de enemigos totales definidos en el roster (0 a 25)
    const MAX_ENEMY_TIER = enemyRoster.length - 1;
// 25
    
    // Mapear el rosterId (0 a MAX_ENEMY_TIER) al rango de 0 a 1
    let ratio = rosterId / MAX_ENEMY_TIER;
// 0.0 (fácil) a 1.0 (difícil)
    
    // Invertir para que el color 0.0 sea blanco y 1.0 sea negro.
ratio = 1.0 - ratio; 
    
    // Calcular el valor del componente RGB (0 a 255).
// Math.floor(0.0 * 255) = 0 (negro); Math.floor(1.0 * 255) = 255 (blanco)
    let val = Math.floor(ratio * 255);
// Crear una cadena hexadecimal para el color (escala de grises)
    let hex = val.toString(16).padStart(2, '0');
// De blanco (más fácil) a negro (más difícil)
    return `#${hex}${hex}${hex}`;
}

// Utilidad global: convierte HEX en RGBA
function hexToRgba(hex, alpha = 1.0) {
    // Eliminar el #
    hex = hex.replace('#', '');
// Expandir formato corto (#abc → #aabbcc)
    if (hex.length === 3) {
        hex = hex.split('').map(h => h + h).join('');
}

    // Convertir cada componente
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/*[Fin de sección]*/