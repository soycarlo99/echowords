document.addEventListener("DOMContentLoaded", () => {
    const addWordCard = document.getElementById('timerButton');
    const ararary = [];
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            console.log(`User entered: ${event.target.value}`);
            ararary.push(`${event.target.value}`.toLowerCase());
            addWordBox();
            console.log(ararary)
        }
    });
    
    
    function addWordBox() {
        const cardContainer = document.querySelector('.grid-child-game');
        const card = document.createElement('div');
        card.innerHTML = `
        <div>
            <input class="wordInput" type="text" id="gameInput" placeholder="Enter word...">
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
                inputField.disabled = true;
                console.log(ararary)
            }
        });
    }

    addWordCard.addEventListener("click", function (e) {
        e.preventDefault();
        addWordBox();
    });
});