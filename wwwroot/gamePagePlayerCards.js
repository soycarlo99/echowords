// document.addEventListener("DOMContentLoaded", () => {
//     const cardHolder = document.querySelector('.grid-child-players');
  
//     function addPlayerCard(username, playerIndex) {
//       if (Array.from(cardHolder.children).some(card => card.querySelector('h4').textContent === username)) {
//         console.warn(`Player "${username}" already exists.`);
//         return;
//       }
  
//       // Create a DiceBear avatar URL using the username as seed
//       const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(username)}`;
  
//       const card = document.createElement('div');
//       card.classList.add('card');
//       card.innerHTML = `
//         <img src="${avatarUrl}" alt="Avatar" style="width:100%">
//         <div class="container">
//             <h4 id="player${playerIndex}"><b>${username}</b></h4>
//             <p id="counter">Score: 0</p>
//         </div>
//       `;
//       cardHolder.appendChild(card);
//     }
  
//     function populatePlayers() {
//       const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
  
//       for (let i = 0; i < playerCount; i++) {
//         const username = localStorage.getItem(`username${i}`);
//         if (username) {
//           addPlayerCard(username, i);
//         } else {
//           console.error(`No username found for username${i} in localStorage.`);
//         }
//       }
//     }
  
//     populatePlayers(); 
//   });