document.addEventListener("DOMContentLoaded", () => {
    const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
  
    for (let i = 0; i < playerCount; i++) {
      const username = localStorage.getItem(`username${i}`);
      const playerElement = document.getElementById(`player${i}`);
  
      if (playerElement) {
        playerElement.textContent = username;
      } else {
        console.error(`Element with ID player${i} not found`);
      }
    }
  });