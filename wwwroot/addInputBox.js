document.addEventListener("DOMContentLoaded", () => {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/gameHub")
        .withAutomaticReconnect()
        .build();

    let gameState = {
        wordList: [],
        currentPlayerIndex: 0,
        remainingSeconds: 1000,
        lastWord: '',
        score: 0
    };

    let timerInterval;

    connection.start().then(() => {
        console.log("Connected to SignalR hub.");
    }).catch(err => console.error("SignalR Connection Error:", err));

    connection.on("ReceiveGameState", (newState) => {
        gameState = { ...newState };
        updateUI();
    });

    connection.on("ReceiveUserInput", (playerIndex, input) => {
        const inputs = document.querySelectorAll('.wordInput');
        if (inputs[playerIndex]) {
            inputs[playerIndex].value = input;
            updateInputSize(inputs[playerIndex]);
        }
    });

    connection.on("ReceiveAnimation", (index, animationType) => {
        const inputs = document.querySelectorAll('.wordInput');
        if (inputs[index]) {
            inputs[index].classList.add(animationType);
            //setTimeout(() => inputs[index].classList.remove(animationType), 9999);
        }
    });

    function broadcastGameState() {
        connection.invoke("BroadcastGameState", gameState)
            .catch(err => console.error("Error broadcasting game state:", err));
    }

    function broadcastUserInput(input) {
        connection.invoke("BroadcastUserInput", gameState.currentPlayerIndex, input)
            .catch(err => console.error("Error broadcasting user input:", err));
    }

    function broadcastAnimation(index, animationType) {
        connection.invoke("BroadcastAnimation", index, animationType)
            .catch(err => console.error("Error broadcasting animation:", err));
    }

    function updateUI() {
        renderWordBoxes();
        highlightCurrentPlayer();
        updateScore();
        updateTimer();
    }

    function renderWordBoxes() {
        const gameContainer = document.querySelector('.grid-child-game');
        gameContainer.innerHTML = '';

        gameState.wordList.forEach((word, index) => {
            const wordBox = createWordBox(word, true, index);
            gameContainer.appendChild(wordBox);
        });

        const newWordBox = createWordBox('', false, gameState.wordList.length);
        gameContainer.appendChild(newWordBox);

        const firstEmptyInput = gameContainer.querySelector('.wordInput:not(:disabled)');
        if (firstEmptyInput) firstEmptyInput.focus();
    }

    function createWordBox(word, isPrefilled, index) {
        const box = document.createElement('div');
        box.classList.add('wordCard');
        box.innerHTML = `
            <input class="wordInput" id="gameInput" type="text" placeholder="${isPrefilled ? 'Re-enter word...' : 'Enter new word...'}" ${isPrefilled ? `value="${word}" data-correct="${word}"` : ''}>
            <p class="doubleWarning" style="display: none;">Word already used</p>
        `;

        const input = box.querySelector('.wordInput');
        updateInputSize(input);

        input.addEventListener('input', (e) => {
            updateInputSize(input);
            broadcastUserInput(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleWordSubmission(input, index);
            }
        });

        return box;
    }

    function handleWordSubmission(input, index) {
        const enteredWord = input.value.trim().toLowerCase();
        const isNewWord = !input.dataset.correct;

        if (isNewWord) {
            if (isValidNewWord(enteredWord)) {
                submitNewWord(enteredWord, input, index);
            } else {
                showInvalidWordAnimation(input, index);
            }
        } else {
            const correctWord = input.dataset.correct.toLowerCase();
            if (enteredWord === correctWord) {
                markWordAsCorrect(input, index);
            } else {
                showIncorrectWordAnimation(input, index);
            }
        }
    }

    function isValidNewWord(word) {
        return word && checkWordStart(word) && !isWordDuplicate(word);
    }

    function checkWordStart(word) {
        return !gameState.lastWord || word.charAt(0).toLowerCase() === gameState.lastWord.slice(-1).toLowerCase();
    }

    function isWordDuplicate(word) {
        return gameState.wordList.includes(word);
    }

    function submitNewWord(word, input, index) {
        gameState.wordList.push(word);
        //gameState.lastWord = word;
        gameState.currentPlayerIndex++;
        gameState.score++;
        saveWord(word);
        input.disabled = true;
        broadcastGameState();
        showCorrectAnimation(input, index);
    }

    function markWordAsCorrect(input, index) {
        input.disabled = true;
        gameState.score++;
        input.classList.add('startAnimation');
        showCorrectAnimation(input, index);
        broadcastGameState();
        broadcastAnimation(index, 'startAnimation');
    }

    function showCorrectAnimation(input, index) {
        input.classList.add('startAnimation');
        input.disabled = true;
        broadcastAnimation(index, 'startAnimation');
        
        //input.classList.remove('startAnimation');
    }

    function showInvalidWordAnimation(input, index) {
        input.classList.add('shake');
        broadcastAnimation(index, 'shake');
        setTimeout(() => {
            input.classList.remove('shake');
            input.value = '';
            updateInputSize(input);
        }, 500);
    }

    function showIncorrectWordAnimation(input, index) {
        input.classList.add('shake');
        broadcastAnimation(index, 'shake');
        setTimeout(() => {
            input.value = '';
            updateInputSize(input);
        }, 0);
    }

    function updateInputSize(input) {
        const maxChars = 20;
        input.size = Math.min(Math.max(input.value.length, input.placeholder.length, 1), maxChars);
    }

    function highlightCurrentPlayer() {
        const players = document.querySelectorAll('.grid-child-players .card');
        players.forEach(player => player.classList.remove('green-shadow'));
        players[gameState.currentPlayerIndex % players.length].classList.add('green-shadow');
    }

    function updateScore() {
        document.getElementById("counter").textContent = `Score: ${gameState.score}`;
    }

    function updateTimer() {
        if (gameState.remainingSeconds <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer').textContent = "Finished";
            document.querySelectorAll('.wordInput').forEach(input => input.disabled = true);
        } else {
            document.getElementById('timer').textContent = gameState.remainingSeconds.toFixed(1);
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            gameState.remainingSeconds -= 0.1;
            if (gameState.remainingSeconds <= 0) {
                clearInterval(timerInterval);
            }
            updateTimer();
        }, 100);
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

    updateUI();
    startTimer();
});
