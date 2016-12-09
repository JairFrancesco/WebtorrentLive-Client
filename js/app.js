'use strict';


(function() { 
  // This is the bare minimum JavaScript. You can opt to pass no arguments to setup.
  // e.g. just plyr.setup(); and leave it at that if you have no need for events
  var instances = plyr.setup({
    // Output to console
    debug: true
  });
  
  var video = instances[0].getMedia();

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
    buffer,
    codecs,
    codecsArray,
    resetTransmuxer = false,
    combined = true;

  var mimeCodec = 'video/mp4; codecs="avc1.64001f,mp4a.40.5"';

  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    var mediaSource = new MediaSource;
    video.src = URL.createObjectURL(mediaSource);
    window.vjsMediaSource = mediaSource;  
    mediaSource.addEventListener('sourceopen', sourceOpen);
  } else {
    console.error('Unsupported MIME type or codec: ', mimeCodec);
  }

  codecs = mimeCodec;

  function sourceOpen(_){
    mediaSource = this;
    buffer = mediaSource.addSourceBuffer(mimeCodec);
    window.vjsBuffer = buffer;
};

function appendStream(err, buffer)
{
  if (err) throw err;
  console.log(buffer);
  var segment = new Uint8Array(buffer),
      combined = true,
      outputType = 'combined',
      resetTransmuxer = false,
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
  }
  transmuxer.push(segment);
  transmuxer.flush();
}

function playChunk(torrentId)
{
  if (!(torrentId in addedTorrents)) {
  var torrentObject = client.add(torrentId, function (torrent) {
		    addedTorrents[torrentId] = torrent;
		    var file = torrent.files[0];
		    console.log("PLAY CHUNK!!");
		    file.getBuffer(function(err, buffer){
		      appendStream(err, buffer);
		    });
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

})();
