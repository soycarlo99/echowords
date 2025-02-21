document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  var pinContainer = document.querySelector(".pin-code");
  if (pinContainer) {
    pinContainer.addEventListener(
      "keyup",
      function (event) {
        var target = event.srcElement;

        target.value = target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

        var maxLength = parseInt(target.getAttribute("maxlength"), 10);
        var myLength = target.value.length;

        if (myLength >= maxLength) {
          var next = target;
          while ((next = next.nextElementSibling)) {
            if (next == null) break;
            if (next.tagName.toLowerCase() == "input") {
              requestAnimationFrame(() => {
                next.focus();
              });
              break;
            }
          }
        }

        if (myLength === 0) {
          var prev = target;
          while ((prev = prev.previousElementSibling)) {
            if (prev == null) break;
            if (prev.tagName.toLowerCase() == "input") {
              prev.focus();
              break;
            }
          }
        }

        const inputs = document.querySelectorAll(".pin-code input");
        let code = "";
        inputs.forEach((input) => {
          code += input.value.trim();
        });
        if (code.length === 4) {
          document.getElementById("joinButton").click();
        }
      },
      false,
    );
  }

  const gameLink = document.getElementById("gameLink");
  if (gameLink) {
    gameLink.href = `gamePage.html?roomId=${lobbyCode}`;
  }

  function getLobbyCode() {
    let code = "";
    const inputs = document.querySelectorAll(".pin-code input");
    inputs.forEach((input) => {
      code += input.value.trim();
    });
    return code;
  }

  async function joinLobby(lobbyId) {
    let connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5185/gameHub")
      .build();

    try {
      await connection.start();
      console.log("Connected to SignalR");
      await connection.invoke("JoinLobby", lobbyId);
      console.log(`Joined lobby ${lobbyId}`);
    } catch (err) {
      console.error("Error joining lobby:", err);
    }
  }

  async function updatePlayerLobby(lobbyId) {
    const payload = { LobbyId: lobbyId };
    try {
      const response = await fetch("/update-player-lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log(`Update player lobby response status: ${response.status}`);
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      const result = await response.text();
      console.log("Update result:", result);
    } catch (error) {
      console.error("Error updating player's lobby:", error);
    }
  }

  document.getElementById("joinButton").addEventListener("click", async () => {
    const spinner = document.getElementById("loadingSpinner");
    const joinButton = document.getElementById("joinButton");

    const lobbyCode = getLobbyCode().toUpperCase();
    console.log(`Lobby code entered: ${lobbyCode}`);
    if (lobbyCode.length < 4) {
      alert("Please enter a complete 4-character lobby code.");
      return;
    }

    spinner.classList.add("show");
    joinButton.disabled = true;

    try {
      console.log(`Attempting to join lobby: ${lobbyCode}`);

      const delay = Math.random() * 1000 + 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      await joinLobby(lobbyCode);
      await updatePlayerLobby(lobbyCode);
      console.log("Redirecting to preGame.html...");
      window.location.href = `preGame.html?roomId=${lobbyCode}`;
    } catch (error) {
      console.error("Error joining lobby:", error);
      spinner.classList.remove("show");
      joinButton.disabled = false;
      alert("Failed to join lobby. Please try again.");
    }
  });
});
