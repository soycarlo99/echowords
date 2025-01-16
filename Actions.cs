using Microsoft.AspNetCore.SignalR;
using Npgsql;

namespace Wordapp;

public class Actions
{
    private readonly Database database = new();
    private readonly NpgsqlDataSource db;
    private readonly IHubContext<GameHub> _hubContext;

    public Actions(WebApplication app, IHubContext<GameHub> hubContext)
    {
        _hubContext = hubContext;
        db = database.Connection();
        
        app.MapGet("/test-word/{word}", TestWord);

        app.MapPost("/new-word", async (HttpContext context) =>
        {
            var requestBody = await context.Request.ReadFromJsonAsync<WordRequest>();
            if (requestBody?.Word is null)
            {
                return Results.BadRequest("Word is required.");
            }
            string word = requestBody.Word.ToLower();
            bool success = await NewWord(word, context.Request.Cookies["ClientId"]);
            return success ? Results.Ok("Word added successfully.") : Results.StatusCode(500);
        });

        app.MapPost("/new-player", async (HttpContext context) =>
        {
            var requestBody = await context.Request.ReadFromJsonAsync<WordRequest>();
            if (requestBody?.Word is null)
            {
                return Results.BadRequest("Player name is required.");
            }
            string newPlayer = requestBody.Word.ToLower();
            bool success = await PlayerName(newPlayer, context.Request.Cookies["ClientId"]);
            return success ? Results.Ok("New player added successfully.") : Results.StatusCode(500);
        });
    }
    
    async Task<bool> TestWord(string word)
    {
        try
        {
            await using var cmd = db.CreateCommand("SELECT EXISTS (SELECT 1 FROM words WHERE word = $1)");
            cmd.Parameters.AddWithValue(word);
            bool result = (bool)(await cmd.ExecuteScalarAsync() ?? false);
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error testing word: {ex.Message}");
            return false;
        }
    }

    async Task<bool> NewWord(string word, string clientId)
    {
        try
        {
            await using var cmd = db.CreateCommand("INSERT INTO testtable (wordinput, clientid) VALUES ($1, $2)");
            cmd.Parameters.AddWithValue(word);
            cmd.Parameters.AddWithValue(clientId);
            int rowsAffected = await cmd.ExecuteNonQueryAsync();
            if(rowsAffected > 0)
            {
                var updatedWordList = await GetWordList();
                await _hubContext.Clients.All.SendAsync("ReceiveNewWord", word, updatedWordList);
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error adding new word: {ex.Message}");
            return false;
        }
    }

    async Task<bool> PlayerName(string newPlayer, string clientId)
    {
        try
        {
            await using var cmd = db.CreateCommand("INSERT INTO playername (username, clientid) VALUES ($1, $2)");
            cmd.Parameters.AddWithValue(newPlayer);
            cmd.Parameters.AddWithValue(clientId);
            int rowsAffected = await cmd.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error adding new player: {ex.Message}");
            return false;
        }
    }

    async Task<List<string>> GetWordList()
    {
        try
        {
            var wordList = new List<string>();
            await using var cmd = db.CreateCommand("SELECT wordinput FROM testtable ORDER BY id");
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                wordList.Add(reader.GetString(0));
            }
            return wordList;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving word list: {ex.Message}");
            return new List<string>();
        }
    }
}
