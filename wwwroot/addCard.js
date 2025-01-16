document.addEventListener("DOMContentLoaded", () => {

//#region Carlo
  const cardHolder = document.querySelector('.cardHolder');

  function addPlayerCard(username, playerIndex) {
    if (Array.from(cardHolder.children).some(card => card.querySelector('h4').textContent === username)) {
      console.warn(`Player "${username}" already exists.`);
      return;
    }

    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
          <img src="photos/img_avatar2.png" alt="Avatar" style="width:100%">
          <div class="container">
              <h4 id="player${playerIndex}"><b>${username}</b></h4>
          </div>
      `;
    cardHolder.appendChild(card);
  }

  function populatePlayers() {
    const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;

    if (playerCount < 2) {
      console.warn("You need at least 2 players to start!");
      return;
    }
    if (playerCount > 1000) {
      console.warn("Maximum 8 players allowed in a lobby!");
      return;
    }

    for (let i = 0; i < playerCount; i++) {
      const storedUsername = localStorage.getItem(`username${i}`);
      if (storedUsername) {
        addPlayerCard(storedUsername);
      } else {
        console.error(`No username found for username${i} in localStorage`);
      }
    }
  }
  populatePlayers();
//#endregion
});
