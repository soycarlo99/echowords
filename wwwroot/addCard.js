document.addEventListener("DOMContentLoaded", async () => {
  // Parse the lobbyId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyId = urlParams.get("roomId");

  if (!lobbyId) {
    console.error("Lobby ID not found in URL.");
    return;
  }

  // Function to create a player card in the Lobby section
  function addPlayerCardLobby(username, playerIndex, avatarSeed) {
    const cardHolderLobby = document.querySelector(".cardHolder");
    if (!cardHolderLobby) return;

    // Prevent duplicate entries
    if (Array.from(cardHolderLobby.children).some(
        (card) => card.querySelector("h4")?.textContent === username
    )) {
        console.warn(`Player "${username}" already exists.`);
        return;
    }

    const storedSeed = avatarSeed || username;
    const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
    const card = document.createElement("div");
    card.classList.add("card", "fade-in"); // Add fade-in class
    card.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" style="width:100%">
      <div class="container">
          <h4><b>${username}</b></h4>
          <button class="randomizeBtn">Randomize</button>
      </div>
    `;
    cardHolderLobby.appendChild(card);
    
    // Trigger reflow to ensure animation plays
    card.offsetHeight;

    const randomizeBtn = card.querySelector(".randomizeBtn");
    randomizeBtn.addEventListener("click", async () => {
      const randomSeed = Math.random().toString(36).substring(2, 12);
      const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
      const img = card.querySelector('img[alt="Avatar"]');
      if (img) {
        img.src = newAvatarUrl;
        await connection.invoke("UpdateAvatar", lobbyId, username, randomSeed);
      }
    });
  }

  // Function to retrieve and populate lobby players from the server
  async function populatePlayersLobby(lobbyId) {
    try {
      const response = await fetch(`/lobby/${lobbyId}/players`);
      console.log(
        `Fetching players for lobby ${lobbyId}: status`,
        response.status,
      );
      if (!response.ok) throw new Error("Failed to fetch players");
      const players = await response.json();
      console.log("Players data retrieved:", players);
      players.forEach((player, index) => {
        addPlayerCardLobby(player.username, index, player.avatarSeed);
      });
    } catch (error) {
      console.error("Error populating players:", error);
    }
  }

  function addPlayerCardGame(username, playerIndex, avatarSeed) {
    const gridChildPlayers = document.querySelector(".grid-child-players");
    if (!gridChildPlayers) return;

    // Prevent duplicate entries
    if (
      Array.from(gridChildPlayers.children).some(
        (card) => card.querySelector("h4")?.textContent === username,
      )
    ) {
      console.warn(`Player "${username}" already exists.`);
      return;
    }

    const storedSeed = avatarSeed || username;
    const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" style="width:100%">
      <div class="container">
          <h4><b>${username}</b></h4>
          <p class="counter" id="counters" data-player-index="${playerIndex}">Score: 0</p>
      </div>
    `;
    gridChildPlayers.appendChild(card);
}

  // Function to retrieve and populate game players from the server
  async function populatePlayersGame(lobbyId) {
    const gridChildPlayers = document.querySelector(".grid-child-players");
    if (!gridChildPlayers) return;

    try {
      const response = await fetch(`/lobby/${lobbyId}/players`);
      if (!response.ok) throw new Error("Failed to fetch players");
      const players = await response.json();

      players.forEach((player, index) => {
        addPlayerCardGame(player.username, index, player.avatarSeed);
      });
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  }

  if (document.querySelector(".cardHolder")) {
    await populatePlayersLobby(lobbyId);
  }

  if (document.querySelector(".grid-child-players")) {
    await populatePlayersGame(lobbyId);
  }

  // Randomize Avatars
  const randomizeBtn = document.getElementById("randomizeAvatars");
  if (randomizeBtn) {
    randomizeBtn.addEventListener("click", () => {
      const avatarImages = document.querySelectorAll('.card img[alt="Avatar"]');
      avatarImages.forEach((img) => {
        const randomSeed = Math.random().toString(36).substring(2, 12);
        const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
        img.src = newAvatarUrl;
      });
    });
  }

let connection = new signalR.HubConnectionBuilder()
  .withUrl("/gameHub", {
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets,
    headers: {
      "X-Forwarded-Proto": "https",
    },
  })
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Debug)
  .build();

connection.on("PlayerJoined", (player) => {
  console.log("A new player joined:", player);
  if (document.querySelector(".cardHolder")) {
    addPlayerCardLobby(player.username, document.querySelectorAll(".cardHolder .card").length, player.avatarSeed);
  }
});

connection.on("AvatarUpdated", (username, newSeed) => {
  console.log("Avatar updated for:", username, "with seed:", newSeed);
  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    const usernameElement = card.querySelector("h4");
    if (usernameElement?.textContent === username) {
      const img = card.querySelector('img[alt="Avatar"]');
      if (img) {
        img.src = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(newSeed)}`;
      }
    }
  });
});

async function initializeSignalR() {
  try {
    await connection.start();
    console.log("Connected to SignalR for real-time updates");
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get("roomId");
    if (lobbyId) {
      await connection.invoke("JoinLobby", lobbyId);
    }
  } catch (err) {
    console.error(err);
    setTimeout(initializeSignalR, 5000);
  }
}

initializeSignalR();
});

