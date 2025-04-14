using System.Security.Cryptography;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
using Wordapp;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

var host = builder.Configuration["ECHO_PG_HOST"];
var port = builder.Configuration["ECHO_PG_PORT"];
var username = builder.Configuration["ECHO_PG_USER"];
var database = builder.Configuration["ECHO_DB_NAME"];
var password = builder.Configuration["ECHO_PG_PASSWORD"];

string connectionString =
    $"Host={host};Port={port};Username={username};Password={password};Database={database}";

var dataSource = NpgsqlDataSource.Create(connectionString);

builder.Services.AddSingleton<NpgsqlDataSource>(dataSource);

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.MapHub<GameHub>("/gameHub");

app.MapGet(
    "/api/test",
    async (NpgsqlDataSource dataSource) =>
    {
        try
        {
            var tables = new List<string>();
            await using var connection = await dataSource.OpenConnectionAsync();
            await using var command = connection.CreateCommand();
            command.CommandText =
                @"
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;";

            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString(0));
            }

            return Results.Ok(new { tables, count = tables.Count });
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.ToString(), title: "Database Error", statusCode: 500);
        }
    }
);

app.Use(
    async (context, next) =>
    {
        const string clientIdCookieName = "ClientId";
        if (!context.Request.Cookies.TryGetValue(clientIdCookieName, out var clientId))
        {
            clientId = GenerateUniqueClientId();
            context.Response.Cookies.Append(
                clientIdCookieName,
                clientId,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    MaxAge = TimeSpan.FromDays(365),
                }
            );
        }
        await next();
    }
);

static string GenerateUniqueClientId()
{
    using var rng = RandomNumberGenerator.Create();
    var bytes = new byte[16];
    rng.GetBytes(bytes);
    return Convert.ToBase64String(bytes);
}

var hubContext = app.Services.GetRequiredService<IHubContext<GameHub>>();
var dataSourceService = app.Services.GetRequiredService<NpgsqlDataSource>();
var actions = new Actions(app, hubContext, dataSourceService);

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("Unhandled exception: " + ex.ToString());
}
