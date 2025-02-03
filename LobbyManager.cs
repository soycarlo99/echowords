namespace Wordapp;

public static class LobbyManager
{
    private static Dictionary<string, Lobby> lobbies = new Dictionary<string, Lobby>();
    public static bool Exists(string lobbyId) => lobbies.ContainsKey(lobbyId);

    public static void AddLobby(string lobbyId)
    {
        if(!lobbies.ContainsKey(lobbyId))
        {
            lobbies[lobbyId] = new Lobby { LobbyId = lobbyId, LastActive = DateTime.UtcNow };
        }
    }

    public static Lobby? GetLobby(string lobbyId)
    {
        lobbies.TryGetValue(lobbyId, out var lobby);
        return lobby;
    }
}