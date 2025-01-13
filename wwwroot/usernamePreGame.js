//export const playerlistEx = [];

document.addEventListener("DOMContentLoaded", () => {
  const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;

  const playerlist = [];
  for (let i = 0; i < playerCount; i++) {
      const username = localStorage.getItem(`username${i}`);
      if (!username) {
          console.warn(`No username found for player index ${i}`);
          continue;
      }

      const playerElement = document.getElementById(`username${i}`);
      playerlist.push(username);
  }
  console.log(playerlist);
});