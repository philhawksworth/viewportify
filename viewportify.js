var viewportify = {

  viewports : [],
  colour : null,
  bgcolour : null,
  maxx : 0,
  maxy : 0,
  canvas : null,

  formatData : function (e) {

    viewportify.colour = viewportify.hexToRgb(document.querySelector('#colour').value);
    viewportify.bgcolour = document.querySelector('#bgcolour').value;

    var lines = document.getElementById('csv').value.trim().split('\n');
    viewportify.viewports = [];
    for (var i = 0; i < lines.length; i++) {

      // populate the viewports objects array
      var dimensions = lines[i].split('x');
      viewportify.viewports.push({
        w : dimensions[1],
        h : dimensions[0],
      });

      // determine the canvas size needed
      var x = parseInt(dimensions[1]);
      var y = parseInt(dimensions[0]);
      if(x > viewportify.maxx) {
        viewportify.maxx = x;
      }
      if(y > viewportify.maxy) {
        viewportify.maxy = y;
      }
    }

    // Create the canvas at the right size for the content
    var c = document.querySelector("#canvas");
    c.width = viewportify.maxx;
    c.height = viewportify.maxy;
    viewportify.canvas = oCanvas.create({
      canvas: "#canvas",
      background: viewportify.bgcolour
    });

    viewportify.canvas.draw.clear();
    viewportify.generateViewports();
    viewportify.addText(document.getElementById('url').value);

    // generate an image
    var imgsrc = c.toDataURL("image/png");
    var img = document.querySelector("#thumb");
    img.src= imgsrc;
    return false;
  },


  generateViewports : function () {
    for (var i = 0; i < viewportify.viewports.length; i++) {
      viewportify.drawViewport(viewportify.viewports[i].w, viewportify.viewports[i].h);
    }
  },


  drawViewport : function (width, height) {
    var c = viewportify.canvas;
    var col = viewportify.colour;
    var block = c.display.rectangle({
      x: (c.width - width) / 2,
      y: (c.height - height) / 2,
    	width: width,
    	height: height,
    	fill: "rgba("+ col.r +", "+ col.g +", "+ col.b +", 0.1)",
      stroke: "inside 1px rgba("+ col.r +", "+ col.g +", "+ col.b +", 0.7)"
    });
    c.addChild(block);
  },


  addText : function (str) {
    var c = viewportify.canvas;
    var col = viewportify.colour;
    var shadow = c.display.text({
      x: (c.width / 2) + 1,
      y: (c.height / 2) + 1,
      origin: { x: "center", y: "center" },
      font: "bold 90px sans-serif",
      text: str,
      fill: "rgba("+ col.r +", "+ col.g +", "+ col.b +", 1)"
    });
    c.addChild(shadow);
    var text = c.display.text({
      x: c.width / 2,
      y: c.height / 2,
    	origin: { x: "center", y: "center" },
    	font: "bold 90px sans-serif",
    	text: str,
    	fill: viewportify.bgcolour,
    });
    c.addChild(text);
  },


  hexToRgb : function (hex) {
    hex = hex.replace("#","");
    var rgb = {
      r : parseInt((hex).substring(0,2),16),
      g : parseInt((hex).substring(2,4),16),
      b : parseInt((hex).substring(4,6),16)
    };
    return rgb;
  }


};
