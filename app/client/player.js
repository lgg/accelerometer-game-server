var socket_host = window.location.origin;
var socket_args = {
    transports: ['websocket'],
    upgrade: false,
    cookie: false
};
var socket = io(socket_host, socket_args); //Socket io listener

var minStep = 7; //min value for y change
var last = false; //last value for gyroscope
var current; //current value for gyroscope
var username = false; //username for this player
var gn;
var gnArgs = {
    frequency: 150,
    decimalCount: 0,
    gravityNormalized: true
};
var Promise = Promise || ES6Promise.Promise; //fix for promises
var div_status; //div for logging to user

// send('add user',)
//localStorage.debug = '*';
/**
 * Socket.io emit
 * @param type - type of message
 * @param val - value of message
 */
function send(type, val) {
    socket.emit(type, val);
}

function setStatus(text) {
    div_status.textContent = text;
}


document.addEventListener('DOMContentLoaded', function () {
    //Load divs
    div_status = document.getElementById('status');

    setStatus("test");

    //Start GyroWatcher
    gn = new GyroNorm();
    gn.init(gnArgs).then(function () {
        //Check if device support device acceleration
        if (true || gn.isAvailable(GyroNorm.ACCELERATION)) {
            registerUser();
            // setStatus("Trying to register you");
            setStatus("Пытаемся тебя зарегистрировать");
        } else {
            // setStatus("Sorry, your device isn't supported");
            setStatus("Извини, твоё устройство не поддерживается");
        }
    }).catch(function (e) {
        // setStatus("Sorry, your device isn't supported");
        setStatus("Извини, твоё устройство не поддерживается");
    });

    //Init vibration
    initVibration();
});


function registerUser() {
    send('register');

    //Check if we have successfully registered
    socket.on('registered', function (data) {
        if (data.username) {
            console.log('UserName' + data.username);

            //Remember username
            username = data.username;

            //If we have successfully registered than startGame and show player number/nickname
            setStatus("Ты игрок номер: " + data.username);
            // setStatus("You are player number: " + data.username);

            /*//Add listener for start game event
             socket.on('start game', function () {
             console.log("STARTED");
             setStatus("TRY PLAYING");
             // ^ Debug

             //StartGame
             startGame();
             });*/
        } else {
            // setStatus("Sorry, there's already too much players");
            setStatus("Извини, уже достаточно игроков");
            //@TODO: add link to viewers
            //@TODO: add autowatcher for reconnect/queue
        }
    });

    //Add listener for start game event
    socket.once('start', function () {
        console.log("start needed");

        if (username) {
            console.log("STARTED");
            setStatus("TRY PLAYING");
            // ^ Debug

            //StartGame
            startGame();
        } else {
            setStatus("No userName");
            console.log("No username");
        }
    });

    //Add listener for game over
    socket.on('end', function (data) {
        //End game
        finishGame();


        //Inform player about this
        notify();

        //Check if we are winner or loser
        var winner = data.winner;
        if(username == winner){
            // setStatus("Winner is you! Congratulations! You are user #" + winner);
            setStatus("Поздравляем, ты победил! Твой номер #" + winner);
        }else{
            // setStatus("Sorry, you lose. Winner is player #" + winner);
            setStatus("Прости, в этот раз не повезло. Выиграл игрок #" + winner);
        }
    });
}

function startGame() {
    gn.start(function (data) {

        current = Math.abs(data.dm.y);
        if (current !== 0 && current !== last && current > minStep) {
            send("game move", {
                username: username,
                val: current
            });
            last = current;
        }

        // Process:
        // data.do.alpha    ( deviceorientation event alpha value )
        // data.do.beta     ( deviceorientation event beta value )
        // data.do.gamma    ( deviceorientation event gamma value )
        // data.do.absolute ( deviceorientation event absolute value )

        // data.dm.x        ( devicemotion event acceleration x value )
        // data.dm.y        ( devicemotion event acceleration y value )
        // data.dm.z        ( devicemotion event acceleration z value )

        // data.dm.gx       ( devicemotion event accelerationIncludingGravity x value )
        // data.dm.gy       ( devicemotion event accelerationIncludingGravity y value )
        // data.dm.gz       ( devicemotion event accelerationIncludingGravity z value )

        // data.dm.alpha    ( devicemotion event rotationRate alpha value )
        // data.dm.beta     ( devicemotion event rotationRate beta value )
        // data.dm.gamma    ( devicemotion event rotationRate gamma value )
    });

    //Log that we are playing
    setStatus("PLAYING");

    //Inform players to start
    notify();
}

function finishGame() {
    //Stop listening y changes
    gn.stop();
}

function initVibration() {
    //Try to enable vibration support
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

    if (!navigator.vibrate) {
        setStatus("Your device doesn't support vibration");
    }
}


function notify() {
    //If we can vibrate then use it
    if (navigator.vibrate) {
        //Vibrate for 1 sec
        navigator.vibrate(1000);
    }
}