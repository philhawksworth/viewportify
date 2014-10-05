var vp = {

  canvas : null,
  data : {},
  padding : 100,
  imgsrc : null,

  generateFromDataInPage : function () {
    vp.data = pageData;
    vp.constructGraph();
  },

  generateFromForm : function () {
    vp.data = vp.makeData();
    vp.constructGraph();
  },

  // gather data from the form and stash it in an object
  makeData : function () {

     var data = {
       colour : null,
       bgcolour : null,
       height : 0,
       width : 0,
       viewports : [],
       name : null
     };

     data.colour = vp.hexToRgb(document.querySelector('#colour').value);
     data.bgcolour = "#ffffff";
    //  data.bgcolour = document.querySelector('#bgcolour').value;
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
       var x = parseInt(dimensions[1]);
       var y = parseInt(dimensions[0]);
       if(x > data.width) {
          data.width = x;
       }
       if(y > data.height) {
          data.height = y;
       }
     }

     // add padding to the canvas
     data.width += (2 * vp.padding);
     data.height += (2 * vp.padding);

     return data;
 },


  constructGraph : function () {

    // Create the canvas at the right size for the content
    var c = document.querySelector("#canvas");
    c.width = vp.data.width;
    c.height = vp.data.height;
    vp.canvas = oCanvas.create({
      canvas: "#canvas",
      background: vp.data.bgcolour
    });

    vp.canvas.draw.clear();
    vp.generateViewports();
    vp.addText(vp.data.name);

    // generate an image
    var imgsrc = c.toDataURL("image/png");
    var img = document.querySelector("#output");
    img.src = vp.imgsrc = imgsrc;

    document.querySelector("#savestep").style.display = "block";

  },


  generateViewports : function () {
    for (var i = 0; i < vp.data.viewports.length; i++) {
      vp.drawViewport(vp.data.viewports[i].w, vp.data.viewports[i].h);
    }
  },


  drawViewport : function (width, height) {

    var c = vp.canvas;
    var col = vp.data.colour;
    var block = c.display.rectangle({
      x: ((c.width - width) / 2),
      y: ((c.height - height) / 2),
      width: width,
      height: height,
      fill: "rgba("+ col.r +", "+ col.g +", "+ col.b +", 0.1)",
      stroke: "inside 1px rgba("+ col.r +", "+ col.g +", "+ col.b +", 0.7)"
    });
    c.addChild(block);
  },


  addText : function (str) {
    var c = vp.canvas;
    var col = vp.data.colour;
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
      fill: vp.data.bgcolour,
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
  },

  setPayload : function () {
    document.querySelector('#graphData').value = JSON.stringify(vp.data);
    document.querySelector('#thumbnail').value = vp.makeThumbnail();
    return true;
  },

  makeThumbnail : function () {

    return vp.imgsrc;

    // var canvas = document.querySelector("#canvas");
    // var context = canvas.getContext('2d');

//     var resizer = document.querySelector("#resizer");
//     resizer.width = img.width;
//     resizer.height = img.height;
//
// console.log("src", img.src);
//
//     var canvas = oCanvas.create({
//       canvas: "#resizer",
//     });
//
//     var image = canvas.display.image({
//     	x: 0,
//     	y: 0,
//     	// origin: { x: "center", y: "center" },
//     	image: vp.imgsrc,
//       height: resizer.height,
//       width: resizer.width
//     });
//     canvas.addChild(image);


    // return context.getImageData(0,0,canvas.width, canvas.height);
  }


};
