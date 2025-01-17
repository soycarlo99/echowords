using Microsoft.AspNetCore.SignalR;
using System.Security.Cryptography;
using Wordapp;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();  // Register SignalR

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();

app.MapHub<GameHub>("/gameHub");  // Map SignalR hub

app.Use(async (context, next) =>
{
    const string clientIdCookieName = "ClientId";
    if (!context.Request.Cookies.TryGetValue(clientIdCookieName, out var clientId))
    {
        clientId = GenerateUniqueClientId();
        context.Response.Cookies.Append(clientIdCookieName, clientId, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            MaxAge = TimeSpan.FromDays(365)
        });
        Console.WriteLine($"New client ID generated and set: {clientId}");
    }
    else
    {
        Console.WriteLine($"Existing client ID found: {clientId}");
    }
    await next();
});

static string GenerateUniqueClientId()
{
    using var rng = RandomNumberGenerator.Create();
    var bytes = new byte[16];
    rng.GetBytes(bytes);
    return Convert.ToBase64String(bytes);
}

// Retrieve SignalR Hub context and instantiate Actions
var hubContext = app.Services.GetRequiredService<IHubContext<GameHub>>();
var actions = new Actions(app, hubContext);

try
{
    app.Run();
}
catch(Exception ex)
{
    Console.WriteLine("Unhandled exception: " + ex.ToString());
}