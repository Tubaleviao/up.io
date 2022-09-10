$(document).ready(() => {
  var socket = io();
  var uploader = new UpIoFileUpload(socket);
  //uploader.parallelFiles = 5;
  //uploader.chunkSize = 1024 * 100;
  //uploader.resetFileInputs = true;
  uploader.listenInput(document.getElementById("upio_input"));
  
  socket.on('up_started', function(data){
    console.log(data);
  });
  socket.on('up_progress', function(data){
    console.log(data.file_name+": "+data.percent+"%");
  });
  socket.on('up_aborted', function(data){
    console.log('Aborted!');
  });
  socket.on('up_completed', function(data){
    console.log(data.file_name+" Completed!");
    const elem = document.createElement('p')
    elem.append(data.file_name+" Completed!")
    document.getElementById("uploaded").appendChild(elem)
  });
})



