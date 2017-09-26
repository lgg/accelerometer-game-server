var socket;
var socket_host = window.location.origin;
var socket_args = {
    transports: ['websocket'],
    upgrade: false,
    cookie: false
}; //socket.io

var players = {};
var div_score; //wrapper for score divs
var div_status; //status div
var div_race; //wrapper for races divs

//@TODO: make parsing this from socket
var game_limit = 3000; //limit of points, who will first reach this - will win the game


//@TODO: remove this horrible peace of shit
var firstPlayerNum = 1;

//Send messages to server
function send(type, val) {
    socket.emit(type, val);
}


function setStatus(text) {
    div_status.textContent = text;
}

document.addEventListener('DOMContentLoaded', function () {
    socket = io(socket_host, socket_args);

    //Load divs
    div_race = document.getElementById('race');
    div_score = document.getElementById('score');
    div_status = document.getElementById('status');

    //Ask for players
    send('get players');

    //Get current players
    socket.on('current players', function (data) {
        console.log("GOT PLAYERS");

        var amount = data.amount;

        //Check if we are displaying all players
        var i = firstPlayerNum;
        while (i <= amount) {
            //If we aren't watching for this player
            if (!players[i]) {
                //Create player object
                var player = {};

                //Create player div
                player.div = document.createElement('div');
                player.div.textContent = "Игрок " + i + ": ";

                //Create div for this player's score
                var div_tscore = document.createElement('div');
                div_tscore.id = 'score' + i;
                player.div.appendChild(div_tscore);
                player.div_score = div_tscore;

                //Append player div to global score's table
                div_score.appendChild(player.div);

                //Remember player's score
                player.score = data.players[i].score;
                player.div_score.textContent = player.score;

                //Save player to players object
                players[i] = player;

                //Update player icon in races wrap
                var div_trace = document.createElement('div');
                addClass(div_trace, "player");
                div_trace.style.top = ((i - 1) * 60) + 'px';
                //div_trace.style.background = getRandomColor();
                div_trace.style.background = 'url(img/view/player' + i + '.gif) center no-repeat';
                div_race.appendChild(div_trace);
                div_race.style.height = (i * 60) + 'px';

                players[i].div_race = div_trace;
            }

            i++;
        }
    });

    //Listen for score
    socket.on('score', function (data) {
        var i = data.username;
        players[i].score += data.val;
        players[i].div_score.textContent = players[i].score;

        //Move player in race wrapper
        var left = (players[i].score * 100) / game_limit; //div_race.clientWidth;


        if(left > 50){
            players[i].div_race.style.left = 'calc(' + left + '%' + ' - 60px)';
        }else{
            players[i].div_race.style.left = left + "%";
        }
    });

    //Add listener for game over
    socket.on('end', function (data) {
        resetGame();

        //Inform player about this
        setStatus("Победил игрок #" + data.winner);
    });
});


function addClass(el, className) {
    if (el.classList) {
        el.classList.add(className);
    }
    else {
        el.className += ' ' + className;
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function resetGame(){
    div_score.innerHTML = "";

    players = {};
}