const button = document.getElementById("acceptButton");
const username = document.getElementById("playerNameInput")

button.addEventListener("click", function(e) {
    e.preventDefault()
    
    const usernameValue = username.value;
    
    window.localStorage.setItem('username', usernameValue);
    
    window.location.href = "joinGame.html"
    
})
