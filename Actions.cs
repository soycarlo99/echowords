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

        //app.MapGet("/test-word/{word}", TestWord);

        app.MapPost("/new-word", async (HttpContext context) =>
        {
            var requestBody = await context.Request.ReadFromJsonAsync<WordRequest>();
            if (requestBody?.Word is null)
            {
                return Results.BadRequest("Word is required.");
            }

            string word = requestBody.Word.ToLower();
            string? clientId = context.Request.Cookies["ClientId"];

            if (clientId is null)
            {
                return Results.BadRequest("Client ID is required.");
            }

            bool success = await NewWord(word, clientId);
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
                // Generate a 4-character alphanumeric code
                const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                var random = new Random();
                lobbyId = new string(Enumerable.Repeat(chars, 4)
                    .Select(s => s[random.Next(s.Length)]).ToArray());
                
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
                // First try to update existing player
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
                    RETURNING id, username, clientid, lobbyid, avatarseed, joined_at");
                cmd.Parameters.AddWithValue(lobbyId);
                cmd.Parameters.AddWithValue(clientId);

                Player? updatedPlayer = null;
                await using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    updatedPlayer = new Player
                    {
                        Id = reader.GetInt32(0),
                        Username = reader.GetString(1),
                        ClientId = reader.IsDBNull(2) ? null : reader.GetString(2),
                        LobbyId = reader.GetString(3),
                        AvatarSeed = reader.IsDBNull(4) ? null : reader.GetString(4),
                        JoinedAt = reader.GetDateTime(5)
                    };
                }

                if (updatedPlayer != null)
                {
                    await _hubContext.Clients.Group(lobbyId).SendAsync("PlayerJoined", updatedPlayer);
                    return Results.Ok("Player lobby updated.");
                }
                else
                {
                    await using var nameCmd = db.CreateCommand(@"
                        SELECT username, avatarseed 
                        FROM players 
                        WHERE clientid = $1 
                        ORDER BY joined_at DESC 
                        LIMIT 1");
                    nameCmd.Parameters.AddWithValue(clientId);
                    
                    string username = "defaultName";
                    string? avatarSeed = null;
                    
                    await using var nameReader = await nameCmd.ExecuteReaderAsync();
                    if (await nameReader.ReadAsync())
                    {
                        username = nameReader.GetString(0);
                        avatarSeed = nameReader.IsDBNull(1) ? null : nameReader.GetString(1);
                    }

                    await using var insertCmd = db.CreateCommand(@"
                        INSERT INTO players (username, clientid, lobbyid, avatarseed) 
                        VALUES ($1, $2, $3, $4)
                        RETURNING id, username, clientid, lobbyid, avatarseed, joined_at");
                    insertCmd.Parameters.AddWithValue(username);
                    insertCmd.Parameters.AddWithValue(clientId);
                    insertCmd.Parameters.AddWithValue(lobbyId);
                    //insertCmd.Parameters.AddWithValue(avatarSeed ?? DBNull.Value);

                    Player? newPlayer = null;
                    await using var insertReader = await insertCmd.ExecuteReaderAsync();
                    if (await insertReader.ReadAsync())
                    {
                        newPlayer = new Player
                        {
                            Id = insertReader.GetInt32(0),
                            Username = insertReader.GetString(1),
                            ClientId = insertReader.IsDBNull(2) ? null : insertReader.GetString(2),
                            LobbyId = insertReader.GetString(3),
                            AvatarSeed = insertReader.IsDBNull(4) ? null : insertReader.GetString(4),
                            JoinedAt = insertReader.GetDateTime(5)
                        };
                    }

                    if (newPlayer != null)
                    {
                        await _hubContext.Clients.Group(lobbyId).SendAsync("PlayerJoined", newPlayer);
                        return Results.Ok("New player created and lobby updated.");
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

        app.MapPost("/lobby/{lobbyId}/submit-results", async (string lobbyId, HttpContext context) => 
        {
            try 
            {
                var results = await context.Request.ReadFromJsonAsync<List<PlayerResult>>();
                if (results == null) return Results.BadRequest("No results provided");

                foreach (var result in results)
                {
                    await using var cmd = db.CreateCommand(@"
                        INSERT INTO player_match_results (player_id, score, words_submitted, accuracy)
                        SELECT id, @score, @wordsSubmitted, @accuracy
                        FROM players 
                        WHERE username = @username AND lobbyid = @lobbyId");

                    cmd.Parameters.AddWithValue("@score", result.Score);
                    cmd.Parameters.AddWithValue("@wordsSubmitted", result.WordsSubmitted);
                    cmd.Parameters.AddWithValue("@accuracy", result.Accuracy);
                    cmd.Parameters.AddWithValue("@username", result.Username);
                    cmd.Parameters.AddWithValue("@lobbyId", lobbyId);

                    await cmd.ExecuteNonQueryAsync();
                }

                return Results.Ok();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error submitting match results: {ex}");
                return Results.StatusCode(500);
            }
        });

        

        app.MapGet("/lobby/{lobbyId}/results", async (string lobbyId) => 
        {
            try 
            {
                await using var cmd = db.CreateCommand(@"
                    SELECT p.username, p.avatarseed, 
                        COALESCE(pw.score, 0) as score,
                        COALESCE(pw.words_submitted, 0) as wordsSubmitted,
                        COALESCE(pw.accuracy, 0) as accuracy
                    FROM players p
                    LEFT JOIN player_match_results pw ON p.id = pw.player_id
                    WHERE p.lobbyid = $1");
                cmd.Parameters.AddWithValue(lobbyId);
                
                var players = new List<dynamic>();
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    players.Add(new
                    {
                        username = reader.GetString(0),
                        avatarSeed = reader.IsDBNull(1) ? null : reader.GetString(1),
                        score = reader.GetInt32(2),
                        wordsSubmitted = reader.GetInt32(3),
                        accuracy = reader.GetInt32(4)
                    });
                }

                return Results.Ok(new
                {
                    players = players,
                    totalWords = players.Sum(p => ((dynamic)p).wordsSubmitted),
                    gameDuration = 300
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error fetching match results: {ex}");
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
    
    // async Task<bool> TestWord(string word)
    // {
    //     try
    //     {
    //         await using var cmd = db.CreateCommand("SELECT EXISTS (SELECT 1 FROM words WHERE word = $1)");
    //         cmd.Parameters.AddWithValue(word);
    //         bool result = (bool)(await cmd.ExecuteScalarAsync() ?? false);
    //         return result;
    //     }
    //     catch (Exception ex)
    //     {
    //         Console.WriteLine($"Error testing word: {ex.Message}");
    //         return false;
    //     }
    // }

    

    async Task<bool> NewWord(string word, string clientId)
    {
        try
        {
            await using var cmd = db.CreateCommand("INSERT INTO playerwords (wordinput, clientid) VALUES ($1, $2)");
            cmd.Parameters.AddWithValue(word);
            cmd.Parameters.AddWithValue(clientId);
            int rowsAffected = await cmd.ExecuteNonQueryAsync();
            if (rowsAffected > 0)
            {
                //var updatedWordList = await GetWordList();
                //await _hubContext.Clients.All.SendAsync("ReceiveNewWord", word, updatedWordList);
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

        async Task<bool> PlayerName(string username, string? clientId, string? lobbyId)
    {
        try
        {
            if (clientId == null)
            {
                Console.WriteLine("Error: Client ID is null");
                return false;
            }

            await using var cmd = db.CreateCommand(@"
                INSERT INTO players (username, clientid, lobbyid, avatarseed)
                VALUES ($1, $2, $3, $4)
                RETURNING id");
            
            cmd.Parameters.AddWithValue(username);
            cmd.Parameters.AddWithValue(clientId);
            cmd.Parameters.AddWithValue(lobbyId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue(Guid.NewGuid().ToString()); // Generate a random avatar seed

            // Fix for CS8605: Safely handle possibly null value
            var result = await cmd.ExecuteScalarAsync();
            if (result == null)
            {
                Console.WriteLine("Error: Failed to get new player ID");
                return false;
            }

            int newPlayerId = Convert.ToInt32(result);
            
            if (newPlayerId > 0)
            {
                if (!string.IsNullOrEmpty(lobbyId))
                {
                    // If a lobby ID was provided, notify other players in the lobby
                    var player = new Player
                    {
                        Id = newPlayerId,
                        Username = username,
                        ClientId = clientId,
                        LobbyId = lobbyId,
                        JoinedAt = DateTime.UtcNow
                    };
                    await _hubContext.Clients.Group(lobbyId).SendAsync("PlayerJoined", player);
                }
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error adding new player: {ex.Message}");
            return false;
        }
    }

    // async Task<List<string>> GetWordList()
    // {
    //     try
    //     {
    //         var wordList = new List<string>();
    //         await using var cmd = db.CreateCommand("SELECT wordinput FROM playerwords ORDER BY id");
    //         await using var reader = await cmd.ExecuteReaderAsync();
    //         while (await reader.ReadAsync())
    //         {
    //             wordList.Add(reader.GetString(0));
    //         }
    //         return wordList;
    //     }
    //     catch (Exception ex)
    //     {
    //         Console.WriteLine($"Error retrieving word list: {ex.Message}");
    //         return new List<string>();
    //     }
    // }
}