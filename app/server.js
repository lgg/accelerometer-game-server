//System vars
var http = require('http'); //http module from node.js
var staticserver = require('node-static'); //http server for serving static files
var log = require('./log.js'); //log module(see log.js for more)
var server = false; //http server
var server_socket = false; //http server
var io = false; //socket.io server
// var players = {}; //array of players.sockets
var players = {}; //array of players
var players_sockets = [];
var viewers = []; //array of viewers.sockets
var game_finished = false;


//App settings
var currentPlayers = 0;
var maxPlayers = 4 + currentPlayers; //max players in one game
//@TODO: remove this horrible peace of shit
//@TODO: bug, when started count from 1 - first player doesn't receive gamestart event
var port = process.env.PORT; //port on which we will serve the game
var port_socket = process.env.PORT; //port on which socket server will start
var game_limit = 3000; //limit of points, who will first reach this - will win the game


//Create static serving server from 'client' folder
/*
var file = new staticserver.Server('./client');

server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();

    //Start socket.io server
    //startSocket(server);
}).listen(port);


 //If we have error - die
 server.once('error', function (err) {
 if (err.code === 'EADDRINUSE') {
 // port is currently in use
 log.error("Can't start the server. Port is busy.");
 } else {
 log.error(err.code);
 }

 server.close();
 process.exit(1);
 });



*/








var app = require('express')();
var sserver = require('http').Server(app);
startSocket(sserver);

sserver.listen(port_socket);

// app.use(require('express').static('client'));

app.use('/', require('express').static(__dirname + '/client'));


// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/client/index.html');
// });



//If we have error - die
sserver.once('error', function (err) {
    if (err.code === 'EADDRINUSE') {
        // port is currently in use
        log.error("Can't start the server. Port is busy.");
    } else {
        log.error(err.code);
    }

    sserver.close();
    process.exit(1);
});


//Start socket.io server
function startSocket(server) {
    log.log("Starting socket");

    //Start socket.io server
    var options = {
        pingTimeout: 3000,
        pingInterval: 3000,
        transports: ['websocket'],
        allowUpgrades: false,
        upgrade: false,
        cookie: false
    };
    io = require('socket.io')(server, options);

    //Turn off limit of connections
    server.setMaxListeners(0);


    io.on('connection', function (socket) {

        //Turn off limit of connections
        socket.setMaxListeners(0);

        //When user tries to register for playing in game
        socket.on('register', function () {
            var response = {};
            if (currentPlayers < maxPlayers) {
                currentPlayers++;
                response.username = currentPlayers;

                players[currentPlayers] = {
                    score: 0
                };

                players_sockets.push(socket);

                socket.join('players');
            } else {
                response.username = false;
            }

            //Check if we have enough players and we can start a game
            if (currentPlayers === maxPlayers) {
                // io.emit('start game');
                setTimeout(function () {
                    //socket.emit('start game');
                    //socket.broadcast.emit('start');
                    //io.emit('start');
                    //io.sockets.emit('start', true);

                    io.emit('start');
                    io.sockets.emit('start', true);
                    players_sockets.forEach(function (s) {
                        s.emit('start', true, function (err, success) {
                            if (err) {
                                console.log(err);
                                s.emit('start');
                            }
                            s.on('error', function () {
                                s.emit('start');
                            });
                        });
                    });

                    //@TODO: fix below
                    io.to('players').emit('start');

                    //log.success("Send to players");

                    // log.success("Game started!");
                }, 1500);
            } else {
                log.error("Not enough players");
            }

            socket.emit('registered', response);

            //@TODO: tell about them to viewers
            tellAboutPlayers();
        });

        //When user sends game move results, resend them to all clients
        //@TODO: send only to viewers
        socket.on('game move', function (data) {
            // var response = {};
            // response.username = data.username;
            // response.val = data.val;

            //Debug mode
            log.log('resend: ' + data.val + ' from user #' + data.username);

            //Update player's score
            players[data.username].score += data.val;

            //If player won
            if (players[data.username].score >= game_limit) {
                //Set game vars to finished
                game_finished = true;
                players.winner = data.username;

                //Tell to all that game's over
                io.emit('end', {winner: data.username});
                io.to('viewers').emit('end', {winner: data.username});
                /*io.on('error', function () {
                    io.emit('end', {winner: data.username});
                });*/
            }

            //Send update to viewers
            io.to('viewers').emit('score', data);
            /*io.on('error', function () {
                io.emit('score', data);
                io.to('viewers').emit('score', data);
            });
            viewers.forEach(function(s) {
                s.emit('score', data);
            });*/
        });

        //Send active players to viewers
        socket.on('get players', function () {
            socket.join('viewers');
            viewers.push(socket);

            tellAboutPlayers();
        });

        function tellAboutPlayers() {
            var response = {};
            response.amount = currentPlayers;
            response.players = players;

            //@TODO: to get it work when: view opened -> player connected
            // io.emit('current players', response);
            io.to('viewers').emit('current players', response);

            /*io.on('error', function () {
                io.emit('current players', response);
                io.to('viewers').emit('current players', response);
            });

            viewers.forEach(function(s) {
                s.emit('current players', response);
            });*/
        }


        // //@ToDO: add removing socket from sockets array
        // socket.on('disconnect', function () {
        //     if (addedUser) {
        //         --numUsers;
        //
        //         delete sockets[socket.username];
        //
        //         // echo globally that this client has left
        //         socket.broadcast.emit('user left', {
        //             username: socket.username,
        //             numUsers: numUsers
        //         });
        //
        //         addedUser = false
        //     }
        // });

        // log.success('it works!!');
        // socket.on('msg', function (data) {
        //     log.log(data);
        // });
    });
}