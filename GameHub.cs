using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Wordapp
{
    public class GameHub : Hub
    {
        public async Task JoinLobby(string lobbyId)
        {
            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
                Console.WriteLine($"Client {Context.ConnectionId} joined lobby {lobbyId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error joining lobby: {ex.Message}");
                throw;
            }
        }

        public async Task LeaveLobby(string lobbyId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, lobbyId);
                Console.WriteLine($"Client {Context.ConnectionId} left lobby {lobbyId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error leaving lobby: {ex.Message}");
                throw;
            }
        }

        public async Task BroadcastDifficulty(string roomId, string difficulty)
        {
            await Clients.Group(roomId).SendAsync("ReceiveDifficultyUpdate", difficulty);
        }

        public async Task BroadcastGameState(string lobbyId, object gameState)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveGameState", gameState);
        }

        public async Task BroadcastUserInput(string lobbyId, int index, string input)
        {
            await Clients.OthersInGroup(lobbyId).SendAsync("ReceiveUserInput", index, input);
        }

        public async Task BroadcastAnimation(string lobbyId, int index, string animationType)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveAnimation", index, animationType);
        }

        public async Task BroadcastTimerSync(string lobbyId, double remainingTime)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveTimerSync", remainingTime);
        }

        public async Task BroadcastTimerStart(string lobbyId, double initialTime)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveTimerStart", initialTime);
        }

        public async Task BroadcastTimerPause(string lobbyId)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveTimerPause");
        }

        public async Task BroadcastTimerResume(string lobbyId, double remainingTime)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveTimerResume", remainingTime);
        }

        public async Task BroadcastGameStart(string lobbyId)
        {
            await Clients.Group(lobbyId).SendAsync("ReceiveGameStart");
        }

        public async Task StartGame(string roomId)
        {
            await Clients.Group(roomId).SendAsync("RedirectToGame");
        }

        public async Task UpdateAvatar(string lobbyId, string username, string newSeed)
        {
            await Clients.Group(lobbyId).SendAsync("AvatarUpdated", username, newSeed);
        }
    }
}