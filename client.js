function UpIoFileUpload(pf){
  this.parallelFiles = pf;
  this.resetFileInputs = true;
	this.useText = false;
	this.serializedOctets = false;
	this.useBuffer = true;
	this.chunkSize = 1024 * 100; 
}

UpIoFileUpload.prototype.listenInput = function(obj) {
  // TODO
  // take files path and start sending chuncks to server
  
  // send data object as {file: {id: 1, name: test.mp3, ...}, chunk: ??? }
};

UpIoFileUpload.prototype.sendFiles = function(files) {
  // TODO
  // start sending files from an given array of files
};

module.exports = UpIoFileUpload;