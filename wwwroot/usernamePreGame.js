document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");

  if (!roomId) {
      console.error("No roomId found in URL.");
      return;
  }

  const connection = new signalR.HubConnectionBuilder()
      .withUrl("/gameHub")
      .withAutomaticReconnect([0, 2000, 5000, 10000]) 
      .build();

  connection.onreconnecting((error) => {
      console.log('Reconnecting to hub...', error);
  });

  connection.onreconnected((connectionId) => {
      console.log('Reconnected to hub.', connectionId);
  });

  connection.onclose((error) => {
      console.log('Connection closed.', error);
  });

  try {
      await connection.start();
      console.log("Connected to SignalR hub");
      await connection.invoke("JoinLobby", roomId);
      console.log("Joined lobby:", roomId);

      const response = await fetch(`/lobby/${roomId}/players`);
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