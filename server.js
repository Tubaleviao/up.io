var path = require("path"),
  fs = require("fs");

var UpIoFileUpload = function(){
  
  this.maxFileSize = null; // max file size permitted
  var dir = ""; // folder path to save files (current folder as deffault)
  var chunkFiles = []; // array of files being uploaded
  var chunksLoaded = [];
  
  var writeFile = function (socket, data){
    console.log("writing file");
    
    var saving = fs.createWriteStream(path.join(__dirname, dir, data.file.name)); // create write stream
    
    var itemsProcessed = 0;
    //chunkFiles[data.file.id].forEach(function(buff, index, array){ // select chunk by chunk
    for(var i=1; i<=chunkFiles[data.file.id].length; i++){
      var buff = chunkFiles[data.file.id][i];
      console.log("id: "+data.file.id+" chunk: "+i);
      saving.write(buff, () => { // start writing
        itemsProcessed++;
        console.log("index: "+i+" array.length: "+chunkFiles[data.file.id].length);
        if(itemsProcessed === chunkFiles[data.file.id].length) { // check if it's all writen
          console.log("writen");
          socket.emit("completed", {file_id: data.file.id}); // emit complete event
          saving.close();
          chunkFiles.splice(data.file.id, 1); // delete array
          console.log("file id deleted: "+data.file.id);
        }
      });
    }
    //});
  }
  
  var chunk = function (socket, data){ // TODO: check when the chunks stop arriving
    if(!chunkFiles[data.file.id]){
      chunkFiles[data.file.id] = [];
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
      chunksLoaded[data.file.id] = 1;
      console.log("1file id: "+data.file.id+" total: "+data.file.chunk_total+
                  " chunksLoaded: "+chunksLoaded[data.file.id]+" chunk_num: "+data.file.chunk_num);
    }else if(chunksLoaded[data.file.id] < data.file.chunk_total){
      chunksLoaded[data.file.id]++;
      console.log("1file id: "+data.file.id+" total: "+data.file.chunk_total+
                  " chunksLoaded: "+chunksLoaded[data.file.id]+" chunk_num: "+data.file.chunk_num);
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
    }else{
      chunksLoaded[data.file.id]++;
      console.log("1file id: "+data.file.id+" total: "+data.file.chunk_total+
                  " chunksLoaded: "+chunksLoaded[data.file.id]+" chunk_num: "+data.file.chunk_num);
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
      console.log();
      writeFile(socket, data);
    }
    socket.emit("next chunk");
  }
  
  var abort = function(data){
    if(data.file){
      chunkFiles[data.file.id].close();
      fs.unlink(path.join(__dirname, dir, data.file.name));
      chunkFiles.splice(data.file.id, 1);
      console.log("aborted upload");
     }
  }
  
  this.listen = function (socket) {
    socket.on("up_chunk", function(data){chunk(socket, data)});
		socket.on("disconnect", function(data){abort(data)});
    socket.on("abort", function(data){abort(data)});
	};
}

UpIoFileUpload.router = function (req, res, next) {
	if (req.url === "/upio/client.js") {
    fs.createReadStream(__dirname + "/client.js", "UTF-8").pipe(res);
	}
	else {
		next();
	}
};

module.exports = UpIoFileUpload;