document.addEventListener("DOMContentLoaded", () => {
  const joinButton = document.getElementById("joinLobbyButton");
  const playerNameInput = document.getElementById("playerNameInput");
  const errorMessage = document.getElementById("errorMessage");
  const loadingMessage = document.getElementById("loadingMessage");

  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");

  if (!roomId) {
    errorMessage.textContent = "Invalid invite link: Room ID is missing.";
    errorMessage.style.display = "block";
    joinButton.disabled = true;
    playerNameInput.disabled = true;
    return;
  }

  async function addPlayerNameAndJoin(username) {
    console.log("Attempting to add PlayerName:", username);
    loadingMessage.style.display = "block";
    joinButton.disabled = true;
    playerNameInput.disabled = true;
    errorMessage.style.display = "none";

    try {
      const response = await fetch("/new-player/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: username,
          lobbyId: roomId,
        }),
      });

      console.log("Add player response:", response);
      if (!response.ok) {
        let errorData = "Failed to register player.";
        try {
          errorData = await response.json();
          errorData = errorData.message || JSON.stringify(errorData);
        } catch (e) {}
        throw new Error(`Server error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      console.log("Player registered data:", data);

      console.log("Redirecting to preGame.html with roomId:", roomId);
      window.location.href = `preGame.html?roomId=${roomId}`;
    } catch (error) {
      console.error("Error joining lobby:", error);
      errorMessage.textContent = `Error: ${error.message}`;
      errorMessage.style.display = "block";
      loadingMessage.style.display = "none";
      joinButton.disabled = false;
      playerNameInput.disabled = false;
    }
  }

  joinButton.addEventListener("click", () => {
    const username = playerNameInput.value.trim();

    if (username.length < 3 || username.length > 20) {
      errorMessage.textContent = "Please enter a username (3-20 characters).";
      errorMessage.style.display = "block";
      return;
    }

    errorMessage.style.display = "none";
    addPlayerNameAndJoin(username);
  });

  playerNameInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      joinButton.click();
    }
  });

  playerNameInput.addEventListener("input", function (event) {
    if (event.target.value.length >= event.target.maxLength) {
      event.target.classList.add("shakeName");
      setTimeout(() => {
        event.target.classList.remove("shakeName");
      }, 500);
    }
  });
});
