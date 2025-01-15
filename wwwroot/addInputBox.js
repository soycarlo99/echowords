document.addEventListener("DOMContentLoaded", () => {
    const maxChars = 20;
    let lastWord = '';
    const wordList = [];

    function checkWord(word) {
        if (!word) return false;
        if (!lastWord) {
            lastWord = word;
            return true;
        }
        const lastLetterOfPrevious = lastWord.slice(-1).toLowerCase();
        const firstLetterOfNew = word.charAt(0).toLowerCase();
        if (lastLetterOfPrevious === firstLetterOfNew) {
            lastWord = word;
            return true;
        }
        return false;
    }

    function updateSize(inputField) {
        let desiredSize = Math.max(inputField.value.length, inputField.placeholder.length, 1);
        desiredSize = Math.min(desiredSize, maxChars);
        inputField.size = desiredSize;
    }

    function doubleAvoider(word) {
        if(wordList.includes(word)){
            console.log(`The word ${word} already has been written`);
            return false;
        }
        return true;
    }

    async function saveWord(word) {
        console.log('Saving word:', word);
        try {
            const response = await fetch('/new-word/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word })
            });
            const data = await response.json();
            console.log('Response data:', data);
        } catch (error) {
            console.error('Error saving word:', error);
        }
    }

    function restartClock(){
        if (c){
            clearInterval(c)
        }
        document.getElementById('timer').innerHTML="10"
        c = setInterval(showClock,1000)
        function showClock(){
            var seconds = document.getElementById('timer').textContent;
            seconds--;
            document.getElementById('timer').innerHTML=seconds;
            if(seconds==0)
            {
                clearInterval(c);
                document.getElementById('timer').innerHTML = "Finished";
                // Vi kanske kan ha mer grejer här
            }
        }
    }

    function addWordBox(preFilledWords = []) {
        const cardContainer = document.querySelector('.grid-child-game');
        cardContainer.innerHTML = '';

        preFilledWords.forEach(word => {
            const card = document.createElement('div');
            card.classList.add('wordCard');
            card.innerHTML = `
                <input id="gameInput" class="wordInput" type="text" placeholder="Re-enter word..." data-correct="${word}">
                <p class="doubleWarning">The word already been taken</p>
            `;
            cardContainer.appendChild(card);
            const inputField = card.querySelector('.wordInput');
            inputField.addEventListener('input', () => updateSize(inputField));
            updateSize(inputField);
        });

        const newCard = document.createElement('div');
        newCard.classList.add('wordCard');
        // Spelet börjar här!
        if(preFilledWords.length === 0) {
            newCard.classList.add('shake');
        }
        newCard.innerHTML = `
            <input id="gameInput" class="wordInput" type="text" placeholder="Enter new word...">
            <p class="doubleWarning">The word already been taken</p>
        `;
        cardContainer.appendChild(newCard);
        const newInput = newCard.querySelector('.wordInput');
        newInput.addEventListener('input', () => updateSize(newInput));
        updateSize(newInput);

        const firstInput = cardContainer.querySelector('.wordInput');
        if (firstInput) {
            firstInput.focus();
        }

        const recallInputs = cardContainer.querySelectorAll('input[data-correct]');
        recallInputs.forEach((input) => {
            input.addEventListener('keydown', (e) => {
                if(e.key==='Enter') {
                    e.preventDefault();
                    const entered = input.value.trim().toLowerCase();
                    const correct = input.dataset.correct.toLowerCase();
                    if(entered !== correct) {
                        input.style.backgroundColor = 'red';
                        input.style.animation = 'shake 0.1s';
                        
                    } else {
                        input.style.backgroundColor = 'green';
                        
                        let next = input.parentElement.nextElementSibling?.querySelector('.wordInput');
                        if(next) {
                            next.focus();
                            input.classList.add('startAnimation');
                        } else {
                            newInput.focus();
                        }
                    }
                }
            });
        });

        restartClock();

        newInput.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const newWord = newInput.value.trim().toLowerCase();
                if (!newWord) return;

                const inputs = document.querySelectorAll('.wordCard input');
                let validRecall = true;
                inputs.forEach((input, index) => {
                    if (index < preFilledWords.length) {
                        const correct = input.dataset.correct;
                        if (input.value.trim().toLowerCase() !== correct.toLowerCase()) {
                            validRecall = false;
                        }
                    }
                });

                if (!validRecall) {
                    console.warn("Please correctly re-enter previous words.");
                    return;
                }

                if (checkWord(newWord) && doubleAvoider(newWord)) {
                    wordList.push(newWord);
                    await saveWord(newWord);
                    addWordBox([...wordList]);
                } else {
                    console.warn("Invalid or duplicate word. Try again.");
                    newInput.value = '';
                    updateSize(newInput);
                    newInput.focus();
                }
            }
        });
    }

    addWordBox();
});