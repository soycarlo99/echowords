document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");

    // Input navigation logic for PIN code fields (optional)
    var pinContainer = document.querySelector(".pin-code");
    if(pinContainer) {
        pinContainer.addEventListener('keyup', function (event) {
            var target = event.srcElement;
            var maxLength = parseInt(target.getAttribute("maxlength"), 10);
            var myLength = target.value.length;

            if (myLength >= maxLength) {
                var next = target;
                while (next = next.nextElementSibling) {
                    if (next == null) break;
                    if (next.tagName.toLowerCase() == "input") {
                        next.focus();
                        break;
                    }
                }
            }

            if (myLength === 0) {
                var prev = target;
                while (prev = prev.previousElementSibling) {
                    if (prev == null) break;
                    if (prev.tagName.toLowerCase() == "input") {
                        prev.focus();
                        break;
                    }
                }
            }
        }, false);

        pinContainer.addEventListener('keydown', function (event) {
            var target = event.srcElement;
            target.value = "";
        }, false);
    }

    // After obtaining lobbyCode (or in your redirection logic)
    const gameLink = document.getElementById('gameLink');
    if(gameLink) {
        gameLink.href = `gamePage.html?roomId=${lobbyCode}`;
    }

    // Retrieve the 4-digit lobby code from input fields
    function getLobbyCode() {
        let code = '';
        const inputs = document.querySelectorAll('.pin-code input');
        inputs.forEach(input => { code += input.value.trim(); });
        return code;
    }

    // Connect to SignalR and join the lobby
    async function joinLobby(lobbyId) {
        let connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5185/gameHub")
            .build();

        try {
            await connection.start();
            console.log("Connected to SignalR");
            await connection.invoke("JoinLobby", lobbyId);
            console.log(`Joined lobby ${lobbyId}`);
        } catch(err) {
            console.error("Error joining lobby:", err);
        }
    }

    // Update player's lobby on the server
    async function updatePlayerLobby(lobbyId) {
        const payload = { LobbyId: lobbyId };
        try {
            const response = await fetch('http://localhost:5185/update-player-lobby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',  // Ensure cookies are sent
                body: JSON.stringify(payload)
            });

            console.log(`Update player lobby response status: ${response.status}`);
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const result = await response.text();
            console.log("Update result:", result);
        } catch (error) {
            console.error("Error updating player's lobby:", error);
        }
    }

    // Event listener for the Join Lobby button
    document.getElementById('joinButton').addEventListener('click', async () => {
        const lobbyCode = getLobbyCode();
        console.log(`Lobby code entered: ${lobbyCode}`);
        if(lobbyCode.length < 4) {
            alert("Please enter a complete 4-digit lobby code.");
            return;
        }
        console.log(`Attempting to join lobby: ${lobbyCode}`);
        await joinLobby(lobbyCode);
        await updatePlayerLobby(lobbyCode);
        console.log("Redirecting to preGame.html...");
        window.location.href = `preGame.html?roomId=${lobbyCode}`;
    });
});