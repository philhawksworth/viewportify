
var vp = {

  canvas : null,

  processForm : function () {

    var data = vp.formatData();

    // Create the canvas at the right size for the content
    var c = document.querySelector("#canvas");

    c.width = data.width;
    c.height = data.height;
    vp.canvas = oCanvas.create({
      canvas: "#canvas",
      background: data.bgcolour
    });

    vp.generateViewports(data);
    vp.addText(data);

    // console.log("vp.canvas", vp.canvas);

    var imgsrc = vp.canvas.toDataURL("image/png");
    return false;
  },


  formatData : function () {

    var data = {
      colour : null,
      bgcolour : null,
      height : 0,
      width : 0,
      viewports : [],
      name : null
    };

    data.colour = vp.hexToRgb(document.querySelector('#colour').value);
    data.bgcolour = document.querySelector('#bgcolour').value;
    data.name = document.getElementById('url').value;

    var lines = document.querySelector('#csv').value.trim().split('\n');
    data.viewports = [];
    for (var i = 0; i < lines.length; i++) {

      // populate the viewports objects array
      var dimensions = lines[i].split('x');
      data.viewports.push({
        w : dimensions[1],
        h : dimensions[0],
      });

      // determine the canvas size needed
      var x = parseInt(dimensions[1], 10);
      var y = parseInt(dimensions[0], 10);
      if(x > data.width) {
         data.width = x;
      }
      if(y > data.height) {
         data.height = y;
      }

    }
    return data;
  },

  generateViewports : function (data) {
    vp.canvas.draw.clear();
    for (var i = 0; i < data.viewports.length; i++) {
      vp.drawViewport(data.viewports[i].w, data.viewports[i].h, data);
    }
  },


  drawViewport : function (width, height, data) {
    var canvas = vp.canvas;
    var block = canvas.display.rectangle({
      x: (canvas.width - width) / 2,
      y: (canvas.height - height) / 2,
      width: width,
      height: height,
      fill: "rgba("+ data.colour+", 0.1)",
      stroke: "inside 1px rgba("+ data.colour+", 0.7)"
    });
    canvas.addChild(block);
  },


  addText : function (data, cb) {
    var shadow = vp.canvas.display.text({
      x: (vp.canvas.width / 2) + 1,
      y: (vp.canvas.height / 2) + 1,
      origin: { x: "center", y: "center" },
      font: "bold 90px sans-serif",
      text: data.name,
      fill: "rgba("+ data.colour+", 1)",
    });
    vp.canvas.addChild(shadow);
    var text = vp.canvas.display.text({
      x: vp.canvas.width / 2,
      y: vp.canvas.height / 2,
      origin: { x: "center", y: "center" },
      font: "bold 90px sans-serif",
      text: data.name,
      fill: data.bgcolour,
    });
    vp.canvas.addChild(text);
  },


  hexToRgb : function (hex) {
    hex = hex.replace("#","");
    return parseInt((hex).substring(0,2),16) + ","+
      parseInt((hex).substring(2,4),16) + ","+
      parseInt((hex).substring(4,6),16);
  }


};
