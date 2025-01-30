document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");

  if (!roomId) {
    console.error("No roomId found in URL.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5185/lobby/${roomId}/players`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.statusText}`);
    }
    const players = await response.json();
    console.log("Players retrieved:", players);

    // Todo: display players in the UI - later project
    // players.forEach(player => {display logic});
  } catch (error) {
    console.error("Error fetching players:", error);
  }
});

