namespace Wordapp;

public class Player
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? ClientId { get; set; }
    public string? LobbyId { get; set; }
    public string? AvatarSeed { get; set; }
    public DateTime JoinedAt { get; set; }
}