(function(app){
  'use strict';

  app.createBackground=function(bg,config){
    var bctx=bg.getContext('2d'),W=0,H=0;
    var cosP=Math.cos(config.pitch),sinP=Math.sin(config.pitch);

    function resize(width,height,dpr){
      W=width; H=height;
      bg.width=Math.round(W*dpr); bg.height=Math.round(H*dpr);
      bctx.setTransform(dpr,0,0,dpr,0,0);
    }

    function mistHash(x,y){
      var n=Math.sin(x*127.1+y*311.7)*43758.5453;
      return n-Math.floor(n);
    }
    function mistNoise(x,y){
      var ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
      fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy);
      var a=mistHash(ix,iy),b=mistHash(ix+1,iy);
      var c=mistHash(ix,iy+1),d=mistHash(ix+1,iy+1);
      return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
    }
    function drawUpperMist(){
      var mw=Math.max(150,Math.round(W/6));
      var mh=Math.max(100,Math.round(H*0.52/6));
      var mist=document.createElement('canvas');
      mist.width=mw; mist.height=mh;
      var mctx=mist.getContext('2d');
      var image=mctx.createImageData(mw,mh),pixels=image.data;
      var seed=Math.random()*80;
      for(var y=0;y<mh;y++){
        var v=y/(mh-1);
        var vertical=Math.pow(1-v,1.15)*(0.55+0.45*Math.sin(v*Math.PI));
        for(var x=0;x<mw;x++){
          var nx=x/(mw-1)*4.4,ny=v*3.1;
          var warp=mistNoise(nx*0.85+seed,ny*0.85-seed);
          var n=0,amplitude=0.55,frequency=1,normalizer=0;
          for(var octave=0;octave<5;octave++){
            n+=mistNoise(nx*frequency+warp*1.35+seed,ny*frequency+warp*0.7)*amplitude;
            normalizer+=amplitude; amplitude*=0.5; frequency*=2.03;
          }
          n/=normalizer;
          var cloud=Math.max(0,Math.min(1,(n-0.31)/0.48));
          cloud=cloud*cloud*(3-2*cloud);
          var horizontal=0.58+0.42*Math.sin(x/(mw-1)*Math.PI);
          var alpha=cloud*vertical*horizontal*0.40;
          var p=(y*mw+x)*4;
          pixels[p]=28+Math.round(n*22);
          pixels[p+1]=68+Math.round(n*38);
          pixels[p+2]=132+Math.round(n*62);
          pixels[p+3]=Math.round(alpha*255);
        }
      }
      mctx.putImageData(image,0,0);
      bctx.save();
      bctx.globalCompositeOperation='screen';
      bctx.drawImage(mist,0,0,W,H*0.56);
      bctx.restore();
    }

    function draw(layout){
      function projectY(y,z){
        var viewY=y*cosP-z*sinP;
        var viewZ=y*sinP+z*cosP;
        var ndc=viewY*layout.projScale/(config.cameraDistance-viewZ)+layout.projOffsetY;
        return (1-ndc)*H/2;
      }

      var baseY=projectY(0,0),apexY=projectY(config.treeHeight,0);
      var heartScreenY=projectY(config.heartY,0);
      var treeScreenHeight=baseY-apexY;
      var treeScreenWidth=layout.radius*layout.projScale/config.cameraDistance*H/2;
      var cx=(layout.treeOffset+1)*W/2;
      bctx.clearRect(0,0,W,H);
      var sky=bctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#010208'); sky.addColorStop(0.55,'#030711'); sky.addColorStop(1,'#07101c');
      bctx.fillStyle=sky; bctx.fillRect(0,0,W,H);
      drawUpperMist();

      var centerY=baseY-treeScreenHeight*0.45;
      var aura=bctx.createRadialGradient(cx,centerY,0,cx,centerY,treeScreenWidth*2.5);
      aura.addColorStop(0,'rgba(65,125,215,0.10)');
      aura.addColorStop(0.55,'rgba(48,96,175,0.03)');
      aura.addColorStop(1,'rgba(40,80,150,0)');
      bctx.fillStyle=aura;
      bctx.fillRect(cx-treeScreenWidth*2.6,baseY-treeScreenHeight*1.1,treeScreenWidth*5.2,treeScreenHeight*1.6);

      var hg=bctx.createRadialGradient(cx,heartScreenY,0,cx,heartScreenY,treeScreenWidth*0.55);
      hg.addColorStop(0,'rgba(175,145,235,0.10)'); hg.addColorStop(1,'rgba(120,150,220,0)');
      bctx.fillStyle=hg; bctx.fillRect(cx-treeScreenWidth,heartScreenY-treeScreenWidth,treeScreenWidth*2,treeScreenWidth*2);

      var oy=baseY-treeScreenHeight*0.52;
      bctx.save();
      bctx.strokeStyle='rgba(164,192,224,0.065)'; bctx.lineWidth=0.65;
      bctx.beginPath();
      bctx.ellipse(cx,oy,treeScreenWidth*1.58,treeScreenHeight*0.48,-0.16,Math.PI*1.05,Math.PI*1.86);
      bctx.stroke();
      bctx.strokeStyle='rgba(203,187,152,0.045)';
      bctx.beginPath();
      bctx.ellipse(cx,oy,treeScreenWidth*1.84,treeScreenHeight*0.55,-0.16,Math.PI*0.08,Math.PI*0.58);
      bctx.stroke();
      bctx.restore();

      var n=Math.floor(W*H/6500);
      for(var i=0;i<n;i++){
        var x=Math.random()*W,y=Math.random()*H*0.82;
        var r=Math.random()*0.65+0.2,a=0.05+Math.random()*0.28;
        bctx.fillStyle='rgba(180,210,250,'+a.toFixed(3)+')';
        bctx.beginPath(); bctx.arc(x,y,r,0,Math.PI*2); bctx.fill();
        if(i%41===0){
          bctx.strokeStyle='rgba(190,215,245,'+(a*0.38).toFixed(3)+')';
          bctx.lineWidth=0.5; bctx.beginPath();
          bctx.moveTo(x-r*4,y); bctx.lineTo(x+r*4,y);
          bctx.moveTo(x,y-r*4); bctx.lineTo(x,y+r*4); bctx.stroke();
        }
      }

      var v=bctx.createRadialGradient(W/2,H*0.42,Math.min(W,H)*0.3,W/2,H*0.5,Math.max(W,H)*0.85);
      v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.60)');
      bctx.fillStyle=v; bctx.fillRect(0,0,W,H);
    }

    return {resize:resize,draw:draw};
  };
})(window.ChristmasScene=window.ChristmasScene||{});
