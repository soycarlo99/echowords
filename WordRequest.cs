namespace Wordapp;

// Model to parse the NewWord POST route request body
public class WordRequest
{
    public string Word { get; set; }
    public string newPlayer { get; set; }
}
