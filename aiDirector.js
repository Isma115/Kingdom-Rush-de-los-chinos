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
       
        // Lógica ultra-suave y progresiva (reducción fuerte solicitada)
        if (avg < 0.35) {
            let diff = 0.35 - avg; // máximo 0.35
            
            // Incremento base muy pequeño + boost extremadamente controlado
            let increaseAmount = 0.02 + (diff * 0.25);
            
            // Límite MUY estricto para evitar cualquier pico
            increaseAmount = Math.min(increaseAmount, 0.09); // máximo +9% por evaluación
            
            this.increaseDifficulty(increaseAmount);
        }
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