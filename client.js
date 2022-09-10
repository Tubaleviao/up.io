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
  let sending = []
	
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
    if(size === 0) iter = 1 // fix #11
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
    files = [...fileList]

    if(files.length < iter)
      iter = files.length

    for(var j=0; j<iter; j++){
      sending[j] = files.pop()
      startSendingFile(sending[j], j);
    }
    
    if(this.resetFileInputs)
      inpt.value = ""; // reset files in the input
    
	}.bind(this);

  socket.on("up_get_chunk", ({file_id, chunk_num}) => {
    const end = (chunk_num+1)*chunkSize;
    const blob = sending[file_id].slice(chunk_num*chunkSize, end);
    var reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onload = (function(p) {
        return function(e) {
          chunksQueue.push({file_id: p.id.valueOf(), num: p.i.valueOf(), chunk: this.result});
        };
    })({ id: file_id, i: chunk_num });
  } )
  
  socket.on("up_completed", function(data){
    if(files.length > 0){
      sending[data.file_id] = files.pop()
      startSendingFile(sending[data.file_id], data.file_id) // start next file
    } else sending[data.file_id] = undefined
    
    if(!sending.some( v => v)) cleanQueue()
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
    sending = [];
  }
  
  socket.on("next chunk", function(){
    if(chunksQueue.length > 0){
      emitChunk();
    }
  });
	
	socket.emit("up_init");
  
  inpt.addEventListener("change", treatFiles.bind(this));
  
};

