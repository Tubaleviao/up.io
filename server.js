var util = require("util"),
  EventEmitter = require("events").EventEmitter,
  path = require("path"),
  fs = require("fs");

var main_process = function(){
  
  self.dir = "./"; // folder path to save files (./ as deffault)
  self.mode = "0666"; // permissions to save file
  self.maxFileSize = null; // max file size permitted
  self.savingFiles = [];
  
  function startUpload(data){
    var fileInfo = data.file;
    var saving = fs.createWriteStream(path.join(__dirname, self.dir, data.file.name));
    saving.write(data.chunk);
    savingFiles[data.file.id] = saving;
  }
  
  function chunk(data){
    savingFiles[data.file.id].write(data.chunk);
  }
  
  function abort(data){
    savingFiles[data.file.id].close();
    fs.unlink(path.join(__dirname, self.dir, data.file.name));
  }
  
  this.listen = function (socket) {
		socket.on("up_start", function(data){startUpload(data)});
    socket.on("up_chunk", function(data){chunk(data)});
		socket.on("disconnect", function(data){abort(data)});
	};
  
  this.abort = function (id, socket) {
	}
}

module.exports = main_process;