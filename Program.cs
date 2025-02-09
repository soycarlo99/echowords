using Microsoft.AspNetCore.SignalR;
using System.Security.Cryptography;
using Wordapp;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// 1. SERVICE CONFIGURATION
// ============================================================================

// Add API Explorer and Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure SignalR with detailed errors and handshake timeout
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

// Configure CORS to allow all origins, methods, and headers
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// ============================================================================
// 2. MIDDLEWARE PIPELINE
// ============================================================================

// Enable Swagger in development environment
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS before routing
app.UseCors("AllowAll");

// Handle forwarded headers (e.g., X-Forwarded-Proto)
app.Use((context, next) =>
{
    var forwardedProto = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
    if (forwardedProto != null)
    {
        context.Request.Scheme = forwardedProto;
    }
    return next();
});

// Serve default files and static files
app.UseDefaultFiles();
app.UseStaticFiles();

// Enable routing
app.UseRouting();

// Map SignalR hub
app.MapHub<GameHub>("/gameHub");

// Middleware to set or retrieve ClientId cookie
app.Use(async (context, next) =>
{
    const string clientIdCookieName = "ClientId";
    if (!context.Request.Cookies.TryGetValue(clientIdCookieName, out var clientId))
    {
        clientId = GenerateUniqueClientId();
        context.Response.Cookies.Append(clientIdCookieName, clientId, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,  // Enable for HTTPS
            SameSite = SameSiteMode.None,  // Required for cross-site access
            MaxAge = TimeSpan.FromDays(365)
        });
    }
    await next();
});

// ============================================================================
// 3. HELPER METHODS
// ============================================================================

/// <summary>
/// Generates a unique client ID using a cryptographically secure random number generator.
/// </summary>
static string GenerateUniqueClientId()
{
    using var rng = RandomNumberGenerator.Create();
    var bytes = new byte[16];
    rng.GetBytes(bytes);
    return Convert.ToBase64String(bytes);
}

// ============================================================================
// 4. APPLICATION STARTUP
// ============================================================================

// Retrieve SignalR Hub context and instantiate Actions
var hubContext = app.Services.GetRequiredService<IHubContext<GameHub>>();
var actions = new Actions(app, hubContext);

// Run the application
try
{
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("Unhandled exception: " + ex.ToString());
}