window.onload = function () {
    let input = document.getElementById('gameInput');
    input.focus();
    input.select();
}
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
            document.getElementById('timer').innerHTML="Finished";
        }
    }
}


    
