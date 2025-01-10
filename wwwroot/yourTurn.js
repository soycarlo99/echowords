


// antal spelare kommer från annan data
//deras data kan vara "player" och antal



const playerTurnArray= [];
const listActivePlayer= ["Patrik", "Edvin", "Kasper"];
let addPlayerToArray = 0
let players = 0



let player1 = "Edvin"
let player2 = "Patrik"
let player3 = "Kasper"
    
    /*
    

while(players <= currentPlayers){
    players +=
        

addPlayerToArray = player1
addPlayerToArray = player2
addPlayerToArray = player3
    
    
        listActivePlayer.push(addPlayerToArray)
}

*/





var numbersOfPlayers = listActivePlayer.length
var randomPlayer = Math.floor(Math.random()*numbersOfPlayers)



playerTurnArray.push(randomPlayer)
//listActivePlayer[randomPlayer].splice(playerTurnArray)

//var item = listActivePlayer[Math.floor(Math.random()*listActivePlayer.length)];



console.log(randomPlayer)
console.log([playerTurnArray])
