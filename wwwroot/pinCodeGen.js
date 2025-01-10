
document.addEventListener("DOMContentLoaded", () => {
    const roomIDElement = document.getElementById("roomID");

    function generatePinCode() {
        return Math.floor(1000 + Math.random() * 9000);
    }

    const pinCode = generatePinCode();
    roomIDElement.textContent = `Room ID: ${pinCode}`;

    function saveToSessionStorage(key, value) {
        if (sessionStorage.getItem(key) === null) {
            sessionStorage.setItem(key, value);
            console.log(`Saved: ${ key } = ${ value }`);
        } else {
            console.log(`Key "${key}" already exists in sessionStorage.`);
        }
    }
});

