// Chess Game Logic
const PIECES = {
  'wP': 'white-pawn', 'wR': 'white-rook', 'wN': 'white-knight',
  'wB': 'white-bishop', 'wQ': 'white-queen', 'wK': 'white-king',
  'bP': 'black-pawn', 'bR': 'black-rook', 'bN': 'black-knight',
  'bB': 'black-bishop', 'bQ': 'black-queen', 'bK': 'black-king'
};

const INITIAL_BOARD = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

class ChessGame {
  constructor() {
    this.board = this.copyBoard(INITIAL_BOARD);
    this.turn = 'white';
    this.castlingRights = {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    };
    this.enPassantTarget = null;
    this.halfMoveClock = 0;
    this.moveNumber = 1;
    this.capturedPieces = { white: [], black: [] };
    this.gameOver = false;
    this.winner = null;
  }

  copyBoard(board) {
    return board.map(row => [...row]);
  }

  isValidSquare(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  getPiece(row, col) {
    return this.board[row][col];
  }

  getPieceColor(piece) {
    if (!piece) return null;
    return piece.startsWith('w') ? 'white' : 'black';
  }

  getPieceType(piece) {
    if (!piece) return null;
    return piece.slice(1);
  }

  isOwnPiece(piece, color) {
    return this.getPieceColor(piece) === color;
  }

  isEnemyPiece(piece, color) {
    const pieceColor = this.getPieceColor(piece);
    return pieceColor !== null && pieceColor !== color;
  }

  findKing(color) {
    const king = color === 'white' ? 'wK' : 'bK';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === king) {
          return { row, col };
        }
      }
    }
    return null;
  }

  isSquareAttacked(row, col, byColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && this.getPieceColor(piece) === byColor) {
          const moves = this.getPseudoLegalMoves(r, c, true);
          if (moves.some(m => m.toRow === row && m.toCol === col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isInCheck(color) {
    const king = this.findKing(color);
    if (!king) return false;
    const enemyColor = color === 'white' ? 'black' : 'white';
    return this.isSquareAttacked(king.row, king.col, enemyColor);
  }

  getPseudoLegalMoves(row, col, forAttackCheck = false) {
    const piece = this.board[row][col];
    if (!piece) return [];

    const color = this.getPieceColor(piece);
    const type = this.getPieceType(piece);
    const moves = [];

    const addMove = (toRow, toCol, special = null) => {
      if (this.isValidSquare(toRow, toCol)) {
        const target = this.board[toRow][toCol];
        if (!this.isOwnPiece(target, color)) {
          moves.push({ fromRow: row, fromCol: col, toRow, toCol, special });
        }
      }
    };

    const addSlidingMoves = (directions) => {
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (!this.isValidSquare(newRow, newCol)) break;
          const target = this.board[newRow][newCol];
          if (target) {
            if (this.isEnemyPiece(target, color)) {
              moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol });
            }
            break;
          }
          moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol });
        }
      }
    };

    switch (type) {
      case 'P': {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
          addMove(row + direction, col);
          if (row === startRow && !this.board[row + 2 * direction][col]) {
            addMove(row + 2 * direction, col, 'double');
          }
        }
        for (const dc of [-1, 1]) {
          const newCol = col + dc;
          const newRow = row + direction;
          if (this.isValidSquare(newRow, newCol)) {
            const target = this.board[newRow][newCol];
            if (target && this.isEnemyPiece(target, color)) {
              moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol });
            }
            if (!forAttackCheck && this.enPassantTarget && 
                this.enPassantTarget.row === newRow && this.enPassantTarget.col === newCol) {
              moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol, special: 'enpassant' });
            }
          }
        }
        break;
      }
      case 'R':
        addSlidingMoves([[0, 1], [0, -1], [1, 0], [-1, 0]]);
        break;
      case 'N':
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of knightMoves) {
          addMove(row + dr, col + dc);
        }
        break;
      case 'B':
        addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
        break;
      case 'Q':
        addSlidingMoves([[0, 1], [0, -1], [1, 0], [-1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
        break;
      case 'K': {
        const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of kingMoves) {
          addMove(row + dr, col + dc);
        }
        if (!forAttackCheck) {
          const rights = this.castlingRights[color];
          const enemyColor = color === 'white' ? 'black' : 'white';
          if (rights.kingSide && !this.isInCheck(color)) {
            if (!this.board[row][col + 1] && !this.board[row][col + 2] &&
                !this.isSquareAttacked(row, col + 1, enemyColor) &&
                !this.isSquareAttacked(row, col + 2, enemyColor)) {
              moves.push({ fromRow: row, fromCol: col, toRow: row, toCol: col + 2, special: 'castle-k' });
            }
          }
          if (rights.queenSide && !this.isInCheck(color)) {
            if (!this.board[row][col - 1] && !this.board[row][col - 2] && !this.board[row][col - 3] &&
                !this.isSquareAttacked(row, col - 1, enemyColor) &&
                !this.isSquareAttacked(row, col - 2, enemyColor)) {
              moves.push({ fromRow: row, fromCol: col, toRow: row, toCol: col - 2, special: 'castle-q' });
            }
          }
        }
        break;
      }
    }

    return moves;
  }

  getLegalMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    
    const color = this.getPieceColor(piece);
    const pseudoMoves = this.getPseudoLegalMoves(row, col);
    const legalMoves = [];

    for (const move of pseudoMoves) {
      const tempGame = this.copy();
      tempGame.makeMove(move, true);
      if (!tempGame.isInCheck(color)) {
        legalMoves.push(move);
      }
    }

    return legalMoves;
  }

  copy() {
    const newGame = new ChessGame();
    newGame.board = this.copyBoard(this.board);
    newGame.turn = this.turn;
    newGame.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    newGame.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;
    newGame.halfMoveClock = this.halfMoveClock;
    newGame.moveNumber = this.moveNumber;
    newGame.capturedPieces = JSON.parse(JSON.stringify(this.capturedPieces));
    return newGame;
  }

  makeMove(move, temp = false) {
    const { fromRow, fromCol, toRow, toCol, special } = move;
    const piece = this.board[fromRow][fromCol];
    const type = this.getPieceType(piece);
    const color = this.getPieceColor(piece);

    const captured = this.board[toRow][toCol];
    if (captured) {
      this.capturedPieces[color].push(captured);
    }

    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;

    if (special === 'enpassant') {
      const capturedRow = color === 'white' ? toRow + 1 : toRow - 1;
      const capturedPawn = this.board[capturedRow][toCol];
      this.capturedPieces[color].push(capturedPawn);
      this.board[capturedRow][toCol] = null;
    }

    if (special === 'castle-k') {
      const rookCol = 7;
      const rook = this.board[toRow][rookCol];
      this.board[toRow][toCol - 1] = rook;
      this.board[toRow][rookCol] = null;
    }

    if (special === 'castle-q') {
      const rookCol = 0;
      const rook = this.board[toRow][rookCol];
      this.board[toRow][toCol + 1] = rook;
      this.board[toRow][rookCol] = null;
    }

    if (type === 'P' && (toRow === 0 || toRow === 7)) {
      this.board[toRow][toCol] = color === 'white' ? 'wQ' : 'bQ';
    }

    if (special === 'double') {
      this.enPassantTarget = { row: (fromRow + toRow) / 2, col: toCol };
    } else {
      this.enPassantTarget = null;
    }

    if (type === 'K') {
      this.castlingRights[color].kingSide = false;
      this.castlingRights[color].queenSide = false;
    }
    if (type === 'R') {
      if (fromCol === 0) this.castlingRights[color].queenSide = false;
      if (fromCol === 7) this.castlingRights[color].kingSide = false;
    }
    if (toRow === 0 && toCol === 0) this.castlingRights.black.queenSide = false;
    if (toRow === 0 && toCol === 7) this.castlingRights.black.kingSide = false;
    if (toRow === 7 && toCol === 0) this.castlingRights.white.queenSide = false;
    if (toRow === 7 && toCol === 7) this.castlingRights.white.kingSide = false;

    if (!temp) {
      this.turn = this.turn === 'white' ? 'black' : 'white';
      if (this.turn === 'white') this.moveNumber++;
    }
  }

  hasLegalMoves(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && this.getPieceColor(piece) === color) {
          if (this.getLegalMoves(row, col).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkGameOver() {
    if (!this.hasLegalMoves(this.turn)) {
      this.gameOver = true;
      if (this.isInCheck(this.turn)) {
        this.winner = this.turn === 'white' ? 'black' : 'white';
        return { type: 'checkmate', winner: this.winner };
      } else {
        this.winner = 'draw';
        return { type: 'stalemate', winner: 'draw' };
      }
    }
    return null;
  }
}

// AI Logic
class ChessAI {
  constructor(difficulty) {
    this.difficulty = difficulty;
    this.depth = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 2 : 4;
  }

  evaluate(board) {
    const pieceValues = {
      'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000
    };

    const positionBonus = {
      'P': [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5, 5, 10, 25, 25, 10, 5, 5],
        [0, 0, 0, 20, 20, 0, 0, 0],
        [5, -5, -10, 0, 0, -10, -5, 5],
        [5, 10, 10, -20, -20, 10, 10, 5],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ],
      'N': [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20, 0, 0, 0, 0, -20, -40],
        [-30, 0, 10, 15, 15, 10, 0, -30],
        [-30, 5, 15, 20, 20, 15, 5, -30],
        [-30, 0, 15, 20, 20, 15, 0, -30],
        [-30, 5, 10, 15, 15, 10, 5, -30],
        [-40, -20, 0, 5, 5, 0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
      ],
      'B': [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 10, 10, 5, 0, -10],
        [-10, 5, 5, 10, 10, 5, 5, -10],
        [-10, 0, 10, 10, 10, 10, 0, -10],
        [-10, 10, 10, 10, 10, 10, 10, -10],
        [-10, 5, 0, 0, 0, 0, 5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
      ],
      'R': [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 10, 10, 10, 10, 10, 10, 5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [0, 0, 0, 5, 5, 0, 0, 0]
      ],
      'Q': [
        [-20, -10, -10, -5, -5, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 5, 5, 5, 0, -10],
        [-5, 0, 5, 5, 5, 5, 0, -5],
        [0, 0, 5, 5, 5, 5, 0, -5],
        [-10, 5, 5, 5, 5, 5, 0, -10],
        [-10, 0, 5, 0, 0, 0, 0, -10],
        [-20, -10, -10, -5, -5, -10, -10, -20]
      ],
      'K': [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [20, 20, 0, 0, 0, 0, 20, 20],
        [20, 30, 10, 0, 0, 10, 30, 20]
      ]
    };

    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        const type = piece.slice(1);
        const color = piece.startsWith('w') ? 1 : -1;
        const value = pieceValues[type] || 0;

        const bonusRow = piece.startsWith('w') ? row : 7 - row;
        const bonus = (positionBonus[type] && positionBonus[type][bonusRow]?.[col]) || 0;

        score += color * (value + bonus);
      }
    }

    return score;
  }

  minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.gameOver) {
      return { score: this.evaluate(game.board) };
    }

    const color = isMaximizing ? 'white' : 'black';
    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    const pieces = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.board[row][col];
        if (piece && game.getPieceColor(piece) === color) {
          const moves = game.getLegalMoves(row, col);
          for (const move of moves) {
            pieces.push({ row, col, move });
          }
        }
      }
    }

    if (depth === this.depth) {
      pieces.sort(() => Math.random() - 0.5);
    }

    for (const { row, col, move } of pieces) {
      const newGame = game.copy();
      newGame.makeMove(move);
      newGame.checkGameOver();

      const result = this.minimax(newGame, depth - 1, alpha, beta, !isMaximizing);

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, result.score);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, result.score);
      }

      if (beta <= alpha) break;
    }

    return { score: bestScore, move: bestMove };
  }

  getBestMove(game) {
    if (this.depth === 0) {
      const moves = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = game.board[row][col];
          if (piece && game.getPieceColor(piece) === 'black') {
            const pieceMoves = game.getLegalMoves(row, col);
            moves.push(...pieceMoves.map(m => ({ ...m, fromRow: row, fromCol: col })));
          }
        }
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const result = this.minimax(game, this.depth, -Infinity, Infinity, false);
    return result.move;
  }
}

// Client-side Game Controller
class GameController {
  constructor() {
    this.socket = io();
    this.game = new ChessGame();
    this.selectedSquare = null;
    this.validMoves = [];
    this.playerColor = 'white';
    this.gameMode = null;
    this.difficulty = null;
    this.ai = null;
    this.gameCode = null;
    this.isMyTurn = false;

    this.initUI();
    this.initSocket();
  }

  initUI() {
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen(btn.dataset.target));
    });

    document.getElementById('btn-ai').addEventListener('click', () => this.showScreen('difficulty'));
    document.getElementById('btn-multiplayer').addEventListener('click', () => this.showScreen('multiplayer-menu'));

    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => this.startAI(btn.dataset.difficulty));
    });

    document.getElementById('btn-create-game').addEventListener('click', () => this.createGame());
    document.getElementById('btn-join-game').addEventListener('click', () => this.joinGame());

    document.getElementById('btn-new-game').addEventListener('click', () => this.newGame());
    document.getElementById('btn-quit').addEventListener('click', () => this.quitGame());
    document.getElementById('btn-share').addEventListener('click', () => this.shareCode());
    document.getElementById('btn-rematch').addEventListener('click', () => this.rematch());
    document.getElementById('btn-menu').addEventListener('click', () => this.toMenu());

    document.getElementById('join-code').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinGame();
    });
  }

  initSocket() {
    this.socket.on('gameStart', (data) => {
      this.playerColor = data.color;
      this.gameCode = this.socket.gameCode;
      this.isMyTurn = this.playerColor === 'white';
      this.updateTurnIndicator();
      this.showScreen('game');
    });

    this.socket.on('opponentMove', (data) => {
      this.game.makeMove(data.move);
      this.renderBoard();
      this.checkGameStatus();
      this.isMyTurn = true;
      this.updateTurnIndicator();
    });

    this.socket.on('gameEnded', (data) => {
      this.showGameOver(data.result);
    });

    this.socket.on('opponentLeft', () => {
      alert('Opponent left the game');
      this.toMenu();
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
  }

  startAI(difficulty) {
    this.gameMode = 'ai';
    this.difficulty = difficulty;
    this.ai = new ChessAI(difficulty);
    this.playerColor = 'white';
    this.isMyTurn = true;
    this.game = new ChessGame();

    document.getElementById('game-mode').textContent = `Mode: vs AI (${difficulty})`;
    this.showScreen('game');
    this.renderBoard();
    this.updateTurnIndicator();
  }

  createGame() {
    this.socket.emit('createGame', (response) => {
      if (response.success) {
        this.gameMode = 'multiplayer';
        this.gameCode = response.gameCode;
        document.getElementById('waiting-code').textContent = response.gameCode;
        document.getElementById('game-mode').textContent = 'Mode: Multiplayer';
        this.showScreen('waiting');
      }
    });
  }

  joinGame() {
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (code.length !== 6) {
      alert('Please enter a valid 6-character game code');
      return;
    }

    this.socket.emit('joinGame', code, (response) => {
      if (response.success) {
        this.gameMode = 'multiplayer';
        this.gameCode = response.gameCode;
        document.getElementById('game-mode').textContent = 'Mode: Multiplayer';
      } else {
        alert(response.error || 'Failed to join game');
      }
    });
  }

  renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;

        const piece = this.game.board[row][col];
        if (piece) {
          const img = document.createElement('img');
          img.src = `/assets/${piece}.png`;
          img.className = 'piece';
          img.draggable = true;
          square.appendChild(img);
        }

        if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
          square.classList.add('selected');
        }

        if (this.validMoves.some(m => m.toRow === row && m.toCol === col)) {
          if (piece) {
            square.classList.add('valid-capture');
          } else {
            square.classList.add('valid-move');
          }
        }

        square.addEventListener('click', () => this.onSquareClick(row, col));
        square.addEventListener('dragstart', (e) => this.onDragStart(e, row, col));
        square.addEventListener('dragend', (e) => this.onDragEnd(e));
        square.addEventListener('dragover', (e) => e.preventDefault());
        square.addEventListener('drop', (e) => this.onDrop(e, row, col));

        board.appendChild(square);
      }
    }

    this.renderCapturedPieces();
  }

  renderCapturedPieces() {
    const blackCaptured = document.getElementById('captured-black');
    const whiteCaptured = document.getElementById('captured-white');
    
    blackCaptured.innerHTML = '';
    whiteCaptured.innerHTML = '';

    this.game.capturedPieces.black.forEach(piece => {
      const img = document.createElement('img');
      img.src = `/assets/${piece}.png`;
      img.className = 'captured-piece';
      blackCaptured.appendChild(img);
    });

    this.game.capturedPieces.white.forEach(piece => {
      const img = document.createElement('img');
      img.src = `/assets/${piece}.png`;
      img.className = 'captured-piece';
      whiteCaptured.appendChild(img);
    });
  }

  onSquareClick(row, col) {
    if (!this.isMyTurn || this.game.gameOver) return;

    const piece = this.game.board[row][col];
    const isMyPiece = piece && this.game.getPieceColor(piece) === this.playerColor;

    const move = this.validMoves.find(m => m.toRow === row && m.toCol === col);
    if (move && this.selectedSquare) {
      this.makeMove(move);
      return;
    }

    if (isMyPiece) {
      this.selectedSquare = { row, col };
      this.validMoves = this.game.getLegalMoves(row, col);
      this.renderBoard();
    } else {
      this.selectedSquare = null;
      this.validMoves = [];
      this.renderBoard();
    }
  }

  onDragStart(e, row, col) {
    if (!this.isMyTurn || this.game.gameOver) {
      e.preventDefault();
      return;
    }
    const piece = this.game.board[row][col];
    if (!piece || this.game.getPieceColor(piece) !== this.playerColor) {
      e.preventDefault();
      return;
    }
    this.dragStartSquare = { row, col };
    e.target.classList.add('dragging');
  }

  onDragEnd(e) {
    e.target.classList.remove('dragging');
    this.dragStartSquare = null;
  }

  onDrop(e, toRow, toCol) {
    e.preventDefault();
    if (!this.dragStartSquare) return;

    const move = this.validMoves.find(m => 
      m.fromRow === this.dragStartSquare.row && 
      m.fromCol === this.dragStartSquare.col &&
      m.toRow === toRow && 
      m.toCol === toCol
    );

    if (move) {
      this.makeMove(move);
    }
  }

  makeMove(move) {
    this.game.makeMove(move);
    this.selectedSquare = null;
    this.validMoves = [];
    this.renderBoard();
    this.checkGameStatus();

    if (this.gameMode === 'multiplayer') {
      this.socket.emit('makeMove', {
        gameCode: this.gameCode,
        move: move,
        gameState: this.game
      });
      this.isMyTurn = false;
      this.updateTurnIndicator();
    } else if (this.gameMode === 'ai' && !this.game.gameOver) {
      this.isMyTurn = false;
      this.updateTurnIndicator();
      
      setTimeout(() => {
        const aiMove = this.ai.getBestMove(this.game.copy());
        if (aiMove) {
          this.game.makeMove(aiMove);
          this.renderBoard();
          this.checkGameStatus();
        }
        this.isMyTurn = true;
        this.updateTurnIndicator();
      }, 500);
    }
  }

  checkGameStatus() {
    const result = this.game.checkGameOver();
    if (result) {
      this.game.gameOver = true;
      this.showGameOver(result);
      
      if (this.gameMode === 'multiplayer') {
        this.socket.emit('gameOver', {
          gameCode: this.gameCode,
          result: result
        });
      }
    }
  }

  showGameOver(result) {
    const modal = document.getElementById('game-over');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');

    if (result.type === 'checkmate') {
      title.textContent = 'Checkmate';
      message.textContent = result.winner === this.playerColor ? 'You win!' : `${result.winner} wins!`;
    } else if (result.type === 'stalemate') {
      title.textContent = 'Draw';
      message.textContent = 'Stalemate - it\'s a draw';
    }

    modal.classList.remove('hidden');
  }

  updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    if (this.game.gameOver) {
      indicator.textContent = 'Game Over';
    } else if (this.gameMode === 'ai') {
      indicator.textContent = `Turn: ${this.game.turn === 'white' ? 'Your turn' : 'AI thinking...'}`;
    } else {
      const isMyTurn = (this.game.turn === this.playerColor);
      indicator.textContent = isMyTurn ? 'Your turn' : "Opponent's turn";
    }
  }

  newGame() {
    if (this.gameMode === 'ai') {
      this.startAI(this.difficulty);
    } else if (this.gameMode === 'multiplayer') {
      this.toMenu();
    }
  }

  quitGame() {
    this.toMenu();
  }

  shareCode() {
    if (this.gameCode) {
      navigator.clipboard.writeText(this.gameCode).then(() => {
        alert('Game code copied to clipboard!');
      }).catch(() => {
        prompt('Share this code with your friend:', this.gameCode);
      });
    }
  }

  rematch() {
    document.getElementById('game-over').classList.add('hidden');
    if (this.gameMode === 'ai') {
      this.startAI(this.difficulty);
    }
  }

  toMenu() {
    document.getElementById('game-over').classList.add('hidden');
    this.game = new ChessGame();
    this.selectedSquare = null;
    this.validMoves = [];
    this.gameCode = null;
    this.showScreen('menu');
  }
}

// Initialize game
const gameController = new GameController();
