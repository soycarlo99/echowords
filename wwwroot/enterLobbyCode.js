//var pinContainer = document.getElementsByClassName("pin-code")[0];
var pinContainer = document.querySelector(".pin-code");
console.log('There is ' + pinContainer.length + ' Pin Container on the page.');

pinContainer.addEventListener('keyup', function (event) {
    var target = event.srcElement;
    
    var maxLength = parseInt(target.attributes["maxlength"].value, 10);
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
        var next = target;
        while (next = next.previousElementSibling) {
            if (next == null) break;
            if (next.tagName.toLowerCase() == "input") {
                next.focus();
                break;
            }
        }
    }
}, false);

pinContainer.addEventListener('keydown', function (event) {
    var target = event.srcElement;
    target.value = "";
}, false);

//______--------______-----_____------_____------______-------

// Reference to the pin input container
var pinContainer = document.querySelector(".pin-code");
console.log('There is ' + (pinContainer ? pinContainer.children.length : 0) + ' pin inputs on the page.');

// Handle input navigation (keyup event)
pinContainer.addEventListener('keyup', function (event) {
    var target = event.srcElement;

    var maxLength = parseInt(target.attributes["maxlength"].value, 10);
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

// Clear input on keydown
pinContainer.addEventListener('keydown', function (event) {
    var target = event.srcElement;
    target.value = "";
}, false);

// Handle joining the lobby (validate pin code)
document.addEventListener('DOMContentLoaded', function () {
    const joinButton = document.getElementById("joinButton");

    joinButton.addEventListener('click', function () {
        // Retrieve the stored pin code from localStorage
        const storedPinCode = window.localStorage.getItem("lobbyPinCode");

        // Gather user input from the pin-code fields
        const inputs = pinContainer.querySelectorAll("input");
        const enteredPinCode = Array.from(inputs).map(input => input.value).join("");

        // Validate the entered pin code
        if (enteredPinCode === storedPinCode) {
            alert("Successfully joined the lobby!");
            // Redirect to the pre-game or lobby page
            window.location.href = "preGame.html";
        } else {
            alert("Invalid lobby code. Please try again.");
        }
    });
});
