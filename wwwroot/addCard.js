document.addEventListener("DOMContentLoaded", async () => {
  // Parse the lobbyId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyId = urlParams.get('roomId');

  if(!lobbyId) {
    console.error("Lobby ID not found in URL.");
    return;
  }

  // Function to create a player card in the Lobby section
  function addPlayerCardLobby(username, playerIndex, avatarSeed) {
    const cardHolderLobby = document.querySelector('.cardHolder');
    if(!cardHolderLobby) return;

    // Prevent duplicate entries
    if (Array.from(cardHolderLobby.children).some(card => card.querySelector('h4')?.textContent === username)) {
      console.warn(`Player "${username}" already exists.`);
      return;
    }

    const storedSeed = avatarSeed || username;
    const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" style="width:100%">
      <div class="container">
          <h4><b>${username}</b></h4>
          <button class="randomizeBtn">Randomize</button>
      </div>
    `;
    cardHolderLobby.appendChild(card);

    const randomizeBtn = card.querySelector('.randomizeBtn');
    randomizeBtn.addEventListener('click', () => {
      const randomSeed = Math.random().toString(36).substring(2, 12);
      const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
      const img = card.querySelector('img[alt="Avatar"]');
      if(img) {
        img.src = newAvatarUrl;
        // Optionally: Notify server of avatar change for this user
      }
    });
  }

  // Function to retrieve and populate lobby players from the server
  async function populatePlayersLobby(lobbyId) {
    try {
      const response = await fetch(`http://localhost:5185/lobby/${lobbyId}/players`);
      console.log(`Fetching players for lobby ${lobbyId}: status`, response.status);
      if(!response.ok) throw new Error("Failed to fetch players");
      const players = await response.json();
      console.log("Players data retrieved:", players);
      players.forEach((player, index) => {
        addPlayerCardLobby(player.username, index, player.avatarSeed);
      });
    } catch (error) {
      console.error("Error populating players:", error);
    }
  }

  // Function to create a player card in the Game section
  function addPlayerCardGame(username, playerIndex, avatarSeed) {
    const gridChildPlayers = document.querySelector('.grid-child-players');
    if(!gridChildPlayers) return;

    // Prevent duplicate entries
    if (Array.from(gridChildPlayers.children).some(card => card.querySelector('h4')?.textContent === username)) {
      console.warn(`Player "${username}" already exists.`);
      return;
    }

    const storedSeed = avatarSeed || username;
    const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" style="width:100%">
      <div class="container">
          <h4><b>${username}</b></h4>
          <p id="counter">Score: 0</p>
      </div>
    `;
    gridChildPlayers.appendChild(card);
  }

  // Function to retrieve and populate game players from the server
  async function populatePlayersGame(lobbyId) {
    const gridChildPlayers = document.querySelector('.grid-child-players');
    if(!gridChildPlayers) return;

    try {
      const response = await fetch(`http://localhost:5185/lobby/${lobbyId}/players`);
      if(!response.ok) throw new Error("Failed to fetch players");
      const players = await response.json();

      const playerCount = players.length;
      if(playerCount < 1) {
        console.warn("You need at least 1 player to start!");
        return;
      }
      if(playerCount > 8) {
        console.warn("Maximum 8 players allowed in a lobby!");
        return;
      }

      players.forEach((player, index) => {
        addPlayerCardGame(player.username, index, player.avatarSeed);
      });
    } catch (error) {
      console.error(error);
    }
  }

  // Populate Lobby Section if on a page with .cardHolder
  if(document.querySelector('.cardHolder')) {
    await populatePlayersLobby(lobbyId);
  }

  // Populate Game Section if on a page with .grid-child-players
  if(document.querySelector('.grid-child-players')) {
    await populatePlayersGame(lobbyId);
  }

  // Randomize Avatars Button Logic remains unchanged
  const randomizeBtn = document.getElementById('randomizeAvatars');
  if(randomizeBtn) {
    randomizeBtn.addEventListener('click', () => {
      const avatarImages = document.querySelectorAll('.card img[alt="Avatar"]');
      avatarImages.forEach(img => {
        const randomSeed = Math.random().toString(36).substring(2, 12);
        const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
        img.src = newAvatarUrl;
      });
    });
  }

  // SignalR integration for real-time updates (basic setup)
  let connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5185/gameHub")
      .build();

  connection.on("PlayerJoined", (player) => {
    console.log("A new player joined:", player);
    // Add player to Lobby UI if applicable
    if(document.querySelector('.cardHolder')) {
      const nextIndex = document.querySelectorAll('.cardHolder .card').length;
      addPlayerCardLobby(player.username, nextIndex, player.avatarSeed);
    }
    // Similarly, update Game Section if necessary
  });

  try {
    await connection.start();
    console.log("Connected to SignalR for real-time updates");
    // Optionally join a SignalR group for the lobby if needed:
    await connection.invoke("JoinLobby", lobbyId);
  } catch(err) {
    console.error(err);
  }
});