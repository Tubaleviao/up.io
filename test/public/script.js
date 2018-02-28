$(document).ready(function(){

  var socket = io.connect();
  var uploader = new UpIoFileUpload(socket);
  uploader.listenOnInput(document.getElementById("upio_input"));
  
});