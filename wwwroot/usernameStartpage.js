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
  
      localStorage.setItem(`username${playerCount}`, username);
      playerCount++;
      localStorage.setItem('playerCount', playerCount);
  
      //alert(`Username "${username}" has been saved!`);
      errorMessage.style.display = "none";
  
      window.location.href = "preGame.html";
    });
  });