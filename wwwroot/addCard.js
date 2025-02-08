document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyId = urlParams.get("roomId");

  if (!lobbyId) {
    console.error("Lobby ID not found in URL.");
    return;
  }

  function addPlayerCardLobby(username, playerIndex, avatarSeed) {
    const cardHolderLobby = document.querySelector(".cardHolder");
    if (!cardHolderLobby) {
      console.warn("Card holder not found");
      return;
    }

    const existingPlayer = Array.from(cardHolderLobby.children).find(
      (card) => card.querySelector("h4")?.textContent.toLowerCase() === username.toLowerCase()
    );
    
    if (existingPlayer) {
      console.warn(`Player "${username}" already exists.`);
      return;
    }

    const storedSeed = avatarSeed || username;
    const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
    const card = document.createElement("div");
    card.classList.add("card", "fade-in");
    card.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" style="width:100%">
      <div class="container">
          <h4><b>${username}</b></h4>
          <button class="randomizeBtn">Randomize</button>
      </div>
    `;
    cardHolderLobby.appendChild(card);
    
    card.offsetHeight;

    const randomizeBtn = card.querySelector(".randomizeBtn");
    randomizeBtn.addEventListener("click", () => {
      const randomSeed = Math.random().toString(36).substring(2, 12);
      const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
      const img = card.querySelector('img[alt="Avatar"]');
      if (img) {
        img.src = newAvatarUrl;
      }
    });
  }

  async function populatePlayersLobby(lobbyId) {
    try {
      const response = await fetch(`/lobby/${lobbyId}/players`);
      console.log(`Fetching players for lobby ${lobbyId}: status`, response.status);
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

    if (Array.from(gridChildPlayers.children).some(
      (card) => card.querySelector("h4")?.textContent === username
    )) {
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

  let isConnected = false;

  connection.on("PlayerJoined", (player) => {
    console.log("A new player joined:", player);
    if (!player || !player.username) {
      console.error("Invalid player data received");
      return;
    }
    
    if (document.querySelector(".cardHolder")) {
      try {
        addPlayerCardLobby(
          player.username, 
          document.querySelectorAll(".cardHolder .card").length, 
          player.avatarSeed
        );
      } catch (error) {
        console.error("Error adding player card:", error);
      }
    }
  });

  async function initializeSignalR() {
    if (isConnected) {
      console.log("Already connected to SignalR");
      return;
    }

    try {
      await connection.start();
      isConnected = true;
      console.log("Connected to SignalR for real-time updates");
      
      if (lobbyId) {
        await connection.invoke("JoinLobby", lobbyId);
        console.log("Joined lobby:", lobbyId);
      }
    } catch (err) {
      console.error("SignalR connection error:", err);
      isConnected = false;
      setTimeout(initializeSignalR, 5000);
    }
  }

  if (document.querySelector(".cardHolder")) {
    Promise.all([
      initializeSignalR(),
      populatePlayersLobby(lobbyId)
    ]).catch(error => {
      console.error("Error during initialization:", error);
    });
  } else if (document.querySelector(".grid-child-players")) {
    Promise.all([
      initializeSignalR(),
      populatePlayersGame(lobbyId)
    ]).catch(error => {
      console.error("Error during initialization:", error);
    });
  } else {
    initializeSignalR();
  }
});