document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get("roomId");

    if (!lobbyId) {
        console.error("Lobby ID not found in URL.");
        return;
    }

    // Connect to SignalR hub
    const connection = new signalR.HubConnectionBuilder()
    .withUrl("/gameHub")
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();

    async function getMatchResults() {
        try {
            const response = await fetch(`/lobby/${lobbyId}/results`);
            if (!response.ok) {
                console.error(`Failed to fetch match results: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch match results: ${response.status}`);
            }
            const data = await response.json();
            console.log("Retrieved match results:", data);
            return data;
        } catch (error) {
            console.error("Error fetching match results:", error);
            return null;
        }
    }

    function createPlayerCard(player, position) {
        const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(player.avatarSeed || player.username)}`;
        
        const medal = position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : '';
        
        return `
            <div class="result-card ${position <= 3 ? 'podium-card' : 'other-card'} fade-in">
                ${medal ? `<div class="medal">${medal}</div>` : ''}
                <div class="card">
                    <img src="${avatarUrl}" alt="Avatar" style="width:100%">
                    <div class="container">
                        <h4>${player.username}</h4>
                        <div class="stats">
                            <p class="score">Score: ${player.score}</p>
                            <p class="words">Words: ${player.wordsSubmitted}</p>
                            <p class="accuracy">Accuracy: ${player.accuracy}%</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function displayResults(results) {
        if (!results || !results.players || !Array.isArray(results.players)) {
            console.error("Invalid results data:", results);
            return;
        }
    
        const podiumContainer = document.getElementById('podium');
        const otherPlayersContainer = document.getElementById('otherPlayers');
        
        if (!podiumContainer || !otherPlayersContainer) {
            console.error("Required containers not found in DOM");
            return;
        }
    
        // Sort players by score
        const sortedPlayers = results.players.sort((a, b) => b.score - a.score);
        
        document.getElementById('totalWords').textContent = results.totalWords || 0;
        document.getElementById('gameDuration').textContent = `${results.gameDuration || 0}s`;
        
        podiumContainer.innerHTML = sortedPlayers
            .slice(0, 3)
            .map((player, index) => createPlayerCard(player, index + 1))
            .join('');
        
        otherPlayersContainer.innerHTML = sortedPlayers
            .slice(3)
            .map((player, index) => createPlayerCard(player, index + 4))
            .join('');
    }

    document.getElementById('rematchButton').addEventListener('click', () => {
        window.location.href = `/gamePage.html?roomId=${lobbyId}`;
    });

    document.getElementById('quitButton').addEventListener('click', () => {
        window.location.href = `/preGame.html?roomId=${lobbyId}`;
    });


    try {
        await connection.start();
        console.log("Connected to SignalR");
        await connection.invoke("JoinLobby", lobbyId);
        
        const results = await getMatchResults();
        if (results) {
            displayResults(results);
        }
    } catch (error) {
        console.error("Error initializing match results:", error);
    }
});