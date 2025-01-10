document.addEventListener("DOMContentLoaded", () => {
    const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
    export const playerlist = [];
  
    for (let i = 0; i < playerCount; i++) {
      const username = localStorage.getItem(`username${i}`);
      const playerElement = document.getElementById(`player${i}`);
      playerlist.push(localStorage.getItem(`username${i}`));
      console.log(playerlist);

      if (playerElement) {
        playerElement.textContent = username;
      } else {
        console.error(`Element with ID player${i} not found`);
      }
    }
  });
