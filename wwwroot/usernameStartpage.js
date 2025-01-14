// Funktion för att läsa cookies i JavaScript
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Hämta ClientId från cookie
const clientId = getCookie('ClientId');
console.log("Client ID from cookie:", clientId);


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

        // Hämta ClientId från cookie
        const clientId = getCookie('ClientId');
        if (clientId) {
            // Koppla spelarens namn till ClientId
            localStorage.setItem(`username${playerCount}`, username);
            localStorage.setItem(`clientId${playerCount}`, clientId);
            playerCount++;
            localStorage.setItem('playerCount', playerCount);

            errorMessage.style.display = "none";

            window.location.href = "preGame.html"; // Eller en annan sida för att hantera spelet
        } else {
            errorMessage.style.display = "block";
            errorMessage.textContent = "Could not retrieve Client ID.";
        }
    });
});