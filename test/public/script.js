var socket = io.connect();
var uploader = new UpIoFileUpload(socket);

(function() { 
    var state = document.readyState;
    if(state === 'interactive' || state === 'complete') {
      uploader.listenInput(document.getElementById("upio_input")); // pass html element only after documentis complete loaded
    }
    else setTimeout(arguments.callee, 100);
})();



