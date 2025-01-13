document.addEventListener("DOMContentLoaded", () => {
    const addWordCard = document.getElementById('timerButton');
    const firstWordCard = document.getElementById('gameInput');
    const maxChars = 20;

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
                console.log(`User entered: ${event.target.value}`);
                addWordBox();

                inputField.classList.add('startAnimation');
            }
        });
    }

    function enterHandeler() {
        firstWordCard.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                console.log(`User entered: ${event.target.value}`);
                addWordBox();


                firstWordCard.classList.add('startAnimation');
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