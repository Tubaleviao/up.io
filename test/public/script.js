$(document).ready(function(){

  var socket = io.connect();
  var uploader = new SocketIOFileUpload(socket);
  uploader.listenOnInput(document.getElementById("siofu_input"));
  
});