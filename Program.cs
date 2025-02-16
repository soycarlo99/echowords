using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.SignalR;
using System.Security.Cryptography;
using Wordapp;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins("https://echowords.xyz")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowSpecificOrigins");

app.Use((context, next) =>
{
    var forwardedProto = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
    if (forwardedProto != null)
    {
        context.Request.Scheme = forwardedProto;
    }
    return next();
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.MapHub<GameHub>("/gameHub");

app.Use(async (context, next) =>
{
    const string clientIdCookieName = "ClientId";
    if (!context.Request.Cookies.TryGetValue(clientIdCookieName, out var clientId))
    {
        clientId = GenerateUniqueClientId();
        context.Response.Cookies.Append(clientIdCookieName, clientId, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            MaxAge = TimeSpan.FromDays(365)
        });
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

var hubContext = app.Services.GetRequiredService<IHubContext<GameHub>>();
var actions = new Actions(app, hubContext);

app.Run();