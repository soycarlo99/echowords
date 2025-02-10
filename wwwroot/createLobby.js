let connection;

async function joinLobbyWithSignalR(lobbyId) {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/gameHub", {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
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
    const spinner = document.getElementById("loadingSpinner");
    spinner.classList.add("show");
    
    try {
        const response = await fetch('/create-lobby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        
        const data = await response.json();
        const lobbyId = data.lobbyId;

        await updatePlayerLobby(lobbyId);
        await joinLobbyWithSignalR(lobbyId);
        
        window.location.href = `preGame.html?roomId=${lobbyId}`;

    } catch (error) {
        spinner.classList.remove("show");
        console.error("Error creating lobby:", error);
    }
});

async function updatePlayerLobby(lobbyId) {
    const payload = { LobbyId: lobbyId };
    try {
        const response = await fetch('/update-player-lobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important for cookies
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