var UpIoFileUpload = function(socket){
  this.socket = socket;
  this.parallelFiles = 5;
  this.resetFileInputs = true;
	this.chunkSize = 1024 * 100;
}

UpIoFileUpload.prototype.getChunkSize = function(){
  return this.chunkSize;
}

// TODO: UpIoFileUpload.prototype.setOptions = function(options)

UpIoFileUpload.prototype.listenInput = function(inpt) {
  if (!inpt) return;
  
  var chunkSize = this.getChunkSize();
  var socket = this.socket;
  var readers = [], files = [], file_info = [];
  var chunksQueue = [], first = false;
  
  var emitChunk = function(){
    var indexx = Math.floor(Math.random() * chunksQueue.length);
    var chunk = chunksQueue[indexx];
    chunksQueue.splice(indexx, 1);
    //console.log("file_id: "+chunk.file_id+" chunk_num: "+chunk.num+" index: "+indexx+" length: "+chunksQueue.length  );
    socket.emit("up_chunk", {file: file_info[chunk.file_id][chunk.num], chunk: chunk.chunk});
  }
  
  var startSendingFile = function (file, id){
    var iter = Math.ceil(file.size / chunkSize);
    for(var i=0; i < iter; i++){
      var end = (i+1)*chunkSize;
      var blob = file.slice(i*chunkSize, end);
      if(!file_info[id]){file_info[id] = []}
      file_info[id][i] = {name: file.name, id: id, size: file.size, chunk_total: iter, chunk_num: i};
      var reader = new FileReader();
      reader.readAsArrayBuffer(blob);
      reader.onload = (function(p) {
          return function(e) {
            chunksQueue.push({file_id: p.id.valueOf(), num: p.i.valueOf(), chunk: this.result});
            if(p.i === 0 && first){emitChunk(); first=false;}
          };
      })({id: id, i: i});
    }
  }
  
  var treatFiles = function (event) {
    var fileList = event.target.files || event.dataTransfer.files;
    var iter = this.parallelFiles;
    event.preventDefault();
    for(var i=0; i<fileList.length; i++){
      files.push(fileList[i]);
    }
    if(fileList.length < iter){
      iter = fileList.length;
    }
    for(var j=0; j<iter; j++){
      startSendingFile(files.pop(), j);
    }
    first = true;
    
    if(this.resetFileInputs){
      inpt.value = ""; // reset files in the input
    }
    
	}.bind(this);
  
  this.socket.on("completed", function(data){
    //console.log("completed");
    if(files.length > 0){
      startSendingFile(files.pop(), data.file_id);// start next file
    }
  });
  
  this.socket.on("next chunk", function(){
    if(chunksQueue.length > 0){
      emitChunk();
    }
  });
  
  inpt.addEventListener("change", treatFiles.bind(this), false);
};

