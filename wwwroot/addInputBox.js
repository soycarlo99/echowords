document.addEventListener("DOMContentLoaded", () => {
    const card = document.createElement('div');
    const cardContainer = document.querySelector('.grid-container');
    function addWordBox() {
        
        card.classList.add("grid-child-game");
        card.innerHTML = `<div>
<h2>It's your turn!</h2>
<input type="text" id="gameInput" placeholder="Enter word...">
<button id="timerButton" onload="restartClock()">TEST</button>
<p id="timer">10</p>
          </div>  
      `;
        cardContainer.appendChild(card);
    }
})