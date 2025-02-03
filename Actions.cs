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
                Console.WriteLine("Bad request: Missing player name.");
                return Results.BadRequest("Player name is required.");
            }
            string newPlayer = requestBody.Word.ToLower();
            string? lobbyId = requestBody.LobbyId;  // LobbyId can be null
            bool success = await PlayerName(newPlayer, context.Request.Cookies["ClientId"], lobbyId);
            return success ? Results.Ok("New player added successfully.") : Results.StatusCode(500);
        });

        app.MapPost("/create-lobby", async (HttpContext context) =>
        {
            string lobbyId;
            int attempts = 0;
            do
            {
                lobbyId = new Random().Next(1000, 10000).ToString();
                attempts++;
                if(attempts > 10) 
                {
                    return Results.StatusCode(500);
                }
            }
            while(LobbyManager.Exists(lobbyId));

            await Task.Run(() => LobbyManager.AddLobby(lobbyId));
            return Results.Ok(new { lobbyId });
        });

        app.MapGet("/lobby/{lobbyId}/players", async (string lobbyId) => 
        {
            var players = await GetPlayersByLobbyAsync(lobbyId);
            return Results.Ok(players);
        });
        
        app.MapPost("/update-player-lobby", async (HttpContext context) =>
        {
            var requestBody = await context.Request.ReadFromJsonAsync<WordRequest>();
            if (requestBody?.LobbyId is null)
            {
                return Results.BadRequest("Lobby ID is required.");
            }

            string lobbyId = requestBody.LobbyId;
            string? clientId = context.Request.Cookies["ClientId"];

            if (clientId is null)
            {
                return Results.BadRequest("Client ID missing.");
            }

            try
            {
                // Update only the most recent player record for the given clientid
                await using var cmd = db.CreateCommand(@"
                    UPDATE players 
                    SET lobbyid = $1 
                    WHERE id = (
                        SELECT id 
                        FROM players 
                        WHERE clientid = $2 
                        ORDER BY joined_at DESC 
                        LIMIT 1
                    )
                ");
                cmd.Parameters.AddWithValue(lobbyId);
                cmd.Parameters.AddWithValue(clientId);

                int rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected > 0)
                {
                    return Results.Ok("Player lobby updated.");
                }
                else
                {
                    // If no record found, create a new player record
                    await using var insertCmd = db.CreateCommand(@"
                        INSERT INTO players (username, clientid, lobbyid) 
                        VALUES ($1, $2, $3)
                    ");
                    // Using a placeholder username; update as necessary
                    insertCmd.Parameters.AddWithValue("defaultName");
                    insertCmd.Parameters.AddWithValue(clientId);
                    insertCmd.Parameters.AddWithValue(lobbyId);

                    int insertRows = await insertCmd.ExecuteNonQueryAsync();
                    if(insertRows > 0)
                    {
                        return Results.Ok("No existing player found; new player created and lobby updated.");
                    }
                    else
                    {
                        return Results.StatusCode(500);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating player lobby: {ex.Message}");
                return Results.StatusCode(500);
            }
        });
    }

    public async Task<List<Player>> GetPlayersByLobbyAsync(string lobbyId)
    {
        var players = new List<Player>();
        try
        {
            await using var cmd = db.CreateCommand("SELECT id, username, clientid, lobbyid, avatarseed, joined_at FROM players WHERE lobbyid = $1");
            cmd.Parameters.AddWithValue(lobbyId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                players.Add(new Player {
                    Id = reader.GetInt32(0),
                    Username = reader.GetString(1),
                    ClientId = reader.IsDBNull(2) ? null : reader.GetString(2),
                    LobbyId = reader.GetString(3),
                    AvatarSeed = reader.IsDBNull(4) ? null : reader.GetString(4),
                    JoinedAt = reader.GetDateTime(5)
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving players: {ex.Message}");
        }
        return players;
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

    async Task<bool> PlayerName(string? newPlayer, string? clientId, string? lobbyId)
    {
        try
        {
            await using var cmd = db.CreateCommand("INSERT INTO players (username, clientid, lobbyid) VALUES ($1, $2, $3)");
            cmd.Parameters.AddWithValue(newPlayer);
            cmd.Parameters.AddWithValue(clientId);
        
            // Handle nullable lobbyId: insert DBNull.Value if lobbyId is null
            if (lobbyId is null)
                cmd.Parameters.AddWithValue(DBNull.Value);
            else
                cmd.Parameters.AddWithValue(lobbyId);
        
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