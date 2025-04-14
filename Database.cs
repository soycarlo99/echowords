namespace Wordapp;

using DotNetEnv;
using Npgsql;

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

        _host = Environment.GetEnvironmentVariable("PG_HOST") ?? "localhost";
        _port = Environment.GetEnvironmentVariable("PG_PORT") ?? "5432";
        _username = Environment.GetEnvironmentVariable("PG_USER") ?? "postgres";
        _password = Environment.GetEnvironmentVariable("PG_PASSWORD") ?? "postgres";
        _database = Environment.GetEnvironmentVariable("ECHO_DB_NAME") ?? "echowords";

        string connectionString =
            $"Host={_host};Port={_port};Username={_username};Password={_password};Database={_database}";
        _connection = NpgsqlDataSource.Create(connectionString);
    }
}

