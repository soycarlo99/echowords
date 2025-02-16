namespace Wordapp;

using Npgsql;
using DotNetEnv;

public class Database
{
    private readonly string _host;
    private readonly string _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _database;

    private NpgsqlDataSource _connection;
    public NpgsqlDataSource Connection()
    {
        return _connection;
    }

    public Database()
    {
        Env.Load();
        
        _host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
        _port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
        _username = Environment.GetEnvironmentVariable("DB_USERNAME") ?? "postgres";
        _password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres";
        _database = Environment.GetEnvironmentVariable("DB_NAME") ?? "database_for_echowords";

        string connectionString = $"Host={_host};Port={_port};Username={_username};Password={_password};Database={_database}";
        _connection = NpgsqlDataSource.Create(connectionString);
    }
}