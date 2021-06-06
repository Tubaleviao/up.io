var UpIoFileUpload = function(socket){
  this.socket = socket;
  this.parallelFiles = 5;
  this.resetFileInputs = true;
	this.chunkSize = 1024 * 100;
}

UpIoFileUpload.prototype.listenInput = function(inpt) {
  if (!inpt) return;
  
  var chunkSize = this.chunkSize;
  var socket = this.socket;
  var files = [], file_info = [];
  var chunksQueue = [], first = true;
	
  var emitChunk = function(){
    var indexx = Math.floor(Math.random() * chunksQueue.length);
    var chunk = chunksQueue[indexx];
    chunksQueue.splice(indexx, 1)
    const data = {file: file_info[chunk.file_id][chunk.num], chunk: chunk.chunk}
    socket.emit("up_chunk", data);
  }
  
  var startSendingFile = function (file, id){
    const { size, name, } = file
    var iter = Math.ceil(size / chunkSize);
    for(var i=0; i < iter; i++){
      var end = (i+1)*chunkSize;
      var blob = file.slice(i*chunkSize, end);
      if(!file_info[id]){file_info[id] = []}
      file_info[id][i] = { name, id, size, chunk_total: iter, chunk_num: i, chunk_size: chunkSize };
      var reader = new FileReader();
      reader.readAsArrayBuffer(blob);
      reader.onload = (function(p) {
          return function(e) {
            chunksQueue.push({file_id: p.id.valueOf(), num: p.i.valueOf(), chunk: this.result});
            if(p.i === 0 && first){emitChunk(); first=false;}
          };
      })({ id, i });
    }
  }
  
  var treatFiles = function (event) {
    var fileList = event.target.files || event.dataTransfer.files;
    var iter = this.parallelFiles;
    event.preventDefault()

    for(var i=0; i<fileList.length; i++)
      files.push(fileList[i])

    if(fileList.length < iter)
      iter = fileList.length

    for(var j=0; j<iter; j++)
      startSendingFile(files.pop(), j);
    
    if(this.resetFileInputs)
      inpt.value = ""; // reset files in the input
    
	}.bind(this);
  
  socket.on("up_completed", function(data){
    if(files.length > 0) 
      startSendingFile(files.pop(), data.file_id);// start next file
    else cleanQueue()
    socket.emit("up_completed", data);
  });
	
	socket.on("up_started", function(data){ socket.emit("up_started", data) });
	
	socket.on("up_abortOne", function(id){
		chunksQueue = chunksQueue.filter(c => c.file_id != id )
    socket.emit("up_abortedOne", id)
  });
	
	socket.on("up_aborted", function(){ cleanQueue() });

  const cleanQueue = () => {
    chunksQueue = [];
		first = true;
		files = [];
		file_info = [];
  }
  
  socket.on("next chunk", function(){
    if(chunksQueue.length > 0){
      emitChunk();
    }
  });
	
	socket.emit("up_init");
  
  inpt.addEventListener("change", treatFiles.bind(this));
  
};

