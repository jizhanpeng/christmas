(function(app){
  'use strict';

  app.createParticleBuilder=function(config){
    var TREE_H=config.treeHeight,HEART_Y=config.heartY,CAMERA_D=config.cameraDistance;
    var bluePalette=config.palettes.blue,ribbonPalette=config.palettes.ribbon;
    var heartPalette=config.palettes.heart,goldPalette=config.palettes.gold;
    function pick(list){ return list[Math.floor(Math.random()*list.length)]; }

    function buildParticles(layout){
      var W=layout.width,H=layout.height,radius=layout.radius;
      var projScale=layout.projScale,projOffsetY=layout.projOffsetY,treeOffset=layout.treeOffset;
      var cosP=Math.cos(config.pitch),sinP=Math.sin(config.pitch);
      var mobile=W<700;
      var dustN=mobile?45000:62000;
      var ribbonN=mobile?4500:6500;
      var heartN=mobile?3500:4500;
      var groundN=mobile?1200:1800;
      var ambientN=mobile?1500:2400,snowN=mobile?3800:6000,ringN=mobile?220:320;
      var bellN=6,bellPoints=280,heroN=mobile?10:14;
      var fireworkN=mobile?3:4,fireworkPoints=mobile?160:220;
      var introPoints=mobile?120:180,introBellN=3,linePoints=240,introBellPoints=mobile?480:640;
      var total=dustN+ribbonN+heartN+groundN+ambientN+bellN*bellPoints+heroN+fireworkN*fireworkPoints+introPoints*2+introBellN*(introBellPoints+linePoints)+snowN+ringN*3;
      var data={
        aPosition:new Float32Array(total*3),
        aScatter:new Float32Array(total*3),
        aColor:new Float32Array(total*3),
        aParams:new Float32Array(total*4),
        aMisc:new Float32Array(total*4)
      };
      var index=0;
      function add(x,y,z,color,params,size,alpha,kind){
        var i=index++,i3=i*3,i4=i*4;
        data.aPosition[i3]=x; data.aPosition[i3+1]=y; data.aPosition[i3+2]=z;
        var a=Math.random()*Math.PI*2;
        var sz=Math.random()*2-1;
        var sr=Math.sqrt(1-sz*sz);
        var distance=2.5+Math.random()*5.5;
        data.aScatter[i3]=x+Math.cos(a)*sr*distance;
        data.aScatter[i3+1]=y+sz*distance*0.8;
        data.aScatter[i3+2]=z+Math.sin(a)*sr*distance;
        data.aColor[i3]=color[0]; data.aColor[i3+1]=color[1]; data.aColor[i3+2]=color[2];
        for(var p=0;p<4;p++) data.aParams[i4+p]=params[p]||0;
        data.aMisc[i4]=size; data.aMisc[i4+1]=alpha;
        data.aMisc[i4+2]=Math.random(); data.aMisc[i4+3]=kind;
        return i;
      }

      function worldYAtNdc(ndc,z){
        var k=(ndc-projOffsetY)/projScale;
        return (k*CAMERA_D+z*(sinP-k*cosP))/(cosP+k*sinP);
      }

      // 圆锥只作为松散范围，不生成规则外壳；螺旋光带负责勾勒树形
      for(var i=0;i<dustN;i++){
        var t=1-Math.pow(Math.random(),1/2.2);
        var y=t*TREE_H;
        var theta=Math.random()*Math.PI*2;
        var maxR=radius*Math.pow(1-t,1.02);
        var organic=0.76+0.38*Math.sin(theta*3+y*1.4)+0.28*Math.cos(theta*5-y*1.7);
        var rho=maxR*Math.sqrt(Math.random())*organic;
        if(Math.random()<0.42) rho*=1.18+Math.random()*0.85;
        y=Math.max(0,Math.min(TREE_H,y+(Math.random()+Math.random()-1)*0.32));
        var haze=Math.random()<0.035;
        add(Math.cos(theta)*rho,y,Math.sin(theta)*rho,pick(bluePalette),[0,0,0,0],
          haze?3.5+Math.random()*3.0:2.35+Math.random()*2.55,
          haze?0.025+Math.random()*0.04:0.09+Math.random()*0.29,haze?3:0);
      }

      // 螺旋光带仍在 GPU 中持续向上升腾
      for(var r=0;r<ribbonN;r++){
        var u=Math.random();
        var rr=radius*Math.pow(1-u,1.02);
        var theta2=u*Math.PI*2*5.6;
        var radial=(Math.random()+Math.random()-1)*radius*0.15;
        var lift=(Math.random()+Math.random()-1)*0.18;
        var angle=(Math.random()-0.5)*0.46;
        add(Math.cos(theta2)*rr,u*TREE_H,Math.sin(theta2)*rr,pick(ribbonPalette),
          [u,angle,radial,lift],2.25+Math.pow(Math.random(),0.5)*3.0,0.18+Math.random()*0.58,1);
      }

      // 爱心保留大致轮廓，但用形变、毛边和游离粒子打破标准图标感
      for(var h=0;h<heartN;h++){
        var nx=0,ny=0,accepted=false;
        for(var k=0;k<80;k++){
          nx=(Math.random()*2-1)*1.3;
          ny=(Math.random()*2-1)*1.2;
          var v=Math.pow(nx*nx+ny*ny-1,3)-nx*nx*ny*ny*ny;
          if(v<=0||(v<0.16&&Math.random()<0.18)){ accepted=true; break; }
        }
        if(!accepted) continue;
        var hs=0.20;
        var stray=Math.random()<0.14;
        var scatter=stray?0.075+Math.random()*0.11:Math.random()*0.027;
        var scatterAngle=Math.random()*Math.PI*2;
        var warpX=Math.sin(ny*4.2+nx*1.7)*0.019;
        var warpY=Math.sin(nx*5.3-ny)*0.017;
        add(
          nx*hs*1.3+warpX+Math.cos(scatterAngle)*scatter,
          HEART_Y+ny*hs*1.15+warpY+Math.sin(scatterAngle)*scatter*0.8,
          (Math.random()-0.5)*(stray?0.26:0.16),
          pick(heartPalette),[0,0,0,0],
          stray?0.65+Math.random()*1.1:1.0+Math.random()*1.5,
          stray?0.12+Math.random()*0.25:0.26+Math.random()*0.52,2);
      }

      // 底部空间雾仍然由细小点组成，不再使用大面积模糊精灵
      for(var g=0;g<groundN;g++){
        var ga=Math.random()*Math.PI*2;
        var gr=Math.sqrt(Math.random())*radius*1.65;
        add(Math.cos(ga)*gr,-0.05+Math.random()*0.34,Math.sin(ga)*gr,
          pick(bluePalette),[0,0,0,0],3.0+Math.random()*5.0,0.018+Math.random()*0.035,3);
      }

      // 三圈细碎光环贴近地面，以不同方向缓慢流动
      for(var ring=0;ring<3;ring++){
        var ringRadius=radius*(0.95+ring*0.24);
        for(var rp=0;rp<ringN;rp++){
          var ringAngle=Math.random()*Math.PI*2;
          var ringJitter=(Math.random()+Math.random()-1)*radius*0.035;
          var ringColor=Math.random()<0.22?goldPalette[1]:pick([bluePalette[2],ribbonPalette[0]]);
          add(Math.cos(ringAngle)*(ringRadius+ringJitter),0.040+ring*0.032+Math.random()*0.035,
            Math.sin(ringAngle)*(ringRadius+ringJitter),ringColor,
            [ringAngle,ring,Math.random()*Math.PI*2,0],
            1.65+Math.random()*1.80,0.28+Math.random()*0.30,12);
        }
      }

      // 香槟金粒子铃铛：顶环、钟体、外翻唇口和钟锤都由点云构成
      function addBell(ax,ay,az,scale,kind,phase,pointCount){
        var particleKind=kind===undefined?5:kind;
        var count=pointCount||bellPoints;
        var profile=[
          [0.0,0.025],[-0.035,0.050],[-0.090,0.072],
          [-0.160,0.082],[-0.215,0.105],[-0.235,0.130]
        ];
        for(var j=0;j<count;j++){
          var lx=0,ly=0,lz=0,a=Math.random()*Math.PI*2,portion=j/count;
          if(portion<0.125){
            lx=Math.cos(a)*0.032*scale;
            ly=(0.015+Math.sin(a)*0.032)*scale;
            lz=(Math.random()-0.5)*0.012*scale;
          }else if(portion<0.803571){
            var segment=Math.min(profile.length-2,Math.floor(Math.random()*(profile.length-1)));
            var f=Math.random(),p0=profile[segment],p1=profile[segment+1];
            ly=(p0[0]+(p1[0]-p0[0])*f)*scale;
            var br=(p0[1]+(p1[1]-p0[1])*f)*scale;
            br+=(Math.random()-0.5)*0.004*scale;
            lx=Math.cos(a)*br; lz=Math.sin(a)*br;
          }else if(portion<0.910714){
            var lip=(0.130+Math.random()*0.008)*scale;
            lx=Math.cos(a)*lip; lz=Math.sin(a)*lip;
            ly=(-0.235+(Math.random()-0.5)*0.012)*scale;
          }else{
            var cz=Math.random()*2-1,cr=Math.sqrt(1-cz*cz)*0.024*scale;
            lx=Math.cos(a)*cr; lz=Math.sin(a)*cr;
            ly=-0.270*scale+cz*0.024*scale;
          }
          var particleIndex=add(ax+lx,ay+ly,az+lz,pick(goldPalette),[ax,ay,az,phase||0],
            particleKind===9?1.9+Math.random()*1.6:1.5+Math.random()*1.4,
            particleKind===9?0.48+Math.random()*0.34:0.38+Math.random()*0.42,particleKind);
          if(particleKind===9){
            var targetIndex=particleIndex*3;
            data.aScatter[targetIndex]=(j%2===0?1:-1)*radius*0.72;
            data.aScatter[targetIndex+1]=0;
            data.aScatter[targetIndex+2]=0;
          }
        }
      }
      var bellLevels=[1.00,1.95,2.90,3.85,4.80,5.75];
      for(var b=0;b<bellN;b++){
        var by=bellLevels[b];
        var ba=by/TREE_H*Math.PI*2*5.6+0.2+(b%2?-0.35:0.35);
        var br=radius*Math.pow(1-by/TREE_H,1.02)*(mobile?0.90+Math.random()*0.10:1.06+Math.random()*0.12);
        addBell(Math.cos(ba)*br,by,Math.sin(ba)*br,0.92+Math.random()*0.20);
      }

      // 三枚大型铃铛从不同深度落下，随后散成星尘并接入两道光迹
      var introBellLayout=[
        [-0.43,5.55,-1.25,3.65],
        [ 0.02,4.85, 0.85,4.95],
        [ 0.48,5.75,-0.25,4.00]
      ];
      for(var ib=0;ib<introBellN;ib++){
        var bellLayout=introBellLayout[ib];
        var iy=bellLayout[1],iz=bellLayout[2];
        var bellDepth=CAMERA_D-(iy*sinP+iz*cosP);
        var screenX=treeOffset+bellLayout[0]*(mobile?0.86:1);
        var ix=(screenX-treeOffset)*(W/H)*bellDepth/projScale;
        var bellScale=bellLayout[3]*(mobile?0.82:1);
        addBell(ix,iy,iz,bellScale,9,ib,introBellPoints);
        for(var lp=0;lp<linePoints;lp++){
          add(lp/(linePoints-1),bellScale*0.047,0,goldPalette[2],[ix,iy,iz,ib],
            1.35+Math.random()*0.85,0.38+Math.random()*0.30,10);
        }
      }

      // 极少量星芒只作为近景高光，不使用全屏泛光
      for(var h2=0;h2<heroN;h2++){
        var hy=0.5+Math.random()*(TREE_H-1.0);
        var ha=Math.random()*Math.PI*2;
        var hr=radius*Math.pow(1-hy/TREE_H,1.02)*(0.65+Math.random()*0.55);
        var heroColor=Math.random()<0.35?pick(goldPalette):[0.85,0.92,1.0];
        add(Math.cos(ha)*hr,hy,Math.sin(ha)*hr,heroColor,[0,0,0,0],
          8.0+Math.random()*5.0,0.12+Math.random()*0.22,6);
      }

      // 远处的烟花以不同相位循环，保持稀疏、低饱和的粒子光点
      var fireworkLayout=[
        [-0.78,6.65,-1.1,0.56,0.12],
        [ 0.80,6.55,-1.4,0.50,0.52],
        [ 0.72,5.55,-0.8,0.36,0.80],
        [-0.76,4.35,-1.5,0.42,0.32]
      ];
      var fireworkColors=[goldPalette[1],bluePalette[2],heartPalette[3],ribbonPalette[0]];
      for(var fw=0;fw<fireworkN;fw++){
        var fwLayout=fireworkLayout[fw];
        var fy=fwLayout[1],fz=fwLayout[2];
        var halfWidth=(W/H)*(CAMERA_D-(fy*sinP+fz*cosP))/projScale;
        var fx=(fwLayout[0]*(mobile?0.82:1)-treeOffset)*halfWidth;
        var fireworkScale=fwLayout[3]*(mobile?1.50:2.325);
        var phase=fwLayout[4],spokes=22+fw*2;
        for(var fp=0;fp<fireworkPoints;fp++){
          var spoke=fp%spokes;
          var fa=spoke/spokes*Math.PI*2+fw*0.37+(Math.random()-0.5)*0.055;
          var speed=fireworkScale*(0.28+Math.pow(Math.random(),0.65)*0.72);
          var fzSlope=Math.sin(spoke*2.17+fw)*0.28+(Math.random()-0.5)*0.06;
          add(fx,fy,fz,fireworkColors[fw],
            [Math.cos(fa)*speed,Math.sin(fa)*speed,fzSlope*speed,phase],
            2.25+Math.random()*2.65,0.30+Math.random()*0.46,7);
        }
      }

      // 环境星尘不参与爆散，树消失时仍保留空间感
      for(var s=0;s<ambientN;s++){
        var tint=Math.random()<0.08?[0.80,0.71,0.54]:pick(bluePalette);
        add((Math.random()-0.5)*radius*5,Math.random()*(TREE_H+1.2),(Math.random()-0.5)*radius*3,
          tint,[0,0,0,0],0.65+Math.random()*1.75,0.06+Math.random()*0.22,4);
      }

      // 远、中、近三层雪粒覆盖整个视口，近景只保留少量较大颗粒
      for(var sn=0;sn<snowN;sn++){
        var snowLayer=Math.random(),snowZ,snowSize,snowAlpha,snowSpeed,snowWind;
        if(snowLayer<0.55){
          snowZ=-3.5+Math.random()*2.0;
          snowSize=1.70+Math.random()*1.80;
          snowAlpha=0.10+Math.random()*0.12;
          snowSpeed=0.20+Math.random()*0.18;
          snowWind=0.03+Math.random()*0.07;
        }else if(snowLayer<0.90){
          snowZ=-1.5+Math.random()*2.5;
          snowSize=2.65+Math.random()*2.45;
          snowAlpha=0.16+Math.random()*0.18;
          snowSpeed=0.34+Math.random()*0.26;
          snowWind=0.06+Math.random()*0.10;
        }else{
          snowZ=0.8+Math.random()*2.2;
          snowSize=4.50+Math.random()*3.50;
          snowAlpha=0.20+Math.random()*0.20;
          snowSpeed=0.58+Math.random()*0.34;
          snowWind=0.10+Math.random()*0.14;
        }
        var snowTop=worldYAtNdc(1.22,snowZ),snowBottom=worldYAtNdc(-1.22,snowZ);
        var snowY=snowBottom+Math.random()*(snowTop-snowBottom);
        var snowDepth=CAMERA_D-(snowY*sinP+snowZ*cosP);
        var snowScreenX=(Math.random()*2-1)*1.12;
        var snowX=(snowScreenX-treeOffset)*(W/H)*snowDepth/projScale;
        add(snowX,snowY,snowZ,[0.72,0.84,0.98],
          [snowSpeed,Math.random()*Math.PI*2,snowWind,0],snowSize,snowAlpha,11);
      }

      // 两道短暂的光迹交叉上升，在树顶汇合后引出整棵树
      for(var stream=0;stream<2;stream++){
        var introColor=stream===0?[0.65,0.85,1.0]:[0.95,0.86,0.68];
        for(var ip=0;ip<introPoints;ip++){
          var trail=Math.pow(Math.random(),0.75)*0.22;
          add(0,0,0,introColor,
            [stream,trail,(Math.random()-0.5)*0.10,(Math.random()-0.5)*0.035],
            2.4+Math.random()*2.4,0.40+Math.random()*0.45,8);
        }
      }

      return {count:index,attributes:data};
    }

    return {build:buildParticles};
  };
})(window.ChristmasScene=window.ChristmasScene||{});
