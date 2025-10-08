# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoWords is a multiplayer word chain game built with ASP.NET Core and SignalR. Players join lobbies and take turns entering words where each new word must start with the last letter of the previous word, while remembering all previous words in the chain.

**Live at:** https://echowords.xyz

## Tech Stack

- **Backend:** ASP.NET Core 8.0 (C#)
- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Real-time:** SignalR for multiplayer communication
- **Database:** PostgreSQL (via Npgsql)
- **Deployment:** GitHub Actions CI/CD pipeline

## Development Commands

### Building and Running

```bash
# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run the application (development)
dotnet run

# Run with specific runtime
dotnet run --runtime linux-x64
```

### Testing

```bash
# Run Playwright E2E tests (headless mode by default)
npm run test:e2e

# Run Playwright tests in headed mode (configured in playwright.config.js)
npx playwright test
```

## Environment Configuration

The application requires the following environment variables (configured in `.env` or via environment):

- `ECHO_PG_HOST` - PostgreSQL host
- `ECHO_PG_PORT` - PostgreSQL port
- `ECHO_PG_USER` - PostgreSQL username
- `ECHO_PG_PASSWORD` - PostgreSQL password
- `ECHO_DB_NAME` - Database name

These are loaded via `builder.Configuration` in `Program.cs:13-17`.

## Architecture Overview

### Backend Structure

**Program.cs** - Application entry point
- Configures SignalR with detailed errors and extended handshake timeout
- Sets up PostgreSQL connection via NpgsqlDataSource (singleton)
- Registers the GameHub at `/gameHub`
- Implements client ID cookie middleware for player tracking

**GameHub.cs** - SignalR hub for real-time multiplayer
- Manages lobby group membership (`JoinLobby`, `LeaveLobby`)
- Broadcasts game state, difficulty settings, user input, animations, and timer events
- Uses SignalR groups to isolate lobby communication

**Actions.cs** - REST API endpoints and game logic
- `POST /new-player` - Creates player records with username, clientId, lobbyId, and avatarSeed
- `POST /create-lobby` - Generates 4-character alphanumeric lobby codes
- `GET /lobby/{lobbyId}/players` - Fetches all players in a lobby
- `POST /update-player-lobby` - Updates or creates player lobby associations, broadcasts via SignalR
- `POST /lobby/{lobbyId}/submit-results` - Stores match results (score, words submitted, accuracy)
- `GET /lobby/{lobbyId}/results` - Retrieves aggregated match results for a lobby
- Database operations use parameterized queries via Npgsql

**LobbyManager.cs** - In-memory lobby tracking
- Static dictionary for lobby existence checks during lobby creation
- Prevents duplicate lobby codes

### Data Models

- **Player** (`player.cs`) - Represents a player with Id, Username, ClientId, LobbyId, AvatarSeed, JoinedAt
- **Lobby** (`Lobby.cs`) - Lobby metadata with LobbyId, Players list, LastActive timestamp
- **WordRequest** (`WordRequest.cs`) - Request DTO for word submission and lobby operations
- **PlayerResult** (`PlayerResult.cs`) - Match result data with Username, Score, WordsSubmitted, Accuracy

### Frontend Structure

All frontend files are in `wwwroot/`:

- **index.html** - Landing page
- **enterLobbyCode.html/js** - Join existing lobby by code
- **preGame.html** - Pre-game lobby with player list and difficulty selection
- **gamePage.html** - Main game interface
- **matchResult.html/matchResults.js** - End-of-game results display
- **addInputBox.js** - Core game logic for word input, validation, and turn management (31KB, largest JS file)
- **difficultySelector.js** - Difficulty level selection component
- **usernameStartpage.js** / **usernamePreGame.js** - Username management
- **createLobby.js** - Lobby creation flow
- **addCard.js** - Player card UI components
- **shop.js/shop.html/shop.css** - Avatar shop interface (uses DiceBear for avatar generation)

### Database Schema (PostgreSQL)

Tables referenced in code:
- `players` - Stores player data (id, username, clientid, lobbyid, avatarseed, joined_at)
- `player_match_results` - Match results (player_id, score, words_submitted, accuracy)
- `playerwords` - Word submissions history (wordinput, clientid)
- `words` - Word dictionary table (referenced in commented code)

### SignalR Communication Flow

1. Client connects and calls `JoinLobby(lobbyId)` to join SignalR group
2. REST API operations in Actions.cs broadcast updates via `IHubContext<GameHub>`
3. Hub methods broadcast to specific lobby groups (e.g., `Clients.Group(lobbyId).SendAsync(...)`)
4. Frontend listens for events: `ReceiveGameState`, `PlayerJoined`, `ReceiveDifficultyUpdate`, `ReceiveUserInput`, `ReceiveAnimation`, `ReceiveTimerStart/Sync/Pause/Resume`, `RedirectToGame`, `AvatarUpdated`

### Client ID System

- Unique client IDs are generated using `RandomNumberGenerator` (Program.cs:88-94)
- Stored in HttpOnly, Secure cookies with 365-day expiration
- Used to associate players across sessions and prevent duplicate entries

## Deployment

The project uses GitHub Actions (`.github/workflows/cidi.yaml`) for CI/CD:
- Triggers on push/PR to main branch
- SSH into production server
- Pulls latest code, restores dependencies, builds project
- Manages app with PM2 process manager (`pm2 start "dotnet run --runtime linux-x64" --name echowords`)
- Injects environment variables from GitHub secrets

## Key Development Notes

- The codebase uses C# nullable reference types (`<Nullable>enable</Nullable>`)
- SignalR timeout is set to 15 seconds (`HandshakeTimeout`)
- Lobby codes are generated with collision detection (max 10 attempts)
- Avatar seeds use GUIDs for DiceBear API integration
- Database.cs is commented out - connection is managed directly in Program.cs
- Some word validation logic is commented out in Actions.cs (TestWord, GetWordList methods)
