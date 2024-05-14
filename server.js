// imports for webserver
// need express package
// express is a tool to create webserver
const express = require("express");
const { createServer } = require("node:http");

// create a webserver
const app = express();
// subfolder to serve web pages
app.use(express.static("public"));
const server = createServer(app);

// start the webserver on port 3000
server.listen(3000, () => {
  console.log("webserver started: http://localhost:3000");
});


// setup socket server
const { Server } = require("socket.io");
// start socket server on webserver
const io = new Server(server);
console.log(`socket server at ${io.path()}`);


/*
// listen for new connections
io.on("connection", (socket) => {
  // log the id of each new client
  console.log(`👋 connect ${socket.id}`);
});
*/

// ====================================================================================

// track players
let players = [];

// send all players' information to a new player
function sendPlayersData(socket) {
  for (let playerId in players) {
    socket.emit('playerConnected', {
      id: playerId,
      x: players[playerId].x,
      y: players[playerId].y,
    });
  }
}


// listen for new connections
io.on("connection", (socket) => {

    // log the id of each new client
    console.log(`👋 connect ${socket.id}`);


    // create random starting position for the player
    const x = Math.floor(Math.random() * 800);
    const y = Math.floor(Math.random() * 800);

    // store position
    players[socket.id] = {
      x: x,
      y: y,
    };

    sendPlayersData(socket);

    // send id and positon to all clients
    socket.broadcast.emit('playerConnected', {
      id: socket.id,
      x: x,
      y: y,
    });

    

    // listen for movement from the client
    socket.on('playerMovement', (data) => {
      // Update the player's position
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;

      // broadcast updates to all clients
      io.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
    });

    // disconnect events
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      // remove player
      delete players[socket.id];

      // broadcast disconnection to all clients
      io.emit('playerDisconnected', socket.id);
    });
    


  });

  


