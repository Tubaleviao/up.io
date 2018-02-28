function UpIoFileUpload(socket){
  this.parallelFiles = 5;
  this.resetFileInputs = true;
	this.chunkSize = 1024 * 100; 
}

UpIoFileUpload.prototype.listenInput = function(inpt) {
  
  if (!inpt.files) return;
  
  var _listenTo = function (object, eventName, callback) {
		object.addEventListener(eventName, callback, false);
	};
  
  var _fileSelectCallback = function (event) {
    var files = event.target.files || event.dataTransfer.files;
    event.preventDefault();
    for(var i=0; i < this.parallelFiles; i++){
      process.stdout.write(`this is the file obj: ${files.pop()}\n`);
      // should emit first chunk to server and start upload "up_start"
    }

    // TODO: reset html input
	};
  
  _listenTo(inpt, "change", _fileSelectCallback);
  // TODO
  // take files path and start sending chuncks to server
  
  // send data object as {file: {id: 1, name: test.mp3, ...}, chunk: ??? }
};

UpIoFileUpload.prototype.sendFiles = function(files) { // may not be used
  // TODO
  // start sending files from an given array of files
  process.stdout.write(`files: ${files} \n`);
  
};

module.exports = UpIoFileUpload;