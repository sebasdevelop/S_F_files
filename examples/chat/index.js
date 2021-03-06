// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Servidor escuchando en el puerto %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

socket.on('notification', function (data) {
   
   socket.broadcast.emit('notification', data); 

  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    /*socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });*/

    /* io.sockets.in(data.room).emit('new message', {
      username: socket.username,
      message: data
    });*/

   socket.broadcast.to(data.room).emit('new message', {
     	username: socket.username,
        message: data.message
    }); 

  });

	/* socket.on('send', function(data) {
       // console.log('sending message');
        io.sockets.in(data.room).emit('message', data);

        socket.broadcast.to(data.room).emit('conversation private post', {
        message: data.message
    }); 

    });  */

    socket.on('subscribe', function(room) { 
      //  console.log('joining room', room);
        socket.join(room); 
    })

    socket.on('unsubscribe', function(room) {  
      //  console.log('leaving room', room);
        socket.leave(room); 
    })

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (data) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = data.username;
    socket.room=data.room;
    ++numUsers;
    addedUser = true;
    
    socket.emit('login', {
      numUsers: numUsers
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.to(socket.room).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.to(socket.room).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.to(socket.room).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(socket.room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
