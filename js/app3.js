'use strict';

//var socket = io.connect('https://elearningp2p.ml:7000');
var connection = new WebSocket('ws://elearningp2p.ml:1337'); 

var cola = new Queue();
var client = new WebTorrent();
var appendedSegments = 0;
var addedTorrents = {};
var removedTorrents = [];

var
  $ = document.querySelector.bind(document),
  transmuxer,
  muxedData,
  video,
  mediaSource,
  logevent,
  prepareSourceBuffer;

logevent = function(event) {
  console.log(event.type);
};

prepareSourceBuffer = function(combined, outputType, callback) {
  var
    buffer,
    codecs,
    codecsArray,
    resetTransmuxer = false;

  if (typeof combined === 'function') {
    callback = combined;
    combined = true;
  }

  if (!resetTransmuxer && window.vjsBuffer) {
    return callback();
  }

  video = document.querySelector('#myvideo');
  video.controls = true;
  mediaSource = new MediaSource;
  video.src = URL.createObjectURL(mediaSource);
  window.vjsMediaSource = mediaSource;

  mediaSource.addEventListener('error', logevent);
  mediaSource.addEventListener('opened', logevent);
  mediaSource.addEventListener('closed', logevent);
  mediaSource.addEventListener('sourceended', logevent);

  var codecs = "avc1.64001f,mp4a.40.5";
  codecsArray = codecs.split(',');

  mediaSource.addEventListener('sourceopen', function () {
    mediaSource.duration = 0;
    if (combined) {
      buffer = mediaSource.addSourceBuffer('video/mp4;codecs="' + codecs + '"');
    } else if (outputType === 'video') {
      buffer = mediaSource.addSourceBuffer('video/mp4;codecs="' + codecsArray[0] + '"');
    } else if (outputType === 'audio') {
      buffer = mediaSource.addSourceBuffer('audio/mp4;codecs="' + (codecsArray[1] ||codecsArray[0]) + '"');
    }

    buffer.addEventListener('updatestart', logevent);
    buffer.addEventListener('updateend', function(){
	console.log("ended");
    });
    buffer.addEventListener('error', logevent);
    window.vjsBuffer = buffer;

    video.addEventListener('error', logevent);
    video.addEventListener('error', function() {
      document.getElementById('video-place').classList.add('error');
    });

    return callback();
  });
};

function appendStream(err, buffer)
{
  if (err) throw err;
  console.log(buffer);
  var segment = new Uint8Array(buffer),
      combined = true,
      outputType = 'combined',
      resetTransmuxer = false,//$('#reset-tranmsuxer').checked,
      remuxedSegments = [],
      remuxedInitSegment = null,
      remuxedBytesLength = 0,
      createInitSegment = false,
      bytes,
      i, j;
  if (resetTransmuxer || !transmuxer) {
    createInitSegment = true;
    if (combined) {
        outputType = 'combined';
        transmuxer = new muxjs.mp4.Transmuxer();
    } else {
        transmuxer = new muxjs.mp4.Transmuxer({remux: false});
    }

    transmuxer.on('data', function(event) {
      if (event.type === outputType) {
        remuxedSegments.push(event);
        remuxedBytesLength += event.data.byteLength;
        remuxedInitSegment = event.initSegment;
      }
    });

    transmuxer.on('done', function () {
      var offset = 0;
      if (createInitSegment) {
        bytes = new Uint8Array(remuxedInitSegment.byteLength + remuxedBytesLength)
        bytes.set(remuxedInitSegment, offset);
        offset += remuxedInitSegment.byteLength;
        createInitSegment = false;
      } else {
        bytes = new Uint8Array(remuxedBytesLength);
      }

      for (j = 0, i = offset; j < remuxedSegments.length; j++) {
        bytes.set(remuxedSegments[j].data, i);
        i += remuxedSegments[j].byteLength;
      }
      muxedData = bytes;
      remuxedSegments = [];
      remuxedBytesLength = 0;
      prepareSourceBuffer(combined, outputType, function () {
        console.log('appending...');
        window.vjsBuffer.appendBuffer(bytes);
	appendedSegments+=1;
	if (video.paused){
	        video.play();
	}
	if (!cola.isEmpty()){
		playChunk(cola.dequeue());
	}
      });
    });
  }
  transmuxer.push(segment);
  transmuxer.flush();
}

function playChunk(torrentId)
{
  //client.destroy();
  
  //var exits = addedTorrents.indexOf(torrentId);
  if (!(torrentId in addedTorrents)) {
  var torrentObject = client.add(torrentId, function (torrent) {
		    addedTorrents[torrentId] = torrent;
		    //addedTorrents.push(torrentId);
		    var file = torrent.files[0];
		    console.log("Play chunk!!");
		    file.getBuffer(function(err, buffer){
		      appendStream(err, buffer);
		    });
		    //muxedName = this.files[0].name.replace('.ts', '.f4m');
		 });
  }
}


// Alias for sending messages in JSON format 
function send(message) { 
   connection.send(JSON.stringify(message)); 
};

connection.onopen =  function() {
  console.log("Websocket connection open");
  //ws.send('something');
};

connection.onerror = function(err){
  console.log("WEBSOCKET ERROR: ", err);
};
 
connection.onmessage = function (message) { 
   console.log("Got message", message.data); 
   var data = JSON.parse(message.data); 
	
   switch(data.type) { 
      case "play": 
	 onPlayStream(data.torrent);
         break; 
      case "chunk":
	 onChunk(data.torrent);
      	 break;
      case 'remove-torrent':
	 onRemoveTorrent(data.torrent);
      default: 
         break; 
   } 
}; 

function onRemoveTorrent(torrent){
	//console.log("Removing torrent, ", torrent);
	//console.log("Added Torrents ", addedTorrents);
	console.log("Removed Torrents:", removedTorrents);
	var exits = removedTorrents.indexOf(torrent);
	if (exits<0 && (torrent in addedTorrents))
	{
		client.remove(addedTorrents[torrent], function(err){
			if (err) console.log("ERROR REMOVING TORRENT: ", err);
			console.log("Removed ", torrent, " from WebTorrent Client");	
			removedTorrents.push(torrent);
		});
	}
};

function onChunk(torrent){
  var torrentId = torrent;
  if (torrentId=="")
  {
    return; 
  }
  console.log(torrent);
  if (cola.isEmpty()){
  	playChunk(torrentId);
  }
  else {
	cola.enqueue(data) //Encolar el .torrent recibido
  }
};

function onPlayStream(data) {
  playChunk(data);
};

/*
function fixDuration(event)
{
	mediaSource.endOfStream();
	console.log(event.type);
	mediaSource.duration = 120;
	video.play();
	var myDuration = mediaSource.duration;
	if (myDuration>=2)
	{
		mediaSource.duration -=2;		
	}
}
*/
