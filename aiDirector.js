// aiDirector.js
/*sección [IA DIRECTRIZ] IA que controla el flujo del enemigos*/
// --- AI DIRECTOR ---
const aiDirector = {
    timer: 0, checkInterval: 300, difficultyMultiplier: 0.5, deathHistory: [],
    recordDeath: function(enemy) {
        this.deathHistory.push(enemy.wpIndex / (path.length - 1));
    },
    evaluate: function() {
        // Verificamos si hemos avanzado de ronda (gameState.wave ha cambiado)
        if (gameState.wave > this.lastWave) {
            // Actualizamos el registro de la última ronda procesada
            this.lastWave = gameState.wave;
            
            // Aumentamos la Amenaza un 2% fijo por cada nueva ronda
            this.difficultyMultiplier += 0.02;
        }
        
        // Limpiamos el historial (ya no se usa para la condición, pero mantenemos la limpieza)
        this.deathHistory = [];
    },
    increaseDifficulty: function(amount) {
        let inc = (typeof amount === 'number') ? amount : 0.02;
        
        // Límite final ultra-conservador: nunca más de +6% por llamada
        inc = Math.min(inc, 0.06);
        
        this.difficultyMultiplier += inc;
        this.difficultyMultiplier = Math.max(1.0, this.difficultyMultiplier);
        
        document.getElementById('diff-meter').innerText = `Amenaza: ${Math.floor(this.difficultyMultiplier * 100)}%`;
        document.getElementById('diff-meter').style.color = '#ff5252';
    }
};
/*[Fin de sección]*/