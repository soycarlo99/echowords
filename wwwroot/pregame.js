document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");

  if (roomId) {
    const roomIDElement = document.getElementById("roomID");
    if (roomIDElement) {
      roomIDElement.textContent = `Room ID: ${roomId}`;
    }

    const gameLink = document.getElementById("gameLink");
    if (gameLink) {
      gameLink.href = `gamePage.html?roomId=${roomId}`;
    }

    const roomLink = document.getElementById("roomLink");
    if (roomLink) {
      const fullUrl = `${roomId}`;
      roomLink.textContent = fullUrl;
      roomLink.addEventListener("click", function () {
        navigator.clipboard.writeText(roomId).then(
          function () {
            alert("Room link copied to clipboard!");
          },
          function (err) {
            console.error("Could not copy text: ", err);
          },
        );
      });
    }
  } else {
    console.error("No roomId found in URL.");
  }
});
