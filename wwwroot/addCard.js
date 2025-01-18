document.addEventListener("DOMContentLoaded", () => {
  // Lobby Section
  const cardHolderLobby = document.querySelector('.cardHolder');
  if(cardHolderLobby) {
    function addPlayerCardLobby(username, playerIndex) {
      if (Array.from(cardHolderLobby.children).some(card => card.querySelector('h4').textContent === username)) {
        console.warn(`Player "${username}" already exists.`);
        return;
      }
      
      const storedSeed = localStorage.getItem(`avatar_${username}`) || username;
      const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" style="width:100%">
        <div class="container">
            <h4 id="player${playerIndex}"><b>${username}</b></h4>
            <button class="randomizeBtn">Randomize</button>
        </div>
      `;
      cardHolderLobby.appendChild(card);
      
      const randomizeBtn = card.querySelector('.randomizeBtn');
      randomizeBtn.addEventListener('click', () => {
        const randomSeed = Math.random().toString(36).substring(2, 12);
        const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
        const img = card.querySelector('img[alt="Avatar"]');
        if(img) {
          img.src = newAvatarUrl;
          localStorage.setItem(`avatar_${username}`, randomSeed);
        }
      });
    }
  
    function populatePlayersLobby() {
      const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
      for (let i = 0; i < playerCount; i++) {
        const username = localStorage.getItem(`username${i}`);
        if (username) {
          addPlayerCardLobby(username, i);
        } else {
          console.error(`No username found for username${i} in localStorage.`);
        }
      }
    }
  
    populatePlayersLobby();
  }

  // Game Section
  const gridChildPlayers = document.querySelector('.grid-child-players');
  if(gridChildPlayers) {
    function addPlayerCardGame(username, playerIndex) {
      if (Array.from(gridChildPlayers.children).some(card => card.querySelector('h4').textContent === username)) {
        console.warn(`Player "${username}" already exists.`);
        return;
      }
      
      const storedSeed = localStorage.getItem(`avatar_${username}`) || username;
      const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(storedSeed)}`;
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" style="width:100%">
        <div class="container">
            <h4 id="player${playerIndex}"><b>${username}</b></h4>
            <p id="counter">Score: 0</p>
        </div>
      `;
      gridChildPlayers.appendChild(card);
    }
  
    function populatePlayersGame() {
      const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
      if(playerCount < 1) {
        console.warn("You need at least 1 players to start!");
        return;
      }
      if(playerCount > 8) {
        console.warn("Maximum 8 players allowed in a lobby!");
        return;
      }
  
      for (let i = 0; i < playerCount; i++) {
        const storedUsername = localStorage.getItem(`username${i}`);
        if (storedUsername) {
          addPlayerCardGame(storedUsername, i);
        } else {
          console.error(`No username found for username${i} in localStorage`);
        }
      }
    }
    populatePlayersGame();
  }

  // Randomize Avatars Button Logic
  const randomizeBtn = document.getElementById('randomizeAvatars');
  if(randomizeBtn) {
    randomizeBtn.addEventListener('click', () => {
      const avatarImages = document.querySelectorAll('.card img[alt="Avatar"]');
      avatarImages.forEach(img => {
        const randomSeed = Math.random().toString(36).substring(2, 12);
        const newAvatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(randomSeed)}`;
        img.src = newAvatarUrl;
      });
    });
  }
});