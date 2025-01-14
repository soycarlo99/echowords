document.addEventListener("DOMContentLoaded", () => {
    const addWordCard = document.getElementById('timerButton');
    const firstWordCard = document.getElementById('gameInput');
    const maxChars = 20;
    let lastWord = ''; //Fösta ordet

    function checkWord(word) {
        if (!word) return false;

        // första ordet ska godkännas auto
        if (!lastWord) {
            lastWord = word;
            return true;
        }

        // Kontrollera om första bokstaven matchar sista bokstaven i förra ordet
        const lastLetterOfPrevious = lastWord.slice(-1).toLowerCase();
        const firstLetterOfNew = word.charAt(0).toLowerCase();

        if (lastLetterOfPrevious === firstLetterOfNew) {
            lastWord = word;
            return true;
        }

        return false;
    }

    function addWordBox() {
        const cardContainer = document.querySelector('.grid-child-game');
        const card = document.createElement('div');
        card.innerHTML = `
        <div class="wordCard">
            <input id="gameInput" class="gameInput wordInput" type="text" placeholder="Enter word...">
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
                const word = event.target.value.trim();

                if (checkWord(word)) {
                    console.log(`User entered: ${word}`);
                    addWordBox();
                    inputField.classList.add('startAnimation');
                } else {
                    inputField.focus();
                    inputField.value = '';
                    updateSize(inputField);
                }
            }
        });
    }

    function enterHandeler() {
        firstWordCard.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const word = event.target.value.trim();

                if (checkWord(word)) {
                    console.log(`User entered: ${word}`);
                    addWordBox();
                    firstWordCard.classList.add('startAnimation');
                } else {
                    inputField.focus();
                }
            }
        });

        firstWordCard.addEventListener('input', () => updateSize(firstWordCard));
        updateSize(firstWordCard);
    }

    function updateSize(inputField) {
        let desiredSize = Math.max(inputField.value.length, inputField.placeholder.length, 1);
        desiredSize = Math.min(desiredSize, maxChars);
        inputField.size = desiredSize;
    }

    addWordCard.addEventListener("click", function (e) {
        e.preventDefault();
        addWordBox();
    });

    enterHandeler();
});