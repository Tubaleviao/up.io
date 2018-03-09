var path = require("path"),
  fs = require("fs");

var UpIoFileUpload = function(){
  
	this.dir = ""; // folder path to save files (current folder as deffault)
  var chunkFiles = []; // array of files being uploaded
  var chunksLoaded = [];
	var aborted = false;
	
	var init = function(){
		chunkFiles = [];
		chunksLoaded = [];
	}
  
  var writeFile = function (socket, data){
    //console.log("writing file"); // DEBUG
    var saving = fs.createWriteStream(path.join(__dirname, this.dir, data.file.name)); // create write stream
    var itemsProcessed = 0;
    for(var i=0; i<chunkFiles[data.file.id].length; i++){ // select chunk by chunk of the file
      var buff = chunkFiles[data.file.id][i];
      //process.stdout.write(`file_id: ${data.file.id} chunk: ${i}`); // DEBUG
      //process.stdout.write(` buff.length: ${buff.length}\n`);
      saving.write(buff, () => { // start writing
        itemsProcessed++;
        if(itemsProcessed === chunkFiles[data.file.id].length) { // check if it's all writen
          //console.log("writen"); // DEBUG
          saving.close();
          chunkFiles[data.file.id] = undefined; // reset the file_id array
          //console.log("file id deleted: "+data.file.id); // DEBUG
          socket.emit("up_completed", {file_id: data.file.id, file_name: data.file.name}); // emit complete event
        }
      });
    }
  }.bind(this)
  
  var chunk = function (socket, data){
    if(!chunkFiles[data.file.id]){ // if it's the first chunk, initialize the array
      chunkFiles[data.file.id] = [];
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
      chunksLoaded[data.file.id] = 1;
    }else if(chunksLoaded[data.file.id] < data.file.chunk_total-1){
      chunksLoaded[data.file.id]++;
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
			var result = {file_name: data.file.name, percent: (chunksLoaded[data.file.id]/data.file.chunk_total).toFixed(2)};
			result.file_size = data.file.size;
			result.loaded = chunksLoaded[data.file.id] * data.file.chunk_size;
			socket.emit("up_progress", result);
    }else{ // if it's the last chunk, write file
      chunksLoaded[data.file.id]++;
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
      writeFile(socket, data);
      //console.log("3file id: "+data.file.id+" total: "+data.file.chunk_total+" chunksLoaded: "+ // DEBUG
                  //chunksLoaded[data.file.id]+" chunk_num: "+data.file.chunk_num);
    }
    if(!aborted){
			socket.emit("next chunk");
		}else{
			aborted = false;
			init();
		}
  }
  
  var abort = function(socket){
		aborted = true;
		socket.emit("up_aborted");
		init();
  }
  
  this.listen = function (socket) {
		socket.on("up_init", function(data){init()});
    socket.on("up_chunk", function(data){chunk(socket, data)});
		socket.on("disconnect", function(data){init()});
    socket.on("up_abort", function(){abort(socket)});
    socket.on("error", function(){console.log("socket error");});
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