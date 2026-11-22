(function(app){
  'use strict';

  app.createMusicPlayer=function(){
    var audio=document.getElementById('bgm');
    var button=document.getElementById('musicToggle');
    var control=document.getElementById('musicControl');
    var status=document.getElementById('musicStatus');
    var seek=document.getElementById('musicSeek');
    var elapsed=document.getElementById('musicElapsed');
    var durationLabel=document.getElementById('musicDuration');
    var track=document.getElementById('lyricsTrack');
    var cues=app.lyrics||[];
    if(!audio||!button||!control||!status||!seek||!elapsed||!durationLabel||!track||!cues.length) return null;

    var lines=[],activeIndex=-1,focusIndex=0,focusPosition=0,lineStep=38;
    var rafId=0,lastFrame=0,lastTime=0,playRequest=0;
    var scrubbing=false,scrubValue=0;
    var progressStamp=0,seekCache='',progressCache='',ariaCache='';
    var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    audio.loop=true;

    for(var i=0;i<cues.length;i++){
      var line=document.createElement('div');
      line.className='lyric-line';
      line.textContent=cues[i].text;
      track.appendChild(line);
      lines.push(line);
    }

    function renderTrack(){
      track.style.transform='translate3d(0,'+(-(focusPosition+0.5)*lineStep)+'px,0)';
    }
    function measure(){
      lineStep=lines[0].getBoundingClientRect().height||38;
      focusPosition=focusIndex;
      renderTrack();
    }
    function updateButton(){
      var playing=!audio.paused&&!audio.ended;
      button.classList.toggle('is-playing',playing);
      control.classList.toggle('is-playing',playing);
      button.setAttribute('aria-pressed',String(playing));
      button.setAttribute('aria-label',(playing?'暂停':'播放')+'背景音乐：孙燕姿《遇见》');
    }
    function formatTime(seconds){
      if(!isFinite(seconds)||seconds<0) seconds=0;
      var whole=Math.floor(seconds);
      return Math.floor(whole/60)+':'+('0'+whole%60).slice(-2);
    }
    function mediaDuration(){
      return isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
    }
    function updateDuration(){
      var duration=mediaDuration();
      seek.disabled=!duration;
      if(duration){
        seek.max=String(duration);
        durationLabel.textContent=formatTime(duration);
      }
    }
    function renderProgress(force,now){
      if(!force&&now-progressStamp<100) return;
      progressStamp=now===undefined?performance.now():now;
      var duration=mediaDuration();
      var time=scrubbing?scrubValue:(audio.currentTime||0);
      if(duration) time=Math.max(0,Math.min(duration,time));
      if(!scrubbing){
        var seekValue=time.toFixed(1);
        if(seekValue!==seekCache){
          seek.value=seekValue;
          seekCache=seekValue;
        }
      }
      var progress=(duration?time/duration*100:0).toFixed(3)+'%';
      if(progress!==progressCache){
        seek.style.setProperty('--progress',progress);
        progressCache=progress;
      }
      var timeLabel=formatTime(time);
      if(elapsed.textContent!==timeLabel) elapsed.textContent=timeLabel;
      var ariaLabel=timeLabel+' / '+durationLabel.textContent;
      if(ariaLabel!==ariaCache){
        seek.setAttribute('aria-valuetext',ariaLabel);
        ariaCache=ariaLabel;
      }
    }
    function findCue(time){
      var low=0,high=cues.length-1,result=-1;
      while(low<=high){
        var middle=(low+high)>>1;
        if(cues[middle].time<=time){
          result=middle; low=middle+1;
        }else high=middle-1;
      }
      return result;
    }
    function synchronize(snap,now){
      var time=audio.currentTime||0;
      var index=findCue(time);
      var rollback=time<lastTime-1;
      if(index!==activeIndex){
        if(activeIndex>=0) lines[activeIndex].classList.remove('active');
        activeIndex=index;
        if(activeIndex>=0) lines[activeIndex].classList.add('active');
      }
      focusIndex=Math.max(0,index);
      if(snap||rollback||motion.matches){
        focusPosition=focusIndex;
        renderTrack();
      }
      lastTime=time;
      renderProgress(snap,now);
    }
    function stopFrame(){
      if(rafId) cancelAnimationFrame(rafId);
      rafId=0; lastFrame=0;
    }
    function frame(now){
      rafId=0;
      if(audio.paused||audio.ended) return;
      var dt=lastFrame?Math.min(0.05,(now-lastFrame)/1000):0.016;
      lastFrame=now;
      synchronize(false,now);
      var difference=focusIndex-focusPosition;
      if(motion.matches||Math.abs(difference)<0.001){
        if(focusPosition!==focusIndex){
          focusPosition=focusIndex;
          renderTrack();
        }
      }else{
        focusPosition+=difference*(1-Math.exp(-dt*9));
        renderTrack();
      }
      if(!audio.paused&&!audio.ended) rafId=requestAnimationFrame(frame);
    }
    function startFrame(){
      if(rafId||audio.paused||audio.ended) return;
      lastFrame=0;
      rafId=requestAnimationFrame(frame);
    }
    function resync(){
      updateDuration();
      synchronize(true);
    }
    function previewSeek(){
      if(seek.disabled) return;
      scrubbing=true;
      scrubValue=Number(seek.value)||0;
      renderProgress(true);
    }
    function finishScrub(){
      if(!scrubbing) return;
      var duration=mediaDuration();
      var target=scrubValue;
      scrubbing=false;
      if(duration) audio.currentTime=Math.max(0,Math.min(duration,target));
      synchronize(true);
    }
    function cancelScrub(){
      if(!scrubbing) return;
      scrubbing=false;
      renderProgress(true);
    }
    seek.addEventListener('pointerdown',function(){
      if(seek.disabled) return;
      scrubbing=true;
      scrubValue=Number(seek.value)||0;
    });
    seek.addEventListener('input',previewSeek);
    seek.addEventListener('change',finishScrub);
    seek.addEventListener('blur',finishScrub);
    seek.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&scrubbing){
        event.preventDefault();
        cancelScrub();
      }
    });
    window.addEventListener('pointerup',finishScrub);
    window.addEventListener('pointercancel',cancelScrub);

    audio.addEventListener('play',updateButton);
    audio.addEventListener('playing',function(){
      removeUnlockListeners();
      status.textContent='';
      updateButton();
      synchronize(true);
      startFrame();
    });
    audio.addEventListener('pause',function(){
      stopFrame();
      synchronize(true);
      updateButton();
    });
    audio.addEventListener('waiting',stopFrame);
    audio.addEventListener('ended',function(){
      stopFrame();
      updateButton();
    });
    audio.addEventListener('seeking',resync);
    audio.addEventListener('seeked',function(){
      synchronize(true);
      startFrame();
    });
    audio.addEventListener('loadedmetadata',resync);
    audio.addEventListener('durationchange',resync);
    audio.addEventListener('ratechange',resync);
    audio.addEventListener('error',function(){
      stopFrame();
      seek.disabled=true;
      updateButton();
      status.textContent='音乐暂时无法播放';
    });

    function removeUnlockListeners(){
      window.removeEventListener('pointerdown',unlockPlayback);
      window.removeEventListener('keydown',unlockPlayback);
    }
    function unlockPlayback(event){
      var target=event.target;
      if(target&&target.closest&&target.closest('#musicControl')) return;
      if(!audio.paused){
        removeUnlockListeners();
        return;
      }
      startPlayback(false);
    }
    function startPlayback(showFeedback){
      playRequest++;
      status.textContent='';
      var requestId=playRequest;
      try{
        var request=audio.play();
        if(request&&request.then){
          request.then(function(){
            if(requestId===playRequest) removeUnlockListeners();
          }).catch(function(){
            if(requestId!==playRequest) return;
            stopFrame();
            updateButton();
            status.textContent=audio.error?'音乐暂时无法播放':
              (showFeedback?'播放被阻止，请再次点击':'点击页面开启音乐');
          });
        }
      }catch(error){
        stopFrame();
        updateButton();
        status.textContent='音乐暂时无法播放';
      }
    }
    button.addEventListener('click',function(){
      if(!audio.paused&&!audio.ended){
        playRequest++;
        audio.pause();
        return;
      }
      startPlayback(true);
    });
    function isolatePointer(event){ event.stopPropagation(); }
    control.addEventListener('pointerdown',isolatePointer);
    control.addEventListener('pointermove',isolatePointer);
    control.addEventListener('click',isolatePointer);

    window.addEventListener('resize',function(){
      measure();
      synchronize(true);
    });
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){
        stopFrame();
      }else{
        synchronize(true);
        startFrame();
      }
    });
    if(motion.addEventListener) motion.addEventListener('change',resync);
    else if(motion.addListener) motion.addListener(resync);

    window.addEventListener('pointerdown',unlockPlayback);
    window.addEventListener('keydown',unlockPlayback);
    measure();
    resync();
    updateButton();
    startPlayback(false);
    return {audio:audio,synchronize:resync};
  };
})(window.ChristmasScene=window.ChristmasScene||{});
