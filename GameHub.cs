using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Wordapp
{
    public class GameHub : Hub
    {
        // Broadcast HTML content to other clients
        public async Task BroadcastHtml(string htmlContent)
        {
            await Clients.Others.SendAsync("ReceiveHtml", htmlContent);
        }

        // Notify others of a new word submission along with current word list
        public async Task BroadcastNewWord(string word, List<string> wordList)
        {
            await Clients.Others.SendAsync("ReceiveNewWord", word, wordList);
        }

        // Broadcast the updated game state to other clients
        public async Task BroadcastGameState(object gameState)
        {
            await Clients.Others.SendAsync("ReceiveGameState", gameState);
        }

        // Broadcast user input from one player to others
        public async Task BroadcastUserInput(int playerIndex, string input)
        {
            await Clients.Others.SendAsync("ReceiveUserInput", playerIndex, input);
        }

        // Handle word submission, process game logic, then notify others
        public async Task SubmitWord(int playerIndex, string word) 
        {
            try 
            {
                if(string.IsNullOrWhiteSpace(word))
                    throw new ArgumentException("Word cannot be empty.");

                await Clients.Others.SendAsync("PlayerSubmittedWord", playerIndex, word);
            }
            catch(Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }
        
        // Combined BroadcastAnimation method with an optional parameter
        public async Task BroadcastAnimation(int index, string animationType = null)
        {
            if(animationType != null)
            {
                await Clients.Others.SendAsync("ReceiveAnimation", index, animationType);
            }
            else
            {
                await Clients.Others.SendAsync("ReceiveAnimation", index);
            }
        }
        
        public async Task JoinLobby(string lobbyId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
            await Clients.Group(lobbyId).SendAsync("ReceiveMessage", $"A new player has joined lobby {lobbyId}.");
        }
    }
}