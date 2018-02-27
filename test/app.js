var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var up = require('../server.js'); // you should use 'up.io'
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

io.on("connection", function(socket){
    var uploader = new up();
    uploader.dir = "/path/to/save/uploads";
    uploader.listen(socket);
});

app.use(express.static(path.join(__dirname, 'public')));