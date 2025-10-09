document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyId = urlParams.get("roomId");
  const isSoloMode = !lobbyId;

  if (isSoloMode) {
    console.log("Solo mode detected");
  }

  function addPlayerCardLobby(username, playerIndex, avatarSeed) {
    const cardHolderLobby = document.querySelector(".cardHolder");
    if (!cardHolderLobby) return;

    if (
      Array.from(cardHolderLobby.children).some(
        (card) => card.querySelector("h4")?.textContent === username,
      )
    ) {
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
    randomizeBtn.addEventListener("click", async () => {
      const randomSeed = Math.random().toString(36).substring(2, 12);
      const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
      const img = card.querySelector('img[alt="Avatar"]');
      if (img) {
        img.src = newAvatarUrl;
        if (!isSoloMode && typeof connection !== 'undefined') {
          await connection.invoke("UpdateAvatar", lobbyId, username, randomSeed);
        }
      }
    });
  }

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

  if (isSoloMode) {
    // Create a solo player for solo mode
    const username = localStorage.getItem("username") || "Solo Player";
    const avatarSeed = localStorage.getItem("avatarSeed") || username;

    if (document.querySelector(".grid-child-players")) {
      addPlayerCardGame(username, 0, avatarSeed);
    }
  } else {
    // Multiplayer mode - fetch players from server
    if (document.querySelector(".cardHolder")) {
      await populatePlayersLobby(lobbyId);
    }

    if (document.querySelector(".grid-child-players")) {
      await populatePlayersGame(lobbyId);
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

  if (!isSoloMode) {
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
        addPlayerCardLobby(
          player.username,
          document.querySelectorAll(".cardHolder .card").length,
          player.avatarSeed,
        );
      }
    });

    connection.on("AvatarUpdated", (username, newSeed) => {
      console.log("Avatar updated for:", username, "with seed:", newSeed);
      const cards = document.querySelectorAll(".card");
      cards.forEach((card) => {
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
  } else {
    console.log("Solo mode - SignalR disabled in addCard.js");
  }
});
