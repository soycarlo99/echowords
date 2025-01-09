document.addEventListener("DOMContentLoaded", () => {
    const acceptButton = document.getElementById("acceptButton");
    const playerNameInput = document.getElementById("playerNameInput");
    const errorMessage = document.getElementById("errorMessage");
    let playerUsername = document.getElementById("")

    acceptButton.addEventListener("click", () => {
        const username = playerNameInput.value.trim();

        if (username === "") {
            errorMessage.style.display = "block";
            errorMessage.textContent = "Please enter a username.";
            return;
        }

        localStorage.setItem("playerUsername", username);


        alert(`Username "${username}" has been saved!`);
        errorMessage.style.display = "none";

        window.location.href = "preGame.html";

        document.getElementById("#player").innerHTML = (`"${username}"`);
    });


});