// Input navigation for the PIN code
var pinContainer = document.querySelector(".pin-code");
console.log('There is ' + (pinContainer ? "a" : "no") + ' Pin Container on the page.');

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

// Function to retrieve the 4-digit lobby code from inputs
function getLobbyCode() {
    let code = '';
    const inputs = document.querySelectorAll('.pin-code input');
    inputs.forEach(input => { code += input.value.trim(); });
    return code;
}

let connection;

// Function to join a lobby using SignalR
async function joinLobby(lobbyId) {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5185/gameHub")
        .build();

    connection.on("ReceiveMessage", (message) => {
        console.log("Received message:", message);
        // TODO: Update UI to show new players/cards as messages arrive
    });

    try {
        await connection.start();
        console.log("Connected to SignalR");
        await connection.invoke("JoinLobby", lobbyId);
        console.log(`Joined lobby ${lobbyId}`);
    } catch(err) {
        console.error(err);
    }
}

// Event listener for the Join Lobby button
document.getElementById('joinButton').addEventListener('click', async () => {
    const lobbyCode = getLobbyCode();
    if(lobbyCode.length < 4) {
        alert("Please enter a complete 4-digit lobby code.");
        return;
    }
    await joinLobby(lobbyCode);
});

// Event listener for the Join Lobby button
document.getElementById('joinButton').addEventListener('click', async () => {
    const lobbyCode = getLobbyCode();
    if(lobbyCode.length < 4) {
        alert("Please enter a complete 4-digit lobby code.");
        return;
    }
    await joinLobby(lobbyCode);
    // After successfully joining, redirect to preGame.html with the roomId
    window.location.href = `preGame.html?roomId=${lobbyCode}`;
});