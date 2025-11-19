// aiDirector.js
/*sección [IA DIRECTRIZ] IA que controla el flujo del enemigos*/
// --- AI DIRECTOR ---
const aiDirector = {
    timer: 0, checkInterval: 300, difficultyMultiplier: 1.0, deathHistory: [],
    recordDeath: function(enemy) {
        this.deathHistory.push(enemy.wpIndex / (path.length - 1));
    },
    evaluate: function() {
        if (this.deathHistory.length === 0) return;
        let avg = this.deathHistory.reduce((a, b) => a + b, 0) / this.deathHistory.length;
        
        // Modificado: Lógica de incremento dinámico
        if (avg < 0.35) {
            // Calculamos la diferencia entre el umbral (0.35) y el promedio real.
            // Si avg es muy bajo (ej. 0.05), la diferencia es alta (0.30).
            // Multiplicamos esa diferencia por un factor alto (5.0) para disparar la dificultad.
            // Base 0.1 + Boost.
            let increaseAmount = 0.1 + ((0.35 - avg) * 5.0);
            this.increaseDifficulty(increaseAmount); 
        }
        this.deathHistory = [];
    },
    increaseDifficulty: function(amount) {
        // Acepta un argumento opcional, por defecto 0.1
        let inc = (typeof amount === 'number') ? amount : 0.1;
        this.difficultyMultiplier += inc;
        document.getElementById('diff-meter').innerText = `Amenaza: ${Math.floor(this.difficultyMultiplier * 100)}%`;
        document.getElementById('diff-meter').style.color = '#ff5252';
    }
};
/*[Fin de sección]*/