(function(app){
  'use strict';

  var config=app.config;
  var canvas=document.getElementById('c');
  var bg=document.getElementById('bg');
  var hint=document.getElementById('hint');
  if(app.createMusicPlayer) app.createMusicPlayer();
  var renderer=app.createRenderer(canvas,app.createShaders());
  if(!renderer){
    hint.textContent='WEBGL IS REQUIRED TO RENDER THE PARTICLES';
    return;
  }
  var particles=app.createParticleBuilder(config);
  var background=app.createBackground(bg,config);

  var W=0,H=0,DPR=1;
  var radius=1.8,pitch=config.pitch,projScale=2,projOffsetY=0,treeOffset=0;
  var cosP=Math.cos(pitch),sinP=Math.sin(pitch);
  var burstStart=0,burstStage=0,lastPointerMove=0;
  var pointer={x:0,y:0,tx:0,ty:0,wx:0,wy:0,force:0,canRepel:true};

  function resize(){
    var width=window.innerWidth,height=window.innerHeight;
    var dpr=Math.min(window.devicePixelRatio||1,config.maxDpr);
    if(width===W&&height===H&&dpr===DPR) return;
    W=width; H=height; DPR=dpr;
    renderer.resize(W,H,DPR);
    background.resize(W,H,DPR);

    var aspect=W/H;
    radius=aspect<0.75?config.radius.narrow:aspect<1.1?config.radius.medium:config.radius.wide;
    treeOffset=W>=1100?0.18:-0.04;
    var baseRadius=radius*1.50;
    var baseUnit=-baseRadius*sinP/(config.cameraDistance-baseRadius*cosP);
    var heartTop=config.heartY+0.34;
    var heartUnit=heartTop*cosP/(config.cameraDistance-heartTop*sinP);
    projScale=1.85/(heartUnit-baseUnit);
    projOffsetY=-0.92-baseUnit*projScale;

    burstStart=0; burstStage=0; pointer.force=0;
    hint.textContent='TOUCH THE LIGHT · WATCH IT RETURN';
    hint.classList.remove('active');

    var result=particles.build({
      width:W,height:H,radius:radius,projScale:projScale,projOffsetY:projOffsetY,treeOffset:treeOffset
    });
    renderer.upload(result);
    background.draw({
      radius:radius,treeOffset:treeOffset,projScale:projScale,projOffsetY:projOffsetY
    });
  }

  var resizeTimer=0;
  window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(resize,120);
  });
  resize();

  function setPointer(e){
    pointer.tx=(e.clientX/W-0.5)*2;
    pointer.ty=(e.clientY/H-0.5)*2;
    var ndcX=(e.clientX/W*2-1)-treeOffset;
    var ndcY=(1-e.clientY/H*2)-projOffsetY;
    pointer.wy=ndcY*config.cameraDistance/(projScale*cosP+ndcY*sinP);
    var pointerDepth=config.cameraDistance-pointer.wy*sinP;
    pointer.wx=ndcX*(W/H)*pointerDepth/projScale;
    pointer.canRepel=e.pointerType!=='touch';
    lastPointerMove=performance.now();
  }
  window.addEventListener('pointermove',setPointer,{passive:true});
  document.documentElement.addEventListener('pointerleave',function(){
    pointer.tx=0; pointer.ty=0; lastPointerMove=0;
  });
  window.addEventListener('pointerdown',function(e){
    setPointer(e);
    if(burstStart) return;
    burstStart=performance.now(); burstStage=1;
    hint.textContent='LET THE LIGHT GO';
    hint.classList.add('active');
  },{passive:true});

  var t0=performance.now(),lastFrame=t0;
  function tick(now){
    var dt=Math.min(0.05,(now-lastFrame)/1000);
    lastFrame=now;
    var t=(now-t0)/1000;
    pointer.x+=(pointer.tx-pointer.x)*Math.min(1,dt*3.5);
    pointer.y+=(pointer.ty-pointer.y)*Math.min(1,dt*3.5);
    var forceTarget=(!burstStart&&pointer.canRepel&&now-lastPointerMove<140)?1:0;
    pointer.force+=(forceTarget-pointer.force)*Math.min(1,dt*(forceTarget?10:3));

    var burstAge=-1;
    if(burstStart){
      burstAge=(now-burstStart)/1000;
      if(burstAge>=config.burst.gatherStart&&burstAge<config.burst.end&&burstStage!==2){
        burstStage=2; hint.textContent='GATHERING THE STARS';
      }else if(burstAge>=config.burst.end){
        burstStart=0; burstStage=0;
        hint.textContent='TOUCH THE LIGHT · WATCH IT RETURN';
        hint.classList.remove('active');
      }
    }
    var pulsePhase=t%config.pulse.period;
    var pulse=(!burstStart&&t>config.intro.pulseStart&&pulsePhase<config.pulse.duration)?
      pulsePhase/config.pulse.duration:-1;

    renderer.render({
      time:t,intro:t,
      yaw:t*0.16+0.55+pointer.x*0.32,
      pitch:pitch+pointer.y*0.055,
      scale:projScale,offsetX:treeOffset,offsetY:projOffsetY,
      aspect:W/H,dpr:DPR,radius:radius,
      burstAge:burstAge,pulse:pulse,
      pointerWorldX:pointer.wx,pointerWorldY:pointer.wy,pointerForce:pointer.force
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})(window.ChristmasScene=window.ChristmasScene||{});
