const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game rooms storage
const rooms = new Map();

// Generate 6-character game code
function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create new game room
  socket.on('createGame', (callback) => {
    let gameCode = generateGameCode();
    while (rooms.has(gameCode)) {
      gameCode = generateGameCode();
    }

    const room = {
      code: gameCode,
      players: { white: socket.id, black: null },
      gameState: null,
      currentTurn: 'white'
    };

    rooms.set(gameCode, room);
    socket.join(gameCode);
    socket.gameCode = gameCode;
    socket.playerColor = 'white';

    console.log(`Game created: ${gameCode} by ${socket.id}`);
    callback({ success: true, gameCode, color: 'white' });
  });

  // Join existing game
  socket.on('joinGame', (gameCode, callback) => {
    const code = gameCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    if (room.players.black) {
      callback({ success: false, error: 'Game is full' });
      return;
    }

    room.players.black = socket.id;
    socket.join(code);
    socket.gameCode = code;
    socket.playerColor = 'black';

    // Notify both players
    io.to(room.players.white).emit('gameStart', { color: 'white', opponent: 'black' });
    io.to(room.players.black).emit('gameStart', { color: 'black', opponent: 'white' });

    console.log(`Player joined: ${code} as black`);
    callback({ success: true, gameCode: code, color: 'black' });
  });

  // Handle move in multiplayer
  socket.on('makeMove', (moveData) => {
    const { gameCode, move, gameState } = moveData;
    const room = rooms.get(gameCode);

    if (!room) return;

    // Update room state
    room.gameState = gameState;
    room.currentTurn = room.currentTurn === 'white' ? 'black' : 'white';

    // Broadcast move to opponent
    const opponentColor = socket.playerColor === 'white' ? 'black' : 'white';
    const opponentId = room.players[opponentColor];

    if (opponentId) {
      io.to(opponentId).emit('opponentMove', { move, gameState });
    }
  });

  // Handle game over
  socket.on('gameOver', (data) => {
    const { gameCode, result } = data;
    const room = rooms.get(gameCode);

    if (room) {
      const opponentColor = socket.playerColor === 'white' ? 'black' : 'white';
      const opponentId = room.players[opponentColor];

      if (opponentId) {
        io.to(opponentId).emit('gameEnded', { result });
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.gameCode) {
      const room = rooms.get(socket.gameCode);
      if (room) {
        const opponentColor = socket.playerColor === 'white' ? 'black' : 'white';
        const opponentId = room.players[opponentColor];

        if (opponentId) {
          io.to(opponentId).emit('opponentLeft');
        }

        // Clean up room
        rooms.delete(socket.gameCode);
        console.log(`Game ended: ${socket.gameCode} - player disconnected`);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
