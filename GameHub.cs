using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Wordapp
{
    public class GameHub : Hub
    {
        public async Task BroadcastGameState(object gameState)
        {
            await Clients.Others.SendAsync("ReceiveGameState", gameState);
        }

        public async Task BroadcastUserInput(int index, string input)
        {
            await Clients.Others.SendAsync("ReceiveUserInput", index, input);
        }

        public async Task BroadcastAnimation(int index, string animationType)
        {
            await Clients.Others.SendAsync("ReceiveAnimation", index, animationType);
        }

        public async Task SubmitWord(int playerIndex, string word)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(word))
                    throw new ArgumentException("Word cannot be empty.");

                await Clients.Others.SendAsync("PlayerSubmittedWord", playerIndex, word);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public async Task JoinLobby(string lobbyId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
            await Clients.Group(lobbyId).SendAsync("ReceiveMessage", $"A new player has joined lobby {lobbyId}.");
        }
    }
}