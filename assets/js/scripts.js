/*!
 * H5VF
 * HTML5 Video Framework
 * http://sarasoueidan.com/h5vf
 * @author Sara Soueidan
 * @version 1.0.0
 * Copyright 2013. MIT licensed.
 */
(function ($, window, document, undefined) {
    'use strict';

    $(function () {
        var video = document.getElementById('myvideo'),
            container = document.getElementById('custom-video'),
            playbutton = document.getElementById('playpause'),
            mutebutton = document.getElementById('mute'),
            fullscreenbutton = document.getElementById('fullscreen'),
            seek = document.getElementById('seekbar'),
            volume = document.getElementById('volumebar'),
            vval = volume.value,
            progressbar = document.getElementById('progressbar'),
            bufferbar = document.getElementById('bufferbar');        


    
        if(video.autoplay){
            playbutton.classList.add('icon-pause');
            playbutton.classList.remove('icon-play');
        }
        video.addEventListener('playing', function(){
            seek.classList.add('light');
        }, false);
    
        if(video.muted){
            mutebutton.classList.add('icon-volume');
            mutebutton.classList.remove('icon-volume-2');
            volume.value = 0;
        }
        else{
            mutebutton.classList.add('icon-volume-2');
            mutebutton.classList.remove('icon-volume');
        }
    
        
    
        function playpause(){
            if(video.paused){
                video.play();
                playbutton.classList.add('icon-pause');
                playbutton.classList.remove('icon-play');
                seek.classList.add('light');
            }
            else{
                video.pause();
                playbutton.classList.add('icon-play');
                playbutton.classList.remove('icon-pause');
                seek.classList.remove('light');
            }
        }
        
        playbutton.addEventListener('click', playpause, false);
        video.addEventListener('click', playpause, false);

        mutebutton.addEventListener('click', function(){
            if(video.muted){
                video.muted = false;
                mutebutton.classList.add('icon-volume-2');
                mutebutton.classList.remove('icon-volume');
                volume.value = vval;
            }
            else{
                video.muted = true;
                volume.value = 0;
                mutebutton.classList.add('icon-volume');
                mutebutton.classList.remove('icon-volume-2');
            }   
        }, false);
        
        var isFullscreen= false;
        fullscreenbutton.addEventListener('click', function() {
            if(!isFullscreen){
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } 
                else if (video.mozRequestFullScreen) {
                    container.mozRequestFullScreen(); // Firefox
                } 
                else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen(); // Chrome and Safari
                }
                isFullscreen=true;
                fullscreenbutton.classList.remove('icon-fullscreen-alt');
                fullscreenbutton.classList.add('icon-fullscreen-exit-alt');
            }
            else{

                if(document.cancelFullScreen) {
                    document.cancelFullScreen();
                } 
                else if(document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } 
                else if(document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
                isFullscreen=false;
                fullscreenbutton.classList.add('icon-fullscreen-alt');
                fullscreenbutton.classList.remove('icon-fullscreen-exit-alt');
            }
            
        }, false);

    
        //change video time when seek changes
        seek.addEventListener('change', function(){
            var time = video.duration * (seek.value/100);
            video.currentTime = time;
        }, false);

        seek.addEventListener('mousedown', function(){
            video.pause();
        }, false);
        seek.addEventListener('mouseup', function(){
            video.play();
            //if the user plays the video without clicking play, by starting directly with specifying a point of time on the seekbar, make sure the play button becomes a pause button
            playbutton.classList.remove('icon-play');
            playbutton.classList.add('icon-pause');
        }, false);

        //update progress bar as video plays
        video.addEventListener('timeupdate', function() { 
            var percent = Math.floor((100 / video.duration) * video.currentTime); 
            progressbar.value = percent; 
            progressbar.getElementsByTagName('span')[0].innerHTML = percent; 
        }, false);
        
        //change seek position as video plays
        video.addEventListener('timeupdate', function(){
            var value = (100/video.duration) * video.currentTime;
            seek.value = value;
        }, false);
        
        volume.addEventListener('change', function(){
            video.volume = this.value;
            vval = this.value;
            if(this.value === 0){
                video.muted = true;
                mutebutton.classList.add('icon-volume');
                mutebutton.classList.remove('icon-volume-2');
            }
            else if(this.value !== 0){
                video.muted = false;
                mutebutton.classList.add('icon-volume-2');
                mutebutton.classList.remove('icon-volume');
            }
        }, false);
        
        video.addEventListener('ended', function(){
            video.pause();
            video.currentTime = 0;
            playbutton.classList.add('icon-play');
            playbutton.classList.remove('icon-pause');
            seek.classList.remove('light');
        });

        
    });

})(jQuery, window, document);
