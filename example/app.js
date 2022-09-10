var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var upio = require('../server'); // you should use up.io instead
var port = process.env.PORT || 3001;

app.use(upio.router);
app.use(express.static(__dirname + '/public'));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

io.on("connection", function(socket){
    var uploader = new upio();
    uploader.dir = 'projects/up.io/test/files'; // path/to/save/uploads (default: ./)
    uploader.listen(socket);
});

app.use(express.static(path.join(__dirname, 'public')));