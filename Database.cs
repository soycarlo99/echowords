// namespace Wordapp;
//
// using DotNetEnv;
// using Npgsql;
//
// public class Database
// {
//     private readonly string _host;
//     private readonly string _port;
//     private readonly string _username;
//     private readonly string _password;
//     private readonly string _database;
//
//     private NpgsqlDataSource _connection;
//
//     public NpgsqlDataSource Connection()
//     {
//         return _connection;
//     }
//
//     public Database()
//     {
//         Env.Load();
//
//         _host = Environment.GetEnvironmentVariable("ECHO_PG_HOST");
//         _port = Environment.GetEnvironmentVariable("ECHO_PG_PORT");
//         _username = Environment.GetEnvironmentVariable("ECHO_PG_USER");
//         _password = Environment.GetEnvironmentVariable("ECHO_PG_PASSWORD");
//         _database = Environment.GetEnvironmentVariable("ECHO_DB_NAME");
//
//         // _port = builder.Configuration("ECHO_PG_PORT");
//         // _host = builder.Configuration("ECHO_PG_HOST");
//         // _username = builder.Configuration("ECHO_PG_USER");
//         // _password = builder.Configuration("ECHO_PG_PASSWORD");
//         // _database = builder.Configuration("ECHO_DB_NAME");
//
//
//         string connectionString =
//             $"Host={_host};Port={_port};Username={_username};Password={_password};Database={_database}";
//         _connection = NpgsqlDataSource.Create(connectionString);
//     }
// }
