// window.onload = function () {
//     let input = document.getElementById('gameInput');
//     input.focus();
//     input.select();
// }

let gameActive = true;

let c; 
function restartClock(){
    if (c){
        clearInterval(c)
    }
    document.getElementById('timer').innerHTML="10"
    c = setInterval(showClock,1000)
    function showClock(){
        var seconds = document.getElementById('timer').textContent;
        seconds--;
        document.getElementById('timer').innerHTML=seconds;
        if(seconds==0)
        {
            clearInterval(c);
            document.getElementById('timer').innerHTML = "Finished";
            
            gameActive = false; 

            const inputs = document.querySelectorAll('.gameInput');
            inputs.forEach(input => {
                input.disabled = true;
            });

            const addWordButton = document.getElementById('timerButton');
            addWordButton.disabled = true;
            
        }
    }
}


    
