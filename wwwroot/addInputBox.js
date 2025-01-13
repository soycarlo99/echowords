document.addEventListener("DOMContentLoaded", () => {
    const addWordCard = document.getElementById('timerButton');
    const firstWordCard = document.getElementById('gameInput');

    function addWordBox() {
        const cardContainer = document.querySelector('.grid-child-game');
        const card = document.createElement('div');
        card.innerHTML = `
        <div>
            <input class="wordInput" type="text" id="gameInput" placeholder="Enter word...">
            <p class="timer">10</p>
        </div>
      `;
        cardContainer.appendChild(card);

        const inputField = card.querySelector('.wordInput');

        inputField.focus();
        restartClock();

        inputField.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                console.log(`User entered: ${event.target.value}`);

                addWordBox();
            }
        });
    }
    //this handels the first card
    function enterHandeler(event){
        firstWordCard.addEventListener('keydown', (event) =>{
            if (event.key === 'Enter') {
                event.preventDefault();
                console.log(`User entered: ${event.target.value}`);
                addWordBox();
            }
        });
    }



    addWordCard.addEventListener("click", function (e) {
        e.preventDefault();
        addWordBox();
    });

    enterHandeler();
});