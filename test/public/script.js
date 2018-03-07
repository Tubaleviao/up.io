var socket = io.connect();
var uploader = new UpIoFileUpload(socket);
//uploader.parallelFiles = 5;
//uploader.chunkSize = 1024 * 100;
//uploader.resetFileInputs = true;

(function() {
    var state = document.readyState;
    if(state === 'interactive' || state === 'complete') {
      uploader.listenInput(document.getElementById("upio_input")); // pass html element only after page complete loaded
    }
    else setTimeout(arguments.callee, 100);
})();



