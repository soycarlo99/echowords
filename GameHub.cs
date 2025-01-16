using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Wordapp
{
    public class GameHub : Hub
    {
        public async Task BroadcastHtml(string htmlContent)
        {
            await Clients.Others.SendAsync("ReceiveHtml", htmlContent);
        }
        
        public async Task BroadcastNewWord(string word, List<string> wordList)
        {
            await Clients.Others.SendAsync("ReceiveNewWord", word, wordList);
        }

        public async Task BroadcastGameState(object gameState)
        {
            await Clients.Others.SendAsync("ReceiveGameState", gameState);
        }

        public async Task BroadcastUserInput(int playerIndex, string input)
        {
            await Clients.Others.SendAsync("ReceiveUserInput", playerIndex, input);
        }
    }
}