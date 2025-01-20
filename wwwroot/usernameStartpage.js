document.addEventListener("DOMContentLoaded", () => {
  const acceptButton = document.getElementById("acceptButton");
  const playerNameInput = document.getElementById("playerNameInput");
  const errorMessage = document.getElementById("errorMessage");
  
  let playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
  

  acceptButton.addEventListener("click", () => {
    const username = playerNameInput.value.trim();
  
    if (username === "") {
      errorMessage.style.display = "block";
      errorMessage.textContent = "Please enter a username.";
      return;
    }
  
    //localStorage.setItem(`username${playerCount}`, username);
    playerCount++;
    localStorage.setItem('playerCount', playerCount);
  
    errorMessage.style.display = "none";

    addPlayerName().then(() => {
    window.location.href = "joinGame.html";
    });
  });
  
  //#region Carlo 
  async function addPlayerName() {
    const playerName = $('[id="playerNameInput"]').val();
    console.log('PlayerName:', playerName);
    try {
      const response = await fetch('/new-player/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: playerName })
      });
  
      console.log('response', response);
      const data = await response.json();
      console.log('data', data);
      $('#message').text(playerName + ' lades till i databasen');
    } catch (error) {
      console.error('Error adding player:', error);
    }
  }
  //#endregion
});