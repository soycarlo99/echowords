document.addEventListener("DOMContentLoaded", () => {
    //const addbutton = document.getElementById("addcard");
    const addbutton = document.getElementById("acceptButton");
  
    function addPlayerCard(username) {
      const cardHolder = document.querySelector('.cardHolder');
      if (Array.from(cardHolder.children).some(card => card.textContent.includes(username))) {
        console.warn(`${username} already exists`);
        return;
      }
      const card = document.createElement('div');
      card.classList.add("card");
      card.innerHTML = `
        <img src="photos/img_avatar2.png" alt="Avatar" style="width:100%">
        <div class="container">
          <h4><b>${username}</b></h4>
        </div>
      `;
      cardHolder.appendChild(card);
    }

    addbutton.addEventListener("click", function() {
        const playerCount = parseInt(localStorage.getItem('playerCount')) || 0;
        for (let i = 0; i < playerCount; i++) {
          const storedUsername = localStorage.getItem(`username${i}`);
          if (storedUsername) {
            addPlayerCard(storedUsername);
          } else {
            console.error(`No username found for username${i} in localStorage`);
          }
        }
      });
  });