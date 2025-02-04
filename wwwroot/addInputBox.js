// CLIENT-SIDE CODE: Handles UI, user interactions, and communication with the server via SignalR
document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------------------------
  // 1. SIGNALR CONNECTION SETUP (Server-Side Communication)
  // -------------------------------------------------------------------------
  const connection = new signalR.HubConnectionBuilder()
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

  // -------------------------------------------------------------------------
  // 2. GLOBAL GAME STATE & VARIABLES (Client-Side)
  // -------------------------------------------------------------------------
  let gameState = {
    wordList: [],
    currentPlayerIndex: 0,
    remainingSeconds: 0,
    lastWord: "",
    score: 0,
    correctWordBonus: 0,
    rewriteWordBonus: 0,
  };
  let timerInterval;
  let previousWordListLength = 0;

  // -------------------------------------------------------------------------
  // 3. START THE CONNECTION (Server-Side)
  // -------------------------------------------------------------------------
  connection
    .start()
    .then(() => {
      console.log("Connected to SignalR hub.");
    })
    .catch((err) => console.error("SignalR Connection Error:", err));

  // -------------------------------------------------------------------------
  // 4. SIGNALR SERVER -> CLIENT HANDLERS (Server-Side -> Client)
  //    These are called when the server broadcasts messages or updates
  // -------------------------------------------------------------------------
  connection.on("ReceiveGameState", (newState) => {
    gameState = { ...newState };
    updateUI();
  });

  connection.on("ReceiveUserInput", (index, input) => {
    const inputs = document.querySelectorAll(".wordInput");
    if (inputs[index]) {
      inputs[index].value = input;
      updateInputSize(inputs[index]);
    }
  });

  connection.on("ReceiveAnimation", (index, animationType) => {
    const inputs = document.querySelectorAll(".wordInput");
    if (inputs[index]) {
      inputs[index].classList.add(animationType);
    }
  });

  // -------------------------------------------------------------------------
  // 5. SIGNALR CLIENT -> SERVER INVOCATIONS (Server-Side Calls)
  //    Functions that broadcast data or invoke server methods
  // -------------------------------------------------------------------------
  function broadcastGameState() {
    connection
      .invoke("BroadcastGameState", gameState)
      .catch((err) => console.error("Error broadcasting game state:", err));
  }

  function broadcastUserInput(index, input) {
    connection
      .invoke("BroadcastUserInput", index, input)
      .catch((err) => console.error("Error broadcasting user input:", err));
  }

  function broadcastAnimation(index, animationType) {
    connection
      .invoke("BroadcastAnimation", index, animationType)
      .catch((err) => console.error("Error broadcasting animation:", err));
  }

  // -------------------------------------------------------------------------
  // 6. UI & RENDERING LOGIC (Client-Side)
  // -------------------------------------------------------------------------

  function updateUI() {
    if (gameState.wordList.length === 1) {
      setTimeout(() => {
        renderWordBoxes();
        highlightCurrentPlayer();
        updateScore();
        updateTimer();
      }, 3000);
    } else if (gameState.wordList.length > previousWordListLength) {
      setTimeout(() => {
        renderWordBoxes();
        highlightCurrentPlayer();
        updateScore();
        updateTimer();
      }, 750);
    } else {
      renderWordBoxes();
      highlightCurrentPlayer();
      updateScore();
      updateTimer();
    }

    previousWordListLength = gameState.wordList.length;
  }

  function renderWordBoxes() {
    const gameContainer = document.querySelector(".grid-child-game");
    gameContainer.innerHTML = "";

    gameState.wordList.forEach((_, index) => {
      const existingWordBox = createWordBox("", true, index);
      gameContainer.appendChild(existingWordBox);
    });

    const newWordBox = createWordBox("", false, gameState.wordList.length);
    gameContainer.appendChild(newWordBox);

    const firstInput = gameContainer.querySelector(".wordInput");
    if (firstInput) firstInput.focus();
  }

  function createWordBox(word = "", isExisting = false, index) {
    const box = document.createElement("div");
    box.classList.add("wordCard");
    box.innerHTML = `
            <input class="wordInput" id="gameInput" type="text" 
                   placeholder="${isExisting ? "Re-enter word..." : "Enter new word..."}" 
                   data-index="${index}">
            <p class="doubleWarning" style="display: none;">Word already used</p>
        `;
    const input = box.querySelector(".wordInput");
    updateInputSize(input);

    input.addEventListener("input", (e) => {
      updateInputSize(input);
      broadcastUserInput(index, e.target.value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleWordSubmission(input, index);
      }
    });

    return box;
  }

  // -------------------------------------------------------------------------
  // 7. WORD SUBMISSION & VALIDATION (Client-Side)
  // -------------------------------------------------------------------------
  function handleWordSubmission(input, index) {
    const enteredWord = input.value.trim().toLowerCase();

    // Submitting an existing word
    if (index < gameState.wordList.length) {
      if (enteredWord === gameState.wordList[index].toLowerCase()) {
        markWordAsCorrect(input, index);
        focusNextInput(input);
        addTimeToTimer(false);
      } else {
        showIncorrectWordAnimation(input, index);
      }
    } else {
      // Submitting a new word
      if (isValidNewWord(enteredWord)) {
        submitNewWord(enteredWord, input, index);
        restartClock();
      } else {
        showInvalidWordAnimation(input, index);
      }
    }
  }

  function isValidNewWord(word) {
    return word && checkWordStart(word) && !isWordDuplicate(word);
  }

  function checkWordStart(word) {
    if (!gameState.lastWord) return true;
    return (
      word.charAt(0).toLowerCase() ===
      gameState.lastWord.slice(-1).toLowerCase()
    );
  }

  function isWordDuplicate(word) {
    return gameState.wordList.includes(word);
  }

  function submitNewWord(word, input, index) {
    gameState.wordList.push(word);
    gameState.lastWord = word;
    gameState.currentPlayerIndex++;
    gameState.score++;
    saveWord(word);
    markWordAsCorrect(input, index);
    updateUI();
    broadcastGameState();
  }

  function markWordAsCorrect(input, index) {
    input.disabled = true;
    input.classList.add("correct", "startAnimation");
    broadcastAnimation(index, "startAnimation");
  }

  // -------------------------------------------------------------------------
  // 8. ANIMATION & VISUAL FEEDBACK (Client-Side)
  // -------------------------------------------------------------------------
  function showIncorrectWordAnimation(input, index) {
    input.classList.add("shake");
    broadcastAnimation(index, "shake");
    setTimeout(() => {
      input.classList.remove("shake");
      input.value = "";
      updateInputSize(input);
    }, 500);
  }

  function showCorrectAnimation(input, index) {
    input.classList.add("startAnimation");
    input.disabled = true;
    broadcastAnimation(index, "startAnimation");
  }

  function showInvalidWordAnimation(input, index) {
    input.classList.add("shake");
    broadcastAnimation(index, "shake");
    setTimeout(() => {
      input.classList.remove("shake");
      input.value = "";
      updateInputSize(input);
    }, 500);
  }

  function updateInputSize(input) {
    const maxChars = 20;
    input.size = Math.min(
      Math.max(input.value.length, input.placeholder.length, 1),
      maxChars,
    );
  }

  // -------------------------------------------------------------------------
  // 9. PLAYER & SCORE HANDLING (Client-Side)
  // -------------------------------------------------------------------------
  function highlightCurrentPlayer() {
    const players = document.querySelectorAll(".grid-child-players .card");
    players.forEach((player) => player.classList.remove("green-shadow"));
    players[gameState.currentPlayerIndex % players.length].classList.add(
      "green-shadow",
    );
  }

  function updateScore() {
    document.getElementById("counter").textContent =
      `Score: ${gameState.score}`;
  }

  // -------------------------------------------------------------------------
  // 10. TIMER LOGIC (Client-Side)
  // -------------------------------------------------------------------------
  function updateTimer() {
    if (gameState.remainingSeconds <= 0) {
      clearInterval(timerInterval);
      document.getElementById("timer").textContent = "Finished";
      document
        .querySelectorAll(".wordInput")
        .forEach((input) => (input.disabled = true));
    } else {
      document.getElementById("timer").textContent =
        gameState.remainingSeconds.toFixed(1);
    }
  }

  function startTimer() {
    clearInterval(timerInterval);
    if (!gameState.remainingSeconds) {
      initializeGameSettings();
    }
    timerInterval = setInterval(() => {
      gameState.remainingSeconds -= 0.1;
      if (gameState.remainingSeconds <= 0) {
        clearInterval(timerInterval);
      }
      updateTimer();
    }, 100);
  }

  function restartClock() {
    initializeGameSettings();
    clearInterval(timerInterval);
    startTimer();
    broadcastGameState();
  }

  function addTimeToTimer(isRewrite) {
    const bonusTime = isRewrite
      ? gameState.rewriteWordBonus
      : gameState.correctWordBonus;
    gameState.remainingSeconds += bonusTime;
    updateTimer();
    //broadcastGameState();
  }

  // -------------------------------------------------------------------------
  // 11. UTILITY FUNCTIONS (Client-Side)
  // -------------------------------------------------------------------------
  function focusNextInput(currentInput) {
    const nextInput = currentInput
      .closest(".wordCard")
      .nextElementSibling?.querySelector(".wordInput");
    if (nextInput) nextInput.focus();
  }

  async function saveWord(word) {
    try {
      const response = await fetch("/new-word/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await response.json();
      console.log("Word saved:", data);
    } catch (error) {
      console.error("Error saving word:", error);
    }
  }

  // -------------------------------------------------------------------------
  // 12. INITIALIZE GAME (Client-Side)
  // -------------------------------------------------------------------------
  startTimer();
  updateUI();

  // Add connection state handling
  connection.onreconnecting((error) => {
    console.log("Reconnecting to hub...", error);
  });

  connection.onreconnected((connectionId) => {
    console.log("Reconnected to hub.", connectionId);
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get("roomId");
    if (lobbyId) {
      connection.invoke("JoinLobby", lobbyId);
    }
  });

  function initializeGameSettings() {
    const difficulty = localStorage.getItem("gameDifficulty") || "medium";
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

    const settings = difficultySettings[difficulty];
    gameState.remainingSeconds = settings.initialTime;
    gameState.correctWordBonus = settings.correctWordBonus;
    gameState.rewriteWordBonus = settings.rewriteWordBonus;
  }
});

