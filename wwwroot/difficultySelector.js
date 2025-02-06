document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");

  // Create SignalR connection
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/gameHub")
    .build();

  // Make connection available globally
  window.signalRConnection = connection;

  const difficultySettings = {
    easy: {
      initialTime: 60,
      correctWordBonus: 3,
      rewriteWordBonus: 1.5,
    },
    medium: {
      initialTime: 30,
      correctWordBonus: 2,
      rewriteWordBonus: 1,
    },
    hard: {
      initialTime: 15,
      correctWordBonus: 1,
      rewriteWordBonus: 0.5,
    },
    extreme: {
      initialTime: 10,
      correctWordBonus: 0.5,
      rewriteWordBonus: 0.25,
    },
  };

  // Get saved difficulty or default to medium
  let selectedDifficulty = localStorage.getItem("gameDifficulty") || "medium";

  function updateDifficultyDisplay(difficulty) {
    console.log("Updating difficulty display to:", difficulty);
    
    // Get all the elements we need to update
    const difficultyBtns = document.querySelectorAll(".difficulty-btn");
    const initialTimeText = document.getElementById("initialTime");
    const correctBonusText = document.getElementById("correctBonusValue");
    const rewriteBonusText = document.getElementById("rewriteBonusValue");
    
    const settings = difficultySettings[difficulty];

    // Update the display values
    initialTimeText.textContent = `Initial Time: ${settings.initialTime} seconds`;
    correctBonusText.textContent = `+${settings.correctWordBonus} seconds`;
    rewriteBonusText.textContent = `+${settings.rewriteWordBonus} seconds`;

    // Update button states
    difficultyBtns.forEach((btn) => {
      if (btn.dataset.difficulty === difficulty) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update game settings if they exist
    if (window.gameState) {
      window.gameState.remainingSeconds = settings.initialTime;
      window.gameState.correctWordBonus = settings.correctWordBonus;
      window.gameState.rewriteWordBonus = settings.rewriteWordBonus;
    }
  }

  // Set up all SignalR handlers
  connection.on("RedirectToGame", () => {
    console.log("Received redirect signal");
    window.location.href = `gamePage.html?roomId=${roomId}`;
  });

  connection.on("ReceiveMessage", (message) => {
    console.log("Received message:", message);
  });

  connection.on("ReceiveDifficultyUpdate", (difficulty) => {
    console.log("Received difficulty update:", difficulty);
    selectedDifficulty = difficulty;
    localStorage.setItem("gameDifficulty", selectedDifficulty);
    updateDifficultyDisplay(selectedDifficulty); // Remove the requestAnimationFrame
  });

  // Initialize event listeners for difficulty buttons
  function initializeDifficultyButtons() {
    const difficultyBtns = document.querySelectorAll(".difficulty-btn");
    difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        selectedDifficulty = btn.dataset.difficulty;
        localStorage.setItem("gameDifficulty", selectedDifficulty);
        updateDifficultyDisplay(selectedDifficulty);

        if (roomId) {
          try {
            await connection.invoke("BroadcastDifficulty", roomId, selectedDifficulty);
            console.log("Broadcasted difficulty:", selectedDifficulty);
          } catch (err) {
            console.error("Error broadcasting difficulty:", err);
          }
        }
      });
    });
  }

  // Initialize connection and setup
  async function initializeConnection() {
    if (!roomId) {
      console.error("No roomId found in URL.");
      return;
    }

    try {
      await connection.start();
      console.log("Connected to SignalR hub");
      
      await connection.invoke("JoinLobby", roomId);
      console.log("Joined lobby:", roomId);

      // Add click event listener to the start game button
      const startGameButton = document.getElementById("startGameButton");
      if (startGameButton) {
        startGameButton.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            await connection.invoke("StartGame", roomId);
            console.log("Start game signal sent");
          } catch (err) {
            console.error("Error starting game:", err);
          }
        });
      }

      // Initialize difficulty buttons after connection is established
      initializeDifficultyButtons();
      // Set initial difficulty display
      updateDifficultyDisplay(selectedDifficulty);
    } catch (err) {
      console.error("Error during connection:", err);
    }
  }

  // Start initialization
  initializeConnection();
});