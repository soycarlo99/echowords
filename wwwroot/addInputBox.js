document.addEventListener("DOMContentLoaded", () => {
    const addWordCard = document.getElementById('timerButton');
    const firstWordCard = document.getElementById('gameInput');
    
    const maxChars = 20;
    let lastWord = '';

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

    //Saves list of words
    const wordList = [];

    function addWordBox() {
        const cardContainer = document.querySelector('.grid-child-game');
        const card = document.createElement('div');
        
        card.innerHTML = `
        <div class="wordCard">
            <input id="gameInput" class="wordInput" type="text" onkeydown="enterHandeler()" placeholder="Enter word...">
            <p class="doubleWarning">the word already been taken</p>
        </div>
        `;
        cardContainer.appendChild(card);

        const inputField = card.querySelector('.wordInput');

        inputField.addEventListener('input', () => updateSize(inputField));
        updateSize(inputField);

        inputField.focus();
        restartClock();

        inputField.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const word = event.target.value.trim().toLowerCase();
                $('#gameInput').on(saveWord)

                if (checkWord(word) && doubleAvoider(word)) {
                    console.log(`User entered: ${word}`);
                    wordList.push(`${word}`);
                    addWordBox();
                    saveWord();
                    inputField.classList.add('startAnimation');
                    inputField.disabled = true;
                    
                } else {
                    inputField.focus();
                    inputField.value = '';
                    updateSize(inputField);
                }
                console.log(wordList);
            }

 
        });


    }
    console.log(wordList);



    function enterHandeler() {
        firstWordCard.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const word = event.target.value.trim();
                firstWordCard.disabled = true;


                if (checkWord(word) && doubleAvoider(word)) {
                    addWordBox();
                    saveWord();
                    firstWordCard.classList.add('startAnimation');
                    wordList.push(`${word}`);
                    console.log(wordList);

                } else {
                    inputField.focus();

                }
            }
        });

        firstWordCard.addEventListener('input', () => updateSize(firstWordCard));
        updateSize(firstWordCard);
    }

    enterHandeler();

    function updateSize(inputField) {
        let desiredSize = Math.max(inputField.value.length, inputField.placeholder.length, 1);
        desiredSize = Math.min(desiredSize, maxChars);
        inputField.size = desiredSize;
    }

    addWordCard.addEventListener("click", function (e) {
        e.preventDefault();
        addWordBox();
    });


    function doubleAvoider(word){
        if(wordList.includes(`${word}`)){
            console.log(`The word ${word} already has been written`);
            return false;
        } else {
            return true;
        }
    }


    $('#gameInput').on('Enter', saveWord)

    async function saveWord(e) {
    const newWord = $('[class="wordInput"]').val();
    console.log('newWord', newWord);
    const response = await fetch('/new-word/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word: newWord })
    
    });

    console.log('response', response);
    const data = await response.json();
    console.log('data', data);
    $('#message').text(newWord + ' lades till i databasen')
    }
});

