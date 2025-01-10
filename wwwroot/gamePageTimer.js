 
function restartClock(){
    var c = setInterval(showclock,1000)
    function showclock(){

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


    
