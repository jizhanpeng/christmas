(function(app){
  'use strict';

  app.createRenderer=function(canvas,shaders){
    var gl=canvas.getContext('webgl',{
      alpha:true, antialias:false, depth:false, stencil:false,
      powerPreference:'high-performance'
    });
    if(!gl) return null;

    function compileShader(type,source){
      var shader=gl.createShader(type);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        throw new Error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    var program=gl.createProgram();
    gl.attachShader(program,compileShader(gl.VERTEX_SHADER,shaders.vertexSource));
    gl.attachShader(program,compileShader(gl.FRAGMENT_SHADER,shaders.fragmentSource));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
      throw new Error(gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0);

    var attributes={
      aPosition:{size:3,buffer:gl.createBuffer()},
      aScatter:{size:3,buffer:gl.createBuffer()},
      aColor:{size:3,buffer:gl.createBuffer()},
      aParams:{size:4,buffer:gl.createBuffer()},
      aMisc:{size:4,buffer:gl.createBuffer()}
    };
    Object.keys(attributes).forEach(function(name){
      attributes[name].location=gl.getAttribLocation(program,name);
    });
    var uniforms={};
    ['uTime','uIntro','uYaw','uPitch','uScale','uOffsetX','uOffsetY','uAspect','uDpr',
     'uRadius','uBurstAge','uPulse','uPointerWorld','uPointerForce'].forEach(function(name){
      uniforms[name]=gl.getUniformLocation(program,name);
    });
    var particleCount=0;

    function resize(width,height,dpr){
      canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
      gl.viewport(0,0,canvas.width,canvas.height);
    }

    function upload(result){
      particleCount=result.count;
      Object.keys(attributes).forEach(function(name){
        var attr=attributes[name];
        gl.bindBuffer(gl.ARRAY_BUFFER,attr.buffer);
        gl.bufferData(gl.ARRAY_BUFFER,result.attributes[name],gl.STATIC_DRAW);
        gl.enableVertexAttribArray(attr.location);
        gl.vertexAttribPointer(attr.location,attr.size,gl.FLOAT,false,0,0);
      });
    }

    function render(frame){
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.uTime,frame.time);
      gl.uniform1f(uniforms.uIntro,frame.intro);
      gl.uniform1f(uniforms.uYaw,frame.yaw);
      gl.uniform1f(uniforms.uPitch,frame.pitch);
      gl.uniform1f(uniforms.uScale,frame.scale);
      gl.uniform1f(uniforms.uOffsetX,frame.offsetX);
      gl.uniform1f(uniforms.uOffsetY,frame.offsetY);
      gl.uniform1f(uniforms.uAspect,frame.aspect);
      gl.uniform1f(uniforms.uDpr,frame.dpr);
      gl.uniform1f(uniforms.uRadius,frame.radius);
      gl.uniform1f(uniforms.uBurstAge,frame.burstAge);
      gl.uniform1f(uniforms.uPulse,frame.pulse);
      gl.uniform2f(uniforms.uPointerWorld,frame.pointerWorldX,frame.pointerWorldY);
      gl.uniform1f(uniforms.uPointerForce,frame.pointerForce);
      gl.drawArrays(gl.POINTS,0,particleCount);
    }

    return {resize:resize,upload:upload,render:render};
  };
})(window.ChristmasScene=window.ChristmasScene||{});
