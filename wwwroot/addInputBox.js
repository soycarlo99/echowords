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
    scores: {},
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
    const oldLength = gameState.wordList.length;
    gameState = { ...gameState, ...newState }; 
    previousWordListLength = oldLength;
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

connection.on("ReceiveTimerSync", (remainingTime) => {
  gameState.remainingSeconds = remainingTime;
  clearInterval(timerInterval);
  startTimerWithoutBroadcast();
});

connection.on("ReceiveTimerStart", (initialTime) => {
    gameState.remainingSeconds = initialTime;
    clearInterval(timerInterval);
    startTimerWithoutBroadcast();
});

  // -------------------------------------------------------------------------
  // 5. SIGNALR CLIENT -> SERVER INVOCATIONS (Server-Side Calls)
  //    Functions that broadcast data or invoke server methods
  // -------------------------------------------------------------------------
  function broadcastGameState() {
    const gameStateWithoutTimer = { ...gameState };
    delete gameStateWithoutTimer.remainingSeconds;
    connection.invoke("BroadcastGameState", gameStateWithoutTimer)
        .catch(err => console.error("Error broadcasting game state:", err));
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

  function broadcastTimerSync(remainingTime) {
    connection.invoke("BroadcastTimerSync", remainingTime)
        .catch(err => console.error("Error broadcasting timer sync:", err));
}

function broadcastTimerStart(initialTime) {
    connection.invoke("BroadcastTimerStart", initialTime)
        .catch(err => console.error("Error broadcasting timer start:", err));
}

  // -------------------------------------------------------------------------
  // 6. UI & RENDERING LOGIC (Client-Side)
  // -------------------------------------------------------------------------

  function updateUI() {
    console.log("updateUI called, wordList length:", gameState.wordList.length, "previous length:", previousWordListLength);
    console.log("Current gameState:", gameState); // Add this to see the full state

    if (gameState.wordList.length === 1 && previousWordListLength === 0) {
        console.log("Broadcasting game start");
        connection.invoke("BroadcastGameStart")
            .catch(err => console.error("Error broadcasting game start:", err));
    }

    if (gameState.wordList.length === 1) {
        updateTimer();
        setTimeout(() => {
            renderWordBoxes();
            highlightCurrentPlayer();
            // Debug log
            console.log("Player cards before score update:", document.querySelectorAll(".grid-child-players .card").length);
            console.log("Current scores:", gameState.scores);
            if (document.querySelectorAll(".grid-child-players .card").length > 0) {
                updateScore();
            }
        }, 2800);
    } else if (gameState.wordList.length > previousWordListLength) {
        setTimeout(() => {
            renderWordBoxes();
            highlightCurrentPlayer();
            // Debug log
            console.log("Player cards before score update:", document.querySelectorAll(".grid-child-players .card").length);
            console.log("Current scores:", gameState.scores);
            if (document.querySelectorAll(".grid-child-players .card").length > 0) {
                updateScore();
            }
            updateTimer();
        }, 1500);
    } else {
        renderWordBoxes();
        highlightCurrentPlayer();
        // Debug log
        console.log("Player cards before score update:", document.querySelectorAll(".grid-child-players .card").length);
        console.log("Current scores:", gameState.scores);
        if (document.querySelectorAll(".grid-child-players .card").length > 0) {
            updateScore();
        }
        updateTimer();
    }

    previousWordListLength = gameState.wordList.length;
}

connection.on("ReceiveGameStart", () => {
    console.log("Game start received");
    startGameCountdown();
});

  function renderWordBoxes() {
    const gameContainer = document.querySelector(".grid-child-game");
    gameContainer.innerHTML = "";

    gameState.wordList.forEach((_, index) => {
      const existingWordBox = createWordBox("", true, index);
      gameContainer.appendChild(existingWordBox);
    });

    const newWordBox = createWordBox("", false, gameState.wordList.length);
    gameContainer.appendChild(newWordBox);

    setTimeout(() => {
      const firstInput = gameContainer.querySelector(
        ".wordInput:not([disabled])",
      );
      if (firstInput) {
        firstInput.focus();
        const length = firstInput.value.length;
        firstInput.setSelectionRange(length, length);
      }
    },50);
  }

  function createWordBox(word = "", isExisting = false, index) {
    const box = document.createElement("div");
    box.classList.add("wordCard");
    box.innerHTML = `
            <input class="wordInput" id="gameInput" type="text" 
                   placeholder="${isExisting ? "Re-enter word..." : "Enter new word..."}" 
                   data-index="${index}"
                   maxlength="20"
                   autocomplete="off"
                   spellcheck="false"
                   onpaste="return false">
                  <div id="notification" class="notification hidden">
                    <span id="notificationMessage"></span>
                  </div>
        `;
    const input = box.querySelector(".wordInput");
    updateInputSize(input);

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        return false;
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleWordSubmission(input, index);
      }
    });

    input.addEventListener("input", (e) => {
      if (e.target.value.length > 20) {
          e.target.value = e.target.value.slice(0, 20);
          showNotification("Maximum word length is 20 characters");
      }
      
      if (!input.dataset.firstKeystroke) {
          input.dataset.firstKeystroke = Date.now();
      }
      updateInputSize(input);
      broadcastUserInput(index, e.target.value);
  });

    input.addEventListener("input", (e) => {
      if (!input.dataset.firstKeystroke) {
          input.dataset.firstKeystroke = Date.now();
      }
      updateInputSize(input);
      broadcastUserInput(index, e.target.value);
  });



    return box;
  }

  const style = document.createElement('style');
style.textContent = `
    .score-popup {
        position: absolute;
        color: #2ecc71;
        font-size: 1.2em;
        font-weight: bold;
        animation: scorePopup 1s ease-out forwards;
        pointer-events: none;
    }

    @keyframes scorePopup {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

  // -------------------------------------------------------------------------
  // 7. WORD SUBMISSION & VALIDATION (Client-Side)
  // -------------------------------------------------------------------------
  function handleWordSubmission(input, index) {
    const enteredWord = input.value.trim().toLowerCase();

    if (index < gameState.wordList.length) {
      if (enteredWord === gameState.wordList[index].toLowerCase()) {
        markWordAsCorrect(input, index);
        focusNextInput(input);
        addTimeToTimer(false);
      } else {
        showIncorrectWordAnimation(input, index);
      }
    } else {
      if (isValidNewWord(enteredWord)) {
        submitNewWord(enteredWord, input, index);
        if (gameState.wordList.length > 1) {
          restartClock();
        }
      } else {
        showInvalidWordAnimation(input, index);
      }
    }
  }

  function isValidNewWord(word) {
    return (
      word &&
      checkWordStart(word) &&
      !isWordDuplicate(word) &&
      isAlphabetic(word)
    );
  }

  // NOTIFICATIONS //////////////bi

  function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notificationMessage");
    notificationMessage.textContent = message;
    notification.classList.remove("hidden", "fadeOut");

    notification.classList.add("fadeIn");

    setTimeout(() => {
      notification.classList.add("fadeOut");
      setTimeout(() => {
        notification.classList.add("hidden");
      }, 1000);
    }, 2000);
  }

  function checkWordStart(word) {
    if (!gameState.lastWord) return true;
    if (
      word.charAt(0).toLowerCase() !==
      gameState.lastWord.slice(-1).toLowerCase()
    ) {
      showNotification(
        "The word must start with the last letter of the previous word.",
      );
      return false;
    }
    return true;
  }

  function isWordDuplicate(word) {
    if (gameState.wordList.includes(word)) {
      showNotification("This word has already been used.");
      return true;
    }
    return false;
  }

  function isAlphabetic(word) {
    if (
      /[^a-zA-Z\u00E0-\u00FC\u00C0-\u00DC\u00D8-\u00F6\u00F8-\u02AF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/.test(
        word,
      )
    ) {
      showNotification("Please enter only alphabetic characters.");
      return false;
    }
    return true;
  }

  function submitNewWord(word, input, index) {
    const basePoints = calculateWordScore(word, input);
    
    // Update score for current player
    const currentPlayer = gameState.currentPlayerIndex % document.querySelectorAll(".grid-child-players .card").length;
    gameState.scores[currentPlayer] = (gameState.scores[currentPlayer] || 0) + basePoints;
    
    gameState.wordList.push(word);
    gameState.lastWord = word;
    gameState.currentPlayerIndex++;
    saveWord(word);
    markWordAsCorrect(input, index);
    
    const bonusTime = gameState.correctWordBonus;
    gameState.remainingSeconds += bonusTime;
    broadcastTimerSync(gameState.remainingSeconds);
    
    if (index === gameState.wordList.length - 1) {
        setTimeout(() => {
            updateUI();
            broadcastGameState();
        }, 900);
    } else {
        updateUI();
        broadcastGameState();
    }

    if (gameState.wordList.length === 1) {
        startGameCountdown();
    }
}

  function markWordAsCorrect(input, index) {
    correctSound.play();
    input.disabled = true;
    input.classList.add("correct", "startAnimation");
    broadcastAnimation(index, "startAnimation");
  }

  // -------------------------------------------------------------------------
  // SCORING SYSTEM
  // -------------------------------------------------------------------------
  
  function calculateWordScore(word, input) {
    // Base points based on word length (longer words = more points)
    const lengthPoints = word.length * 100;
    
    // Speed bonus calculation
    const typingSpeed = calculateTypingSpeed(input);
    const speedMultiplier = Math.max(1, typingSpeed / 2);
    
    const timeRemainingMultiplier = 1 + (gameState.remainingSeconds / 60);
    
    const difficultyMultiplier = getDifficultyMultiplier();
    
    const finalScore = Math.round(
        lengthPoints * 
        speedMultiplier * 
        timeRemainingMultiplier * 
        difficultyMultiplier
    );

    showScoreAnimation(finalScore, input);
    
    return finalScore;
}

function calculateTypingSpeed(input) {
    const timeElapsed = (Date.now() - input.dataset.firstKeystroke) / 1000;
    const wordsPerMinute = (input.value.length / 5) / (timeElapsed / 60);
    return Math.min(wordsPerMinute / 30, 2);
}

function getDifficultyMultiplier() {
    const difficulty = localStorage.getItem("gameDifficulty") || "medium";
    const multipliers = {
        easy: 1,
        medium: 1.5,
        hard: 2,
        extreme: 3
    };
    return multipliers[difficulty];
}

function showScoreAnimation(score, input) {
    const scorePopup = document.createElement('div');
    scorePopup.classList.add('score-popup');
    scorePopup.textContent = `+${score}`;
    input.parentElement.appendChild(scorePopup);
    
    setTimeout(() => {
        scorePopup.remove();
    }, 1000);
}

function updateScore() {
  console.log("updateScore called");
  const players = document.querySelectorAll(".grid-child-players .card");
  console.log("Number of players found:", players.length);
  players.forEach((player, index) => {
      const counter = player.querySelector(".counter");
      console.log(`Player ${index} counter:`, counter);
      if (counter) {
          const score = gameState.scores[index] || 0;
          console.log(`Setting score for player ${index}:`, score);
          counter.textContent = `Score: ${score}`;
      }
  });
}

  // -------------------------------------------------------------------------
  // 8. ANIMATION & VISUAL FEEDBACK (Client-Side)
  // -------------------------------------------------------------------------
  class SoundPlayer {
    constructor(src, volume = 0.3, maxInstances = 3) {
        this.src = src;
        this.volume = volume;
        this.maxInstances = maxInstances;
        this.instances = [];
        this.currentIndex = 0;
        
        for (let i = 0; i < maxInstances; i++) {
            const audio = new Audio(src);
            audio.volume = volume;
            this.instances.push(audio);
        }
    }

    play() {
        const audio = this.instances[this.currentIndex];
        
        audio.currentTime = 0;
        audio.play();
        
        this.currentIndex = (this.currentIndex + 1) % this.maxInstances;
    }
}

  const errorSound = new SoundPlayer('soundEffects/wrong.mp3', 0.08, 3);
  const correctSound = new SoundPlayer('soundEffects/correct.wav', 0.3, 3);

  function showIncorrectWordAnimation(input, index) {
    errorSound.play();
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
    errorSound.play();
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
    if (players.length === 0) return; // Add this guard clause
    players.forEach((player) => player.classList.remove("green-shadow"));
    players[gameState.currentPlayerIndex % players.length].classList.add(
      "green-shadow",
    );
  }

  // function updateScore() {
  //   document.getElementById("counter").textContent =
  //     `Score: ${gameState.score}`;
  // }

  function updateScore() {
    console.log("updateScore called");
    const players = document.querySelectorAll(".grid-child-players .card");
    console.log("Number of players found:", players.length);
    players.forEach((player, index) => {
        const counter = player.querySelector(".counter");
        console.log(`Player ${index} counter:`, counter);
        if (counter) {
            const score = gameState.scores[index] || 0;
            console.log(`Setting score for player ${index}:`, score);
            counter.textContent = `Score: ${score}`;
        }
    });
}

  // -------------------------------------------------------------------------
  // 10. TIMER LOGIC (Client-Side)
  // -------------------------------------------------------------------------

  function updateTimer() {
    if (isInCountdown) {
        return;
    }

    const timerElement = document.getElementById("timer");
    let timerSpan = timerElement.querySelector('span');
    
    // Create span if it doesn't exist
    if (!timerSpan) {
        timerSpan = document.createElement('span');
        timerElement.appendChild(timerSpan);
    }

    if (!gameState.wordList.length) {
        timerSpan.textContent = "Please write the first word for the game to start";
        timerElement.style.setProperty('--transform', 'scaleX(1)');
        return;
    }

    if (gameState.remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerSpan.textContent = "Finished";
        timerElement.style.setProperty('--transform', 'scaleX(0)');
        const modal = document.getElementById('gameOverModal');
        modal.style.display = 'flex';
        document.querySelectorAll(".wordInput")
            .forEach((input) => (input.disabled = true));
    } else {
        // Update timer text
        timerSpan.textContent = gameState.remainingSeconds.toFixed(1);
        
        // Calculate progress percentage
        const initialTime = getDifficultySettings().initialTime;
        const progress = (gameState.remainingSeconds / initialTime);
        
        // Update progress bar by directly setting the transform style
        timerElement.style.setProperty('--transform', `scaleX(${progress})`);
        
        // Update colors based on remaining time
        timerElement.classList.remove('warning', 'danger');
        if (gameState.remainingSeconds <= 5) {
            timerElement.classList.add('danger');
        } else if (gameState.remainingSeconds <= 8) {
            timerElement.classList.add('warning');
        }
    }
}

function getDifficultySettings() {
  const difficulty = localStorage.getItem("gameDifficulty") || "medium";
  const difficultySettings = {
      easy: { initialTime: 60 },
      medium: { initialTime: 30 },
      hard: { initialTime: 15 },
      extreme: { initialTime: 10 }
  };
  return difficultySettings[difficulty];
}

  document.getElementById("timer").textContent =
    "Please write the first word for the game to start";

    let isInCountdown = false;

    function startGameCountdown() {
        const timerElement = document.getElementById("timer");
        let countdown = 3;
        
        // Clear any existing intervals and set countdown flag
        clearInterval(timerInterval);
        isInCountdown = true;
    
        function updateCountdown() {
            if (countdown > 0) {
                timerElement.textContent = countdown.toString();
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                timerElement.textContent = "Go!";
                setTimeout(() => {
                    isInCountdown = false;  // Reset countdown flag
                    initializeGameSettings();
                    startTimer();
                    timerElement.textContent = gameState.remainingSeconds.toFixed(1);
                }, 1000);
            }
        }
    
        updateCountdown();
    }

  function startTimer() {
    clearInterval(timerInterval);
    if (!gameState.remainingSeconds) {
        initializeGameSettings();
    }
    broadcastTimerStart(gameState.remainingSeconds);
    startTimerWithoutBroadcast();
}

function startTimerWithoutBroadcast() {
  clearInterval(timerInterval);
  let lastUpdate = Date.now();
  
  timerInterval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastUpdate) / 1000;
      lastUpdate = now;
      
      const previousSeconds = Math.floor(gameState.remainingSeconds);
      gameState.remainingSeconds = Math.max(0, gameState.remainingSeconds - delta);
      const currentSeconds = Math.floor(gameState.remainingSeconds);
      
      updateTimer();
      
      // Only broadcast when the whole second changes
      if (previousSeconds !== currentSeconds) {
          broadcastTimerSync(gameState.remainingSeconds);
      }
      
      if (gameState.remainingSeconds <= 0) {
          clearInterval(timerInterval);
          gameState.remainingSeconds = 0;
          broadcastTimerSync(0);
          updateTimer();
      }
  }, 50); // Update every 50ms for smooth animation
}

function restartClock() {
  initializeGameSettings();
  clearInterval(timerInterval);
  startTimer();
  broadcastGameState();
}

function addTimeToTimer(isRewrite) {
  const bonusTime = isRewrite ? gameState.rewriteWordBonus : gameState.correctWordBonus;
  gameState.remainingSeconds += bonusTime; // Directly update the gameState
  broadcastTimerSync(gameState.remainingSeconds);
  updateTimer(); // Immediately update the UI
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
  //startGameCountdown();
  setTimeout(() => {
    highlightCurrentPlayer();

  }, 100);
  updateUI();


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

