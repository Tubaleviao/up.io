var //util = require("util"),
  //EventEmitter = require("events").EventEmitter,
  path = require("path"),
  fs = require("fs");

var main_process = function(){
  
  self.dir = "./"; // folder path to save files (./ as deffault)
  self.maxFileSize = null; // max file size permitted
  self.savingFiles = []; // array of files being uploaded
  
  function startUpload(data){
    var fileInfo = data.file;
    var saving = fs.createWriteStream(path.join(__dirname, self.dir, data.file.name));
    saving.write(data.chunk);
    if (savingFiles[data.file.id] != null) {
      savingFiles.splice(data.file.id, 1);
    }
    savingFiles[data.file.id] = saving;
  }
  
  function chunk(socket, data){
    savingFiles[data.file.id].write(data.chunk, function(){
      if(savingFiles[data.file.id].bytesWritten === data.file.bytes){
        savingFiles[data.file.id].close();
        socket.emit("completed", {file_id: data.file.id});
        savingFiles.splice(data.file.id, 1);
      }
    });
  }
  
  function abort(data){
    savingFiles[data.file.id].close();
    fs.unlink(path.join(__dirname, self.dir, data.file.name));
    savingFiles.splice(data.file.id, 1);
  }
  
  this.listen = function (socket) {
		socket.on("up_start", function(data){startUpload(data)});
    socket.on("up_chunk", function(data){chunk(socket, data)});
		socket.on("disconnect", function(data){abort(data)});
    socket.on("abort", function(data){abort(data)});
	};
}

module.exports = main_process;