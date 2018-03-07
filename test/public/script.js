var socket = io.connect();
var uploader = new UpIoFileUpload(socket);
//uploader.parallelFiles = 5;
//uploader.chunkSize = 1024 * 100;
//uploader.resetFileInputs = true;

(function() {
    var state = document.readyState;
    if(state === 'interactive' || state === 'complete') {
      uploader.listenInput(document.getElementById("upio_input")); // pass html element only after page complete loaded
      socket.on('up_progress', function(data){
        console.log(data.file_name+": "+data.percent+"%");
        if(data.percent >= 0.5){
          socket.emit("up_abort");
        }
      });
      socket.on('up_aborted', function(data){
        console.log('Aborted!');
      });
    }
    else setTimeout(arguments.callee, 100);
})();



