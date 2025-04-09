using System.Security.Cryptography;
using Microsoft.AspNetCore.SignalR;
using Wordapp;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

// Handle forwarded headers (e.g., X-Forwarded-Proto)

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.MapHub<GameHub>("/gameHub");

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
var actions = new Actions(app, hubContext);

try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("Unhandled exception: " + ex.ToString());
}

