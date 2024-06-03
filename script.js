document.addEventListener('DOMContentLoaded', () => {
    const frontPage = document.getElementById('front-page');
    const singlePlayerButton = document.getElementById('single-player');
    const doublePlayerButton = document.getElementById('double-player');
    const gameContainer = document.getElementById('game-container');
    const board = document.getElementById('board');
    const timerDisplay = document.getElementById('time');
    const turnDisplay = document.getElementById('turn-display');
    const pauseButton = document.getElementById('pause');
    const resumeButton = document.getElementById('resume');
    const resetButton = document.getElementById('reset');
    const backButton = document.getElementById('back-button');
    //back to 1st page from 2nd page
    backButton.addEventListener('click', () => {
        gameContainer.style.display = 'none';
        frontPage.style.display = 'block';
    });

    const boardSize = 8;
    let timer = 600;
    let interval;
    let gamePaused = false;
    let selectedPiece = null;
    let currentPlayer = 1;
    let isSinglePlayer = false;

    function initBoard() {
        board.innerHTML = '';
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                board.appendChild(cell);
            }
        }

        setPiece(0, 3, 'player1', 'titan', 'Ti1');
        setPiece(2, 5, 'player1', 'tank', 'Ta1');
        setPiece(1, 5, 'player1', 'ricochet', 'Ri1', 'horizontal');
        setPiece(1, 4, 'player1', 'semi-ricochet', 'SR1', 'inclined-left');
        setPiece(0, 2, 'player1', 'cannon', 'Ca1');

        setPiece(7, 4, 'player2', 'titan', 'Ti2');
        setPiece(5, 1, 'player2', 'tank', 'Ta2');
        setPiece(7, 1, 'player2', 'ricochet', 'Ri2', 'vertical');
        setPiece(7, 0, 'player2', 'semi-ricochet', 'SR2', 'inclined-right');
        setPiece(7, 5, 'player2', 'cannon', 'Ca2');
    }
   
    function setPiece(row, col, playerClass, pieceClass, text, orientation = '') {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const piece = document.createElement('div');
        piece.classList.add('piece', playerClass, pieceClass);
        piece.textContent = text;
        if (orientation) {
            piece.dataset.orientation = orientation;
            if (pieceClass === 'ricochet') {
                piece.style.transform = orientation === 'vertical' ? 'rotate(90deg)' : 'rotate(0deg)';
            } else if (pieceClass === 'semi-ricochet') {
                piece.style.transform = orientation === 'inclined-left' ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }
        cell.appendChild(piece);
    }

    function updateTurnDisplay() {
        turnDisplay.textContent = `Player ${currentPlayer}'s turn`;
    }

    function startTimer() {
        interval = setInterval(() => {
            if (!gamePaused) {
                timer--;
                timerDisplay.textContent = timer;
                if (timer <= 0) {
                    clearInterval(interval);
                    alert('Time is up! Game over.');
                }
            }
        }, 1000);
    }

    pauseButton.addEventListener('click', () => {
        gamePaused = true;
    });

    resumeButton.addEventListener('click', () => {
        gamePaused = false;
    });

    resetButton.addEventListener('click', () => {
        clearInterval(interval);
        timer = 600;
        timerDisplay.textContent = timer;
        currentPlayer = 1;
        updateTurnDisplay();
        initBoard();
        startTimer();
    });

    singlePlayerButton.addEventListener('click', () => {
        isSinglePlayer = true;
        startGame();
    });

    doublePlayerButton.addEventListener('click', () => {
        isSinglePlayer = false;
        startGame();
    });

    function startGame() {
        frontPage.style.display = 'none';
        gameContainer.style.display = 'flex';
        initBoard();
        startTimer();
    }

    board.addEventListener('click', (event) => {
        const cell = event.target.closest('.cell');
        if (!cell) return;

        const piece = cell.querySelector('.piece');
        if (selectedPiece) {
            if (selectedPiece === cell && (piece.classList.contains('ricochet') || piece.classList.contains('semi-ricochet'))) {
                rotatePiece(piece);
            } else if (movePiece(selectedPiece, cell)) {
                fireBullet(currentPlayer);
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                updateTurnDisplay();
                if (isSinglePlayer && currentPlayer === 2) {
                    setTimeout(botMove, 1000);
                }
            }
            selectedPiece = null;
        } else if (piece && piece.classList.contains(`player${currentPlayer}`)) {
            selectedPiece = cell;
        }
    });

   
    function rotatePiece(piece) {
        if (piece.classList.contains('ricochet')) {
            if (piece.dataset.orientation === 'vertical') {
                piece.dataset.orientation = 'horizontal';
                piece.style.transform = 'rotate(0deg)';
            } else {
                piece.dataset.orientation = 'vertical';
                piece.style.transform = 'rotate(90deg)';
            }
        } else if (piece.classList.contains('semi-ricochet')) {
            const currentOrientation = piece.dataset.orientation;
            piece.dataset.orientation = currentOrientation === 'inclined-left' ? 'inclined-right' : 'inclined-left';
            piece.style.transform = piece.dataset.orientation === 'inclined-left' ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    function movePiece(fromCell, toCell) {
        const fromRow = parseInt(fromCell.dataset.row);
        const fromCol = parseInt(fromCell.dataset.col);
        const toRow = parseInt(toCell.dataset.row);
        const toCol = parseInt(toCell.dataset.col);

        const piece = fromCell.querySelector('.piece');
        const isCannon = piece.classList.contains('cannon');

        if (isCannon) {
            if (fromRow === toRow && Math.abs(fromCol - toCol) === 1 && !toCell.querySelector('.piece')) {
                toCell.appendChild(piece);
                fromCell.innerHTML = '';
                return true;
            }
        } else {
            if (Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1 && !toCell.querySelector('.piece')) {
                toCell.appendChild(piece);
                fromCell.innerHTML = '';
                return true;
            }
        }
        return false;
    }
    function botMove() {
        const botPieces = Array.from(document.querySelectorAll('.piece.player2'));
        const pieceToMove = botPieces[Math.floor(Math.random() * botPieces.length)];
        const currentCell = pieceToMove.closest('.cell');
        const validMoves = getValidMovesForPiece(pieceToMove, currentCell);
    
        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            movePiece(currentCell, randomMove);
            fireBullet(2);
            currentPlayer = 1;
            updateTurnDisplay();
        } else {
            botMove();  // Retry if no valid moves are found
        }
    }
    
    function getValidMovesForPiece(piece, cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const moves = [];
    
        const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 },  { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }
        ];
    
        const pieceClass = piece.classList[2];
    
        directions.forEach(direction => {
            let newRow = row + direction.row;
            let newCol = col + direction.col;
            const newCell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
            if (newCell && !newCell.querySelector('.piece')) {
                switch (pieceClass) {
                    case 'cannon':
                        if (row === newRow && Math.abs(col - newCol) === 1) {
                            moves.push(newCell);
                        }
                        break;
                    case 'titan':
                        if (Math.abs(row - newRow) <= 1 && Math.abs(col - newCol) <= 1) {
                            moves.push(newCell);
                        }
                        break;
                    case 'tank':
                        if (Math.abs(row - newRow) <= 2 && Math.abs(col - newCol) <= 2) {
                            moves.push(newCell);
                        }
                        break;
                    case 'ricochet':
                    case 'semi-ricochet':
                        if (Math.abs(row - newRow) <= 1 && Math.abs(col - newCol) <= 1) {
                            moves.push(newCell);
                        }
                        break;
                }
            }
        });
    
        return moves;
    }
    let gameHistory = []
    function fireBullet(player) {
        const cannonCell = document.querySelector(`.cell .cannon.player${player}`).parentElement;
        if (!cannonCell) return;
    
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');
    
        let currentRow = parseInt(cannonCell.dataset.row);
        let currentCol = parseInt(cannonCell.dataset.col);
        bullet.style.left = `${cannonCell.offsetLeft + 20}px`;
        bullet.style.top = `${cannonCell.offsetTop + 20}px`;
        document.getElementById('board').appendChild(bullet);
    
        let directionRow = player === 1 ? 1 : -1;
        let directionCol = 0;
    
        const hitSound = document.getElementById('hit-sound');
    
        gameHistory.push({ player, startRow: currentRow, startCol: currentCol });
    
        const bulletInterval = setInterval(() => {
            let nextRow = currentRow + directionRow;
            let nextCol = currentCol + directionCol;
            let nextCell = document.querySelector(`.cell[data-row="${nextRow}"][data-col="${nextCol}"]`);
    
            if (!nextCell || (nextCell.querySelector('.piece') && !nextCell.querySelector('.ricochet') && !nextCell.querySelector('.semi-ricochet'))) {
                clearInterval(bulletInterval);
                if (nextCell && nextCell.querySelector('.titan')) {
                    alert(`Player ${player} wins!`);
                    clearInterval(interval);
                    resetButton.click();
                }
                bullet.remove();
                return;
            }
    
            const ricochet = nextCell.querySelector('.ricochet');
            const semiRicochet = nextCell.querySelector('.semi-ricochet');
    
            if (ricochet) {
                if (directionRow !== 0) {
                    directionCol = directionRow;
                    directionRow = 0;
                } else {
                    directionRow = -directionCol;
                    directionCol = 0;
                }
            } else if (semiRicochet) {
                const orientation = semiRicochet.dataset.orientation;
                const hittingReflectingSide = (directionRow === 1 && orientation === 'inclined-left') ||
                                              (directionRow === -1 && orientation === 'inclined-right') ||
                                              (directionCol === 1 && orientation === 'inclined-right') ||
                                              (directionCol === -1 && orientation === 'inclined-left');
    
                if (hittingReflectingSide) {
                    if (directionRow !== 0) {
                        directionCol = directionRow;
                        directionRow = 0;
                    } else {
                        directionRow = -directionCol;
                        directionCol = 0;
                    }
                } else {
                    // Destroy the semi-ricochet, play sound, and stop the bullet if it hits the non-reflecting side
                    semiRicochet.remove();
                    hitSound.play();
                    clearInterval(bulletInterval);
                    bullet.remove();
                    gameHistory.push({ row: nextRow, col: nextCol, destroyed: true });
                    return;
                }
            }
    
            currentRow = nextRow;
            currentCol = nextCol;
            bullet.style.left = `${nextCell.offsetLeft + 20}px`;
            bullet.style.top = `${nextCell.offsetTop + 20}px`;
    
            gameHistory.push({ row: currentRow, col: currentCol });
        }, 200);
    }
    


    initBoard();
    startTimer();
    updateTurnDisplay();
});
