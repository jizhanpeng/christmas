(function(app){
  'use strict';

  var prelude=2.75;

  app.config={
    treeHeight:7.15,
    heartY:7.56,
    cameraDistance:10.0,
    pitch:0.36,
    maxDpr:2,
    radius:{ narrow:2.75, medium:2.60, wide:2.65 },
    intro:{
      prelude:prelude,
      bellDropEnd:1.45,
      bellScatterStart:1.90,
      bellFadeEnd:2.95,
      lineFadeEnd:2.35,
      rise:prelude+1.65,
      collapseEnd:prelude+2.15,
      holdEnd:prelude+2.65,
      fadeEnd:prelude+2.95,
      revealStart:prelude+2.35,
      revealDuration:1.90,
      fireworksStart:prelude+4.25,
      fireworksEnd:prelude+4.75,
      pulseStart:prelude+4.75,
      headSize:1.65,
      headBrightness:1.80,
      maxPointSize:30.0
    },
    burst:{ gatherStart:1.25, end:4.05 },
    pulse:{ period:6.4, duration:1.8 },
    palettes:{
      blue:[
        [0.42,0.68,0.94],[0.55,0.78,1.0],[0.68,0.86,1.0],
        [0.82,0.94,1.0],[0.48,0.75,1.0]
      ],
      ribbon:[
        [0.62,0.85,1.0],[0.78,0.93,1.0],[0.91,0.98,1.0],
        [0.55,0.80,1.0],[0.76,0.72,1.0]
      ],
      heart:[
        [0.66,0.56,1.0],[0.82,0.66,1.0],[1.0,0.62,0.82],[0.88,0.82,1.0]
      ],
      gold:[
        [0.72,0.61,0.40],[0.86,0.75,0.52],[0.95,0.86,0.65],[0.80,0.86,0.94]
      ]
    }
  };
})(window.ChristmasScene=window.ChristmasScene||{});
