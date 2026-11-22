(function(app){
  'use strict';

  app.createOrnamentBuilder=function(config){
    var TAU=Math.PI*2;
    var gold=[[0.86,0.66,0.34],[0.98,0.82,0.48],[0.72,0.52,0.26]];
    var brown=[[0.50,0.24,0.075],[0.66,0.35,0.12],[0.78,0.46,0.20]];
    var cream=[[0.82,0.61,0.34],[0.95,0.78,0.49],[0.88,0.70,0.42]];
    var dark=[[0.018,0.012,0.014],[0.035,0.022,0.018]];
    var chocolate=[[0.42,0.16,0.065],[0.58,0.24,0.095],[0.70,0.34,0.15]];
    var red=[[0.72,0.035,0.028],[0.92,0.075,0.045],[0.82,0.045,0.035]];
    var white=[[0.82,0.85,0.84],[0.95,0.91,0.79],[0.88,0.91,0.91]];
    var skin=[[0.82,0.47,0.28],[0.94,0.62,0.40]];

    function pick(list){ return list[Math.floor(Math.random()*list.length)]; }
    function budget(mobile){ return mobile?1960:2800; }

    // 小挂饰采用浅层浮雕，深色细节通过留白而不是黑色遮挡实现
    function ellipse(point,count,cx,cy,rx,ry,z,colors,holes,depth){
      var made=0;
      while(made<count){
        var angle=Math.random()*TAU,r=Math.sqrt(Math.random());
        var x=cx+Math.cos(angle)*r*rx,y=cy+Math.sin(angle)*r*ry;
        if(holes&&holes(x,y)) continue;
        var zz=z+(depth||0)*(1-r*r)+(Math.random()-0.5)*0.012;
        point(x,y,zz,pick(colors),1.80+Math.random()*1.05,0.44+Math.random()*0.28);
        made++;
      }
    }
    function rectangle(point,count,cx,cy,width,height,z,colors,holes){
      var made=0;
      while(made<count){
        var x=cx+(Math.random()-0.5)*width,y=cy+(Math.random()-0.5)*height;
        if(holes&&holes(x,y)) continue;
        point(x,y,z+(Math.random()-0.5)*0.012,pick(colors),1.80+Math.random()*1.05,0.44+Math.random()*0.28);
        made++;
      }
    }
    function rim(point,count,cx,cy,rx,ry,z,colors){
      for(var i=0;i<count;i++){
        var angle=(i+Math.random()*0.7)/count*TAU;
        point(cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry,z+(Math.random()-0.5)*0.01,
          pick(colors),1.80+Math.random()*1.0,0.42+Math.random()*0.30);
      }
    }
    function triangle(point,count,a,b,c,z,colors){
      for(var i=0;i<count;i++){
        var u=Math.random(),v=Math.random();
        if(u+v>1){u=1-u;v=1-v;}
        point(a[0]+u*(b[0]-a[0])+v*(c[0]-a[0]),a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]),
          z+(Math.random()-0.5)*0.015,pick(colors),1.80+Math.random()*1.0,0.44+Math.random()*0.28);
      }
    }

    function bear(point,n){
      function eyes(x,y){
        var dx=Math.abs(x)-0.061;
        return dx*dx/0.00036+(y+0.205)*(y+0.205)/0.00042<1;
      }
      function nose(x,y){ return x*x/0.00034+(y+0.260)*(y+0.260)/0.00025<1; }
      ellipse(point,n(140),0,-0.220,0.180,0.158,0.035,brown,function(x,y){return eyes(x,y)||nose(x,y);},0.035);
      rim(point,n(160),0,-0.220,0.180,0.158,0.075,brown);
      ellipse(point,n(70),-0.145,-0.073,0.063,0.063,0.025,brown,null,0.018);
      ellipse(point,n(70),0.145,-0.073,0.063,0.063,0.025,brown,null,0.018);
      ellipse(point,n(25),-0.145,-0.073,0.034,0.035,0.065,cream,null,0.010);
      ellipse(point,n(25),0.145,-0.073,0.034,0.035,0.065,cream,null,0.010);
      ellipse(point,n(160),0,-0.480,0.128,0.150,0.025,brown,null,0.028);
      ellipse(point,n(20),-0.135,-0.455,0.042,0.080,0.035,brown,null,0.012);
      ellipse(point,n(20),0.135,-0.455,0.042,0.080,0.035,brown,null,0.012);
      ellipse(point,n(25),-0.068,-0.607,0.055,0.038,0.045,brown,null,0.012);
      ellipse(point,n(25),0.068,-0.607,0.055,0.038,0.045,brown,null,0.012);
      ellipse(point,n(90),0,-0.270,0.075,0.052,0.085,cream,nose,0.015);
      ellipse(point,n(70),0,-0.480,0.073,0.084,0.070,cream,null,0.015);
      ellipse(point,n(12),-0.061,-0.205,0.010,0.013,0.105,dark,null,0);
      ellipse(point,n(12),0.061,-0.205,0.010,0.013,0.105,dark,null,0);
      ellipse(point,n(16),0,-0.260,0.014,0.010,0.112,dark,null,0);
      var mouthPoints=n(20);
      for(var m=0;m<mouthPoints;m++){
        var x=(m/Math.max(1,mouthPoints-1)-0.5)*0.052;
        point(x,-0.294+Math.abs(x)*0.38,0.112,pick(dark),0.85,0.32);
      }
      rim(point,n(40),0,0,0.038,0.045,0,gold);
    }

    function chocolateBar(point,n){
      function grooves(x,y){
        return Math.abs(x)<0.008||Math.abs(y+0.235)<0.008||Math.abs(y+0.365)<0.008;
      }
      rectangle(point,n(140),0,-0.320,0.280,0.460,0.010,chocolate,grooves);
      for(var row=0;row<3;row++){
        for(var col=0;col<2;col++){
          var x=col?0.061:-0.061,y=-0.170-row*0.130;
          rectangle(point,n(45),x,y,0.104,0.104,0.065,chocolate,null);
        }
      }
      var borderPoints=n(70);
      for(var i=0;i<borderPoints;i++){
        var edge=i%4,t=Math.random()-0.5,x=0,y=0;
        if(edge<2){x=t*0.292;y=edge?-0.557:-0.083;}
        else{x=edge===2?-0.146:0.146;y=-0.320+t*0.474;}
        point(x,y,0.045,pick(gold),1.0+Math.random()*0.55,0.26+Math.random()*0.18);
      }
      var highlightPoints=n(40);
      for(var h=0;h<highlightPoints;h++){
        var cell=h%6,cx=cell%2?0.061:-0.061,cy=-0.170-Math.floor(cell/2)*0.130;
        point(cx-0.034+Math.random()*0.056,cy+0.038+Math.random()*0.006,0.083,
          pick(cream),0.85+Math.random()*0.45,0.20+Math.random()*0.16);
      }
      rectangle(point,n(40),0,-0.514,0.292,0.082,0.095,gold,function(x,y){
        return y>-0.484+Math.sin(x*95)*0.010;
      });
      rim(point,n(40),0,0,0.038,0.045,0,gold);
    }

    function santa(point,n){
      function faceHoles(x,y){
        var eyeX=Math.abs(x)-0.032;
        return eyeX*eyeX/0.00015+(y+0.267)*(y+0.267)/0.00018<1||
          x*x/0.00030+(y+0.357)*(y+0.357)/0.00028<1;
      }
      triangle(point,n(120),[-0.140,-0.205],[0.125,-0.205],[0.090,-0.035],0.025,red);
      ellipse(point,n(50),0,-0.210,0.145,0.034,0.060,white,null,0.010);
      ellipse(point,n(30),0.105,-0.045,0.040,0.040,0.050,white,null,0.012);
      ellipse(point,n(90),0,-0.275,0.088,0.073,0.045,skin,faceHoles,0.018);
      ellipse(point,n(10),-0.088,-0.275,0.022,0.032,0.035,skin,null,0.008);
      ellipse(point,n(10),0.088,-0.275,0.022,0.032,0.035,skin,null,0.008);
      ellipse(point,n(180),0,-0.370,0.118,0.118,0.075,white,faceHoles,0.022);
      ellipse(point,n(30),-0.038,-0.320,0.052,0.026,0.105,white,faceHoles,0.010);
      ellipse(point,n(30),0.038,-0.320,0.052,0.026,0.105,white,faceHoles,0.010);
      function beltGap(x,y){return Math.abs(y+0.505)<0.018;}
      ellipse(point,n(180),0,-0.515,0.135,0.125,0.025,red,beltGap,0.025);
      ellipse(point,n(40),-0.145,-0.495,0.044,0.090,0.020,red,null,0.012);
      ellipse(point,n(40),0.145,-0.495,0.044,0.090,0.020,red,null,0.012);
      rectangle(point,n(30),0,-0.505,0.250,0.027,0.070,dark,null);
      rim(point,n(30),0,-0.505,0.034,0.026,0.095,gold);
      ellipse(point,n(9),-0.032,-0.267,0.007,0.009,0.110,dark,null,0);
      ellipse(point,n(9),0.032,-0.267,0.007,0.009,0.110,dark,null,0);
      ellipse(point,n(12),0,-0.357,0.012,0.009,0.118,dark,null,0);
      ellipse(point,n(30),-0.165,-0.555,0.038,0.036,0.055,white,null,0.010);
      ellipse(point,n(30),0.165,-0.555,0.038,0.036,0.055,white,null,0.010);
      rectangle(point,n(30),0,-0.615,0.245,0.030,0.065,white,null);
      ellipse(point,n(45),-0.065,-0.665,0.060,0.035,0.040,dark,null,0.010);
      ellipse(point,n(45),0.065,-0.665,0.060,0.035,0.040,dark,null,0.010);
      rim(point,n(40),0,0,0.038,0.045,0,gold);
      rim(point,n(40),0,-0.515,0.137,0.127,0.035,red);
      rim(point,n(40),0,-0.370,0.120,0.120,0.065,white);
    }

    function build(options){
      var radius=options.radius,mobile=options.mobile,emit=options.emit;
      var scale=mobile?1.08:1.35,pointScale=mobile?0.95:1,emitted=0;
      function make(height,angle,seed,draw){
        var allocated=0,reserved=0;
        function amount(count){
          allocated+=count;
          var target=Math.round(allocated*(mobile?0.7:1));
          var result=target-reserved;
          reserved=target;
          return result;
        }
        var cone=radius*Math.pow(1-height/config.treeHeight,1.02);
        var anchorRadius=cone*(mobile?1.08:1.20)+0.05;
        var ax=Math.cos(angle)*anchorRadius,ay=height,az=Math.sin(angle)*anchorRadius;
        var facing=angle-Math.PI/2,c=Math.cos(facing),s=Math.sin(facing);
        function point(x,y,z,color,size,alpha){
          emitted++;
          emit(ax+(x*c-z*s)*scale,ay+y*scale,az+(x*s+z*c)*scale,color,
            [ax,ay,az,0],size*pointScale,alpha,5,seed);
        }
        draw(point,amount);
      }
      make(1.50,0.55,0.17,bear);
      make(3.40,0.00,0.53,chocolateBar);
      make(5.30,5.90,0.86,santa);
      return emitted;
    }

    return {budget:budget,build:build};
  };
})(window.ChristmasScene=window.ChristmasScene||{});
