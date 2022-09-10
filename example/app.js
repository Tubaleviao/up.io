var express = require('express');
var app = express();
const { join } = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var upio = require('../server'); // you should use up.io instead
const {existsSync, mkdirSync} = require('fs')
var port = process.env.PORT || 3001;

app.use(upio.router);
app.use(express.static(__dirname + '/public'));

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

io.on("connection", function(socket){
    var uploader = new upio();
    const dir = join('projects','up.io', 'example', 'files')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    uploader.dir = dir; // path/to/save/uploads (default: ./)
    uploader.listen(socket);
});

app.use(express.static(join(__dirname, 'public')));
