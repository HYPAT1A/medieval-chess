# Medieval Chess - Project Specification

## Overview
A medieval-themed chess game with AI and multiplayer support. Web-based application.

## Requirements

### Core Features
1. **Chess Board**: 8x8 grid using provided board asset
2. **Chess Pieces**: 12 piece sprites (6 white, 6 black) from provided assets
3. **Game Logic**: Full chess rules (move validation, check/checkmate detection, castling, en passant, pawn promotion)
4. **AI Opponent**: Depth-based difficulty (Easy/Medium/Hard)
5. **Multiplayer**: Shareable game codes for real-time PvP

### User Interface
- Main menu: Play vs AI, Play vs Friend
- AI difficulty selection (Easy/Medium/Hard)
- Game screen with board, captured pieces, and game status
- "New Game" and "Share Code" buttons
- Game over screen with result

### Technical Stack
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js + Express + Socket.IO
- **Hosting**: Render (free tier with WebSocket support)

### Asset Path
All assets stored in `/assets/` directory:
- `board.png`
- `wP.png`, `wR.png`, `wN.png`, `wB.png`, `wQ.png`, `wK.png`
- `bP.png`, `bR.png`, `bN.png`, `bB.png`, `bQ.png`, `bK.png`

## Architecture

### Server (Node.js + Socket.IO)
- Express serves static files
- Socket.IO handles:
  - Room creation (generates game code)
  - Player pairing via game code
  - Move synchronization between players
  - Game state management

### Client
- Chess board rendered on HTML canvas or DOM elements
- Drag-and-drop piece movement
- Socket.IO client for multiplayer sync
- Minimax AI with alpha-beta pruning for opponent

### AI Difficulty
- **Easy**: Random valid move selection
- **Medium**: Depth-2 search with simple evaluation
- **Hard**: Depth-4 search with positional evaluation

### Game Code Generation
- 6-character alphanumeric code
- Room-based matchmaking
- Player color assignment (white joins first, black joins with code)

## Acceptance Criteria
1. Board displays correctly with all assets visible
2. All piece types render in correct positions at game start
3. Legal moves are enforced for all pieces
4. AI responds to moves at selected difficulty
5. Game codes can be shared and used to join a game
6. Both players see synchronized board state
7. Check and checkmate are detected and announced
8. Game can be restarted without page refresh
