document.addEventListener("DOMContentLoaded", () => {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/gameHub")
        .withAutomaticReconnect()
        .build();

    let wordList = [];
    let currentPlayerIndex = 0;
    let remainingSeconds = 10;
    let lastWord = '';
    let score = 0;
    let timerInterval;

    connection.start().then(() => {
        console.log("Connected to SignalR hub.");
    }).catch(err => console.error("SignalR Connection Error:", err));

    connection.on("ReceiveGameState", (gameState) => {
        setTimeout(() => {
            wordList = gameState.wordList;
            currentPlayerIndex = gameState.currentPlayerIndex;
            remainingSeconds = gameState.remainingSeconds;
            lastWord = gameState.lastWord;
            score = gameState.score;
            updateUI(true);
        }, 0); // Delay to allow word memorization
    });

    connection.on("ReceiveUserInput", (playerIndex, input) => {
        const inputs = document.querySelectorAll('.wordInput');
        if (inputs[playerIndex]) {
            inputs[playerIndex].value = input;
            updateSize(inputs[playerIndex]);
        }
    });

    function broadcastGameState() {
        const gameState = { wordList, currentPlayerIndex, remainingSeconds, lastWord, score };
        connection.invoke("BroadcastGameState", gameState)
            .catch(err => console.error("Error broadcasting game state:", err));
    }

    function broadcastUserInput(input) {
        connection.invoke("BroadcastUserInput", currentPlayerIndex, input)
            .catch(err => console.error("Error broadcasting user input:", err));
    }

    function updateUI(preserveCompleted = false) {
        addWordBox([...wordList], preserveCompleted);
        highlightNextPlayer();
        scoreCounter();
        updateTimer();
    }

    function highlightNextPlayer() {
        const players = document.querySelectorAll('.grid-child-players .card');
        players.forEach(player => player.classList.remove('green-shadow'));
        players[currentPlayerIndex % players.length].classList.add('green-shadow');
    }

    function checkWord(word) {
        if (!word) return false;
        if (!lastWord) return true;
        return lastWord.slice(-1).toLowerCase() === word.charAt(0).toLowerCase();
    }

    function scoreCounter() {
        document.getElementById("counter").textContent = `Score: ${score}`;
    }

    function doubleAvoider(word) {
        return !wordList.includes(word);
    }

    async function saveWord(word) {
        try {
            const response = await fetch('/new-word/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word })
            });
            const data = await response.json();
            console.log('Word saved:', data);
        } catch (error) {
            console.error('Error saving word:', error);
        }
    }

    function restartClock() {
        clearInterval(timerInterval);
        remainingSeconds = 10;
        updateTimer();
        timerInterval = setInterval(updateTimer, 100);
    }

    function updateTimer() {
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer').textContent = "Finished";
            document.querySelectorAll('input.wordInput').forEach(input => input.disabled = true);
        } else {
            document.getElementById('timer').textContent = remainingSeconds.toFixed(1);
            remainingSeconds -= 0.1;
        }
    }

    function addTime() {
        remainingSeconds += 1.5;
        updateTimer();
    }

    function addWordBox(preFilledWords = [], preserveCompleted = false) {
        const cardContainer = document.querySelector('.grid-child-game');
        const completedInputs = preserveCompleted ? Array.from(cardContainer.querySelectorAll('.wordInput.completed')) : [];
        cardContainer.innerHTML = '';

        preFilledWords.forEach((word, index) => {
            const card = createWordCard(word, true);
            cardContainer.appendChild(card);
            if (preserveCompleted && completedInputs[index]) {
                const input = card.querySelector('.wordInput');
                input.value = completedInputs[index].value;
                input.disabled = true;
                input.classList.add('completed');
            }
        });

        const newCard = createWordCard();
        cardContainer.appendChild(newCard);

        const firstIncompleteInput = cardContainer.querySelector('.wordInput:not(.completed)');
        if (firstIncompleteInput) firstIncompleteInput.focus();

        restartClock();
    }

    function createWordCard(word = '', isPrefilled = false) {
        const card = document.createElement('div');
        card.classList.add('wordCard');
        if (!isPrefilled && wordList.length === 0) {
            card.classList.add('shake');
        }
        card.innerHTML = `
            <input class="wordInput" id="gameInput" type="text" placeholder="${isPrefilled ? 'Re-enter word...' : 'Enter new word...'}" ${isPrefilled ? `data-correct="${word}"` : ''}>
            <p class="doubleWarning">The word has already been taken</p>
        `;
        const input = card.querySelector('.wordInput');
        input.addEventListener('input', (e) => {
            updateSize(input);
            broadcastUserInput(e.target.value);
        });
        updateSize(input);

        if (isPrefilled) {
            setupPrefilledInput(input);
        } else {
            setupNewInput(input);
        }

        return card;
    }

    function updateSize(input) {
        const maxChars = 20;
        let size = Math.max(input.value.length, input.placeholder.length, 1);
        input.size = Math.min(size, maxChars);
    }

    function setupPrefilledInput(input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const entered = input.value.trim().toLowerCase();
                const correct = input.dataset.correct.toLowerCase();
                if (entered !== correct) {
                    input.style.backgroundColor = 'red';
                    input.classList.add('shake');
                    setTimeout(() => input.classList.remove('shake'), 500);
                } else {
                    input.style.backgroundColor = 'green';
                    input.disabled = true;
                    input.classList.add('startAnimation');
                    score++;
                    addTime();

                    setTimeout(() => {
                        broadcastGameState();
                        setTimeout(() => {
                            const nextCard = input.closest('.wordCard').nextElementSibling;
                            if (nextCard) {
                                const next = nextCard.querySelector('.wordInput');
                                if (next) {
                                    input.classList.add('startAnimation');
                                    next.focus();
                                }
                            }
                        }, 0); // Delay before moving to next word
                    }, 0); // Delay before broadcasting game state
                }
            }
        });
    }

    function setupNewInput(input) {
        input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const newWord = input.value.trim().toLowerCase();
                if (newWord && checkWord(newWord) && doubleAvoider(newWord)) {
                    wordList.push(newWord);
                    lastWord = newWord;
                    await saveWord(newWord);
                    currentPlayerIndex++;
                    score++;
                    addTime();
                    input.disabled = true;
                    input.classList.add('startAnimation');

                    setTimeout(() => {
                        broadcastGameState();
                        setTimeout(() => {
                            updateUI(true);
                        }, 0); // Delay before updating UI
                    }, 0); // Delay before broadcasting game state
                } else {
                    input.value = '';
                    updateSize(input);
                    input.classList.add('shake');
                    setTimeout(() => input.classList.remove('shake'), 500);
                }
            }
        });
    }

    updateUI();
});
