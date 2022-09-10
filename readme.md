# up.io
## installation
go to your project folder and run:

```npm install up.io --save```

Inside your server app, add the following code:

```
var upio = require('up.io');
var app = express();
app.use(upio.router);
```

Inside your Socket connection, add the lines:

```
io.on("connection", function(socket){
    var uploader = new upio();
    //uploader.dir = "path/to/save/uploads"; // optional
    uploader.listen(socket);
});
```

Add to your client-side web-page header this script (try to call up.io before socket.io):

```<script src="/upio/client.js"></script>```

Insert the input tag in your HTML page:

```<input id="upio_input" type="file" multiple>```

After that, your javascript should give up.io the element like this:

```
var socket = io.connect();
var uploader = new UpIoFileUpload(socket);

// defaults:
// uploader.parallelFiles = 5;
// uploader.chunkSize = 1024 * 100;
// uploader.resetFileInputs = true;

uploader.listenInput(document.getElementById("upio_input")); 

// make sure this code runs after the page is completely loaded,
// using something like the $(document).ready function (see example)

```

The commented line code are optional parameters. After these steps, the uploader should work.

## client-side socket events

Events that can be handled by the client-side javascript.

### start

When the file start to being uploaded, the "up_started" call will be fired:

```
socket.on('up_started', function(data){
	console.log("Music id which started: "+data.id);
})
```

### progress

While the file is being uploaded, the progress can be viewed like this:

```
socket.on('up_progress', function(data){
	console.log(data.file_name+": "+data.percent+"%");
	//data: {file_name: "test.mp3", percent: 0.5, file_size: 3293843, loaded: 2394058, file_id: 0}
      });
```

### complete

When a file is completed sent to the server, up.io emits the "completed" socket event. It can be handle like this: 

```
socket.on("up_completed", function(data){
    console.log("Completed!"); // data: {file_id: 1, file_name: test.mp3}
});
```

### abort

To abort any ongoing upload, just emit "abort":

```socket.emit("up_abort");```

If abort succeded, up.io will return the "aborted" call:

```
socket.on("up_aborted", function(){
    console.log("All aborted!"); // all uploads aborted
});
```

## server-side socket events

Events that can be handled by the server socket connection.

### chunk

When a chunk of a file is sent to the server, it can be viewed by the folowing code:

```
socket.on("up_chunk", function(data){
	console.log(JSON.stringfy(data.file)); 
	// structure: {name: "test.mp3", id: 0, size: 1902834, chunk_total: 35, chunk_num: 10};
});
```

## velocity

Up.io was able to transfer a file of 5.166 KB in 11.6 seconds under a 6.82 Mbps upload connection.

## that's all

Basically that's all. Further implementations are comming as they're needed.

Pull requests are welcome.
