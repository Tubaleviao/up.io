const path = require("path"),
  fs = require("fs")

require('dotenv').config();

if (process.env.NODE_ENV !== 'upio_test') {
  console.debug = m => null
}

var UpIoFileUpload = function(){
  
	this.dir = ""; // folder path to save files (defaults to ./)
  var chunkFiles = []; // array of files being uploaded
  var chunksLoaded = [];
	var aborted = false;
	
	var init = function(){
		console.debug('init up.io')
		chunkFiles = [];
		chunksLoaded = [];
	}
  
  var writeFile = function (socket, data){
    console.debug("writing file "+data.file.name)
    if(!fs.existsSync(path.join(__dirname, `../../${this.dir}`))){
      fs.mkdir(path.join(__dirname, `../../${this.dir}`), err =>{
        if(err) console.error(err) // fix #1
      })
    }
    const dir = path.join(__dirname, `../../${this.dir}`)
    let p = path.join(dir, data.file.name)
    var saving = fs.createWriteStream(p); // create write stream
    
    var itemsProcessed = 0;
    for(var i=0; i<chunkFiles[data.file.id].length; i++){ // select chunk by chunk of the file
      var buff = chunkFiles[data.file.id][i];
      if(buff)
        saving.write(buff, () => { // start writing
          itemsProcessed++;
          if(itemsProcessed === chunkFiles[data.file.id].length) { // check if it's all writen
            saving.close();
            chunkFiles[data.file.id] = undefined; // reset the file_id array
            socket.emit("up_completed", {file_id: data.file.id, file_name: data.file.name, success: true})
            console.debug(`file saved at ${dir}` )
          }
        })
      else socket.emit("up_get_chunk", { file_id: data.file.id, chunk_num: i })
    }
  }.bind(this)
  
  var chunk = function (socket, data){
    if(!chunkFiles[data.file.id]){ // if it's the first chunk, initialize
      console.debug("upload started for "+data.file.name)
      console.debug(`total chunks: ${data.file.chunk_total}`)
      chunkFiles[data.file.id] = [];
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
      chunksLoaded[data.file.id] = 1;
			socket.emit("up_started", {id: data.file.id, size: data.file.size, loaded: 0, file: data.file.name}); // data.exists
    } else if(chunksLoaded[data.file.id] < data.file.chunk_total-1){
      chunksLoaded[data.file.id]++;
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk;
			var result = {file_name: data.file.name, percent: (chunksLoaded[data.file.id]/data.file.chunk_total).toFixed(2)};
			result.file_size = data.file.size;
			result.loaded = chunksLoaded[data.file.id] * data.file.chunk_size;
			result.file_id = data.file.id
			socket.emit("up_progress", result);
    }else{ // last chunk
      chunksLoaded[data.file.id]++;
      chunkFiles[data.file.id][data.file.chunk_num] = data.chunk
    }
    if(chunksLoaded[data.file.id] === data.file.chunk_total){ // fix #2
      writeFile(socket, data);
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
	
	var abortOne = function(socket, id){ 
		socket.emit("up_abortOne", id);
  }
	
	var abortedOne = function(socket, id){ 
		chunkFiles[id] = undefined;
		socket.emit("up_completed", {file_id: id, file_name: "", success: false, msg: "Upload aborted."}); // readme
  }
	
  this.listen = function (socket) {
		socket.on("up_init", function(){init()});
    socket.on("up_chunk", function(data){chunk(socket, data)});
		socket.on("disconnect", function(data){init()});
    socket.on("up_abort", function(){abort(socket)}); // readme
		socket.on("up_abortOne", function(id){abortOne(socket, id)}); // readme
		socket.on("up_abortedOne", function(id){abortedOne(socket, id)});
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
