var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

server.listen(2000);
console.log("server started");

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id) {
  var self = {
    x: 250,
    y: 250,
    id: id,
    number: "" + Math.floor(10 * Math.random()),
    pressingRight: false,
    pressingLeft: false,
    pressingUp: false,
    pressingDown: false,
    maxSpeed: 10
  }
  self.updatePosition = function() {
    if(self.pressingRight) {
      self.x += self.maxSpeed;
    }
    if(self.pressingLeft) {
      self.x -= self.maxSpeed;
    }
    if(self.pressingUp) {
      self.y -= self.maxSpeed;
    }
    if(self.pressingDown) {
      self.y += self.maxSpeed;
    }
  }
  return self;
}

var io = require('socket.io')(server, {});
io.sockets.on('connection', function(socket) {
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;

  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;

  console.log('socket connection');

  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;

  socket.on('disconnect', function() {
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  });

  socket.on('keyPress', function(data) {
    if(data.inputId == 'left') {
      player.pressingLeft = data.state;
    }
    else if(data.inputId == 'right') {
      player.pressingRight = data.state;
    }
    else if(data.inputId == 'up') {
      player.pressingUp = data.state;
    }
    else if(data.inputId == 'down') {
      player.pressingDown = data.state;
    }
  })
});

setInterval(function() {
  var pack = [];
  for(var i in PLAYER_LIST) {
    var player = PLAYER_LIST[i];
    player.updatePosition();
    pack.push({
      x: player.x,
      y: player.y,
      number: player.number
    });
  }
  for(var i in SOCKET_LIST) {
    var socket = SOCKET_LIST[i];
    socket.emit('newPositions', pack);
  }
}, 1000/25);
