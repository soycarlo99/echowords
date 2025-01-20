namespace Wordapp;

public class Lobby
{
    public string LobbyId { get; set; }  // 4-digit PIN
    public List<string> Players { get; set; } = new List<string>();
    public DateTime LastActive { get; set; } = DateTime.UtcNow;
}