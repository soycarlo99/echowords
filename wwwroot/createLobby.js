let connection;

async function joinLobbyWithSignalR(lobbyId) {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5185/gameHub") // Use correct port and route
        .build();

    connection.on("ReceiveMessage", (message) => {
        console.log("Received message:", message);
    });

    try {
        await connection.start();
        console.log("Connected to SignalR");
        await connection.invoke("JoinLobby", lobbyId);
        console.log(`Joined lobby ${lobbyId}`);
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('createLobbyButton').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:5185/create-lobby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        const lobbyId = data.lobbyId;

        updatePlayerLobby(lobbyId);
        // await joinLobbyWithSignalR(lobbyId);

        // Redirect to preGame.html with the lobbyId as a query parameter
        window.location.href = `preGame.html?roomId=${lobbyId}`;

    } catch (error) {
        console.error("Error creating lobby:", error);
    }
});


async function updatePlayerLobby(lobbyId) {
    const payload = { LobbyId: lobbyId };
    try {
        const response = await fetch('http://localhost:5185/update-player-lobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const result = await response.text();
        console.log(result);
    } catch (error) {
        console.error("Error updating player's lobby:", error);
    }
}