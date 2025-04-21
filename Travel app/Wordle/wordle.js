class WordleGame {
    constructor() {
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameActive = false;
        this.targetWord = '';
        this.timer = null;
        this.startTime = null;
        this.loadStats();
        this.setupGame();
    }

    setupGame() {
        this.setupEventListeners();
        this.setupGameBoard();
        this.startNewGame();
    }

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // On-screen keyboard
        document.querySelectorAll('.keyboard button').forEach(button => {
            button.addEventListener('click', () => {
                const key = button.getAttribute('data-key');
                this.handleInput(key);
            });
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        // Submit button
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.submitGuess();
        });
    }

    setupGameBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        
        // Always create 6 rows with 5 tiles each
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
            row.classList.add('board-row');
            
        for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.dataset.row = i;
                tile.dataset.col = j;
                row.appendChild(tile);
            }
            
            board.appendChild(row);
        }
    }

    startNewGame() {
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameActive = true;
        this.clearBoard();
        this.showMessage('');
        this.stopTimer();
        this.startTimer();
        this.selectTargetWord();
        this.updateActiveTile();
    }

    selectTargetWord() {
        const words = WORD_LISTS.medium; // Always use medium difficulty words (5 letters)
        this.targetWord = words[Math.floor(Math.random() * words.length)];
        console.log('Target word:', this.targetWord); // For debugging
    }

    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        if (e.key === 'Enter') {
            this.submitGuess();
        } else if (e.key === 'Backspace') {
            this.deleteLetter();
        } else if (/^[a-zA-Z]$/.test(e.key)) {
            this.addLetter(e.key.toUpperCase());
        }
    }

    handleInput(key) {
        if (!this.gameActive) return;
        
        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.deleteLetter();
        } else {
            this.addLetter(key.toUpperCase());
        }
    }

    addLetter(letter) {
        if (this.currentTile < 5) {
            // Remove invalid highlight when typing a new letter
            const lastTile = document.querySelector(`[data-row="${this.currentRow}"][data-col="4"]`);
            if (lastTile) {
                lastTile.classList.remove('invalid');
            }

            const tile = document.querySelector(`[data-row="${this.currentRow}"][data-col="${this.currentTile}"]`);
            tile.textContent = letter;
            tile.classList.add('filled');
            this.currentTile++;
            
            // Update active tile
            this.updateActiveTile();
        }
    }

    deleteLetter() {
        if (this.currentTile > 0) {
            this.currentTile--;
            const tile = document.querySelector(`[data-row="${this.currentRow}"][data-col="${this.currentTile}"]`);
            tile.textContent = '';
            tile.classList.remove('filled');
            
            // Remove invalid highlight when backspacing
            const lastTile = document.querySelector(`[data-row="${this.currentRow}"][data-col="4"]`);
            if (lastTile) {
                lastTile.classList.remove('invalid');
            }
            
            // Update active tile
            this.updateActiveTile();
        }
    }

    updateActiveTile() {
        // Remove active class from all tiles
        document.querySelectorAll('.tile').forEach(tile => {
            tile.classList.remove('active');
        });
        
        // Add active class to current tile if it exists
        if (this.currentTile < 5) {
            const currentTile = document.querySelector(`[data-row="${this.currentRow}"][data-col="${this.currentTile}"]`);
            if (currentTile) {
                currentTile.classList.add('active');
            }
        }
    }

    submitGuess() {
        if (this.currentTile !== 5) {
            this.showMessage('Not enough letters', 'error');
            this.shakeRow(this.currentRow);
            return;
        }

        const guess = this.getCurrentWord();
        if (!WORD_LISTS.medium.includes(guess)) {
            this.showMessage('Not in word list', 'error');
            // Highlight the last tile of the invalid word
            const lastTile = document.querySelector(`[data-row="${this.currentRow}"][data-col="4"]`);
            lastTile.classList.add('invalid');
            return;
        }
        
        this.checkGuess(guess);
    }

    getCurrentWord() {
        let word = '';
        for (let i = 0; i < 5; i++) { // Always get 5 letters
            const tile = document.querySelector(`[data-row="${this.currentRow}"][data-col="${i}"]`);
            word += tile.textContent;
        }
        return word;
    }

    checkGuess(guess) {
        const result = Array(guess.length).fill('absent');
        const targetLetters = [...this.targetWord];
        
        // First pass: mark correct letters
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null;
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < guess.length; i++) {
            if (result[i] === 'absent') {
                const index = targetLetters.indexOf(guess[i]);
                if (index !== -1) {
                    result[i] = 'present';
                    targetLetters[index] = null;
                }
            }
        }

        this.updateTiles(result);

        if (guess === this.targetWord) {
            this.endGame(true);
            // Highlight first tile of next row if not game over
            if (this.currentRow < 5) {
                const nextRowFirstTile = document.querySelector(`[data-row="${this.currentRow + 1}"][data-col="0"]`);
                if (nextRowFirstTile) {
                    nextRowFirstTile.classList.add('active');
                }
            }
        } else if (this.currentRow === 5) {
            this.endGame(false);
        } else {
            this.currentRow++;
            this.currentTile = 0;
            // Highlight first tile of new row
            const firstTile = document.querySelector(`[data-row="${this.currentRow}"][data-col="0"]`);
            if (firstTile) {
                firstTile.classList.add('active');
            }
        }
    }

    updateTiles(result) {
        for (let i = 0; i < result.length; i++) {
            const tile = document.querySelector(`[data-row="${this.currentRow}"][data-col="${i}"]`);
            tile.classList.add(result[i], 'flip');
        }
    }

    endGame(won) {
        this.gameActive = false;
        this.stopTimer();
        
        if (won) {
            this.showMessage('Congratulations!', 'success');
            this.updateStats(true);
        } else {
            this.showMessage(`Game Over! The word was ${this.targetWord}`, 'error');
            this.updateStats(false);
        }
    }

    showMessage(text, type = 'info') {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type}`;
    }

    shakeRow(row) {
        const rowElement = document.querySelector(`[data-row="${row}"]`).parentElement;
        rowElement.classList.add('shake');
        setTimeout(() => rowElement.classList.remove('shake'), 500);
    }

    clearBoard() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.textContent = '';
            // Remove all classes except the highlighting classes
            const classesToKeep = ['correct', 'present', 'absent'];
            const currentClasses = Array.from(tile.classList);
            currentClasses.forEach(className => {
                if (!classesToKeep.includes(className)) {
                    tile.classList.remove(className);
                }
            });
            // Add back the base tile class if it was removed
            if (!tile.classList.contains('tile')) {
                tile.classList.add('tile');
            }
        });
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    loadStats() {
        this.stats = JSON.parse(localStorage.getItem('wordleStats')) || {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0
        };
        this.updateStatsDisplay();
    }

    updateStats(won) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
        } else {
            this.stats.currentStreak = 0;
        }
        localStorage.setItem('wordleStats', JSON.stringify(this.stats));
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        document.getElementById('games-played').textContent = this.stats.gamesPlayed;
        document.getElementById('games-won').textContent = this.stats.gamesWon;
        document.getElementById('current-streak').textContent = this.stats.currentStreak;
        document.getElementById('max-streak').textContent = this.stats.maxStreak;
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordleGame();
}); 