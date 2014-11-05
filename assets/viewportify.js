var vp = {

  canvas : null,
  data : {},
  padding : 300,
  imgsrc : null,

  // full page view grabbing data from the object in the page
  generateFromDataInPage : function () {
    var data = vp.scale(pageData, 1500);
    vp.constructGraph(data, false);
  },


  // preview graph grabbing data from the form
  generateFromForm : function () {
    vp.data = vp.makeData();
    var data = vp.scale(vp.data, 300);
    vp.constructGraph(data, true);
    var savestep = document.querySelectorAll(".savestep");
    if(savestep.length) {
      savestep[0].style.display = "block";
      savestep[1].style.display = "block";
    }
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

     // add padding to the canvas
     data.width += (2 * vp.padding);
     data.height += (2 * vp.padding);

     return data;
 },


  constructGraph : function (data, thumbnail) {

    // Create the canvas at the right size for the content
    var c = document.querySelector("#canvas");
    c.width = data.width;
    c.height = data.height;
    vp.canvas = oCanvas.create({
      canvas: "#canvas",
      background: data.bgcolour
    });

    vp.canvas.draw.clear();
    vp.generateViewports(data , thumbnail);

    // don't add the text label to the thumbnail
    console.log("thumbnail? ", thumbnail);
    if(!thumbnail){
      vp.addText(data.name, data.colour, data.bgcolour);
    }

    // generate an image
    var imgsrc = c.toDataURL("image/png");

    var img = document.querySelector("#output");
    img.src = vp.imgsrc = imgsrc;

  },


  generateViewports : function (data, thumbnail) {
    for (var i = 0; i < data.viewports.length; i++) {
      vp.drawViewport(data.viewports[i].w, data.viewports[i].h, data.colour, thumbnail);
    }
  },


  drawViewport : function (width, height, col, thumbnail) {
    var c = vp.canvas;
    var block = c.display.rectangle({
      x: ((c.width - width) / 2),
      y: ((c.height - height) / 2),
      width: width,
      height: height,
      fill: "rgba("+ col.r +", "+ col.g +", "+ col.b +", 0.1)",
      stroke: thumbnail ? "" : "inside 1px rgba("+ col.r +", "+ col.g +", "+ col.b +", 0.7)"
    });
    c.addChild(block);
  },


  addText : function (str, col, bgcolour) {
    var c = vp.canvas;
    var shadow = c.display.text({
      x: (c.width / 2) + 1,
      y: (c.height / 2) + 1,
      origin: { x: "center", y: "center" },
      font: "bold 60px sans-serif",
      text: str,
      fill: "rgba("+ col.r +", "+ col.g +", "+ col.b +", 1)"
    });
    c.addChild(shadow);
    var text = c.display.text({
      x: c.width / 2,
      y: c.height / 2,
      origin: { x: "center", y: "center" },
      font: "bold 60px sans-serif",
      text: str,
      fill: bgcolour,
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
    console.log("Payload", vp.data );
    document.querySelector('#graphData').value = JSON.stringify(vp.data);
    document.querySelector('#thumbnail').value = vp.imgsrc;
    return true;
  },


  // scale to the data values for a smaller thumbnail to be generated
  scale : function(data, maxheight) {
    
    var scaledData = vp.clone(data);

    // calc ratio to give a max height
    var r = data.height / maxheight;

    scaledData.height = parseInt(data.height / r, 10);
    scaledData.width = parseInt(data.width / r, 10);
    if(scaledData.width < 400){
      scaledData.width = 400;
    }
    for (var i = scaledData.viewports.length - 1; i >= 0; i--) {
      scaledData.viewports[i].h = parseInt(data.viewports[i].h / r, 10);
      scaledData.viewports[i].w = parseInt(data.viewports[i].w / r, 10);
    }
    // console.log(r);
    // var maxwidth = vp.data.width / r;
    // console.log(maxwidth);
    return scaledData;
  },



  clone : function (src) {
    function mixin(dest, source, copyFunc) {
      var name, s, i, empty = {};
      for(name in source){
        // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
        // inherited from Object.prototype.  For example, if dest has a custom toString() method,
        // don't overwrite it with the toString() method that source inherited from Object.prototype
        s = source[name];
        if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
          dest[name] = copyFunc ? copyFunc(s) : s;
        }
      }
      return dest;
    }
    if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
      // null, undefined, any non-object, or function
      return src; // anything
    }
    
    if(src.nodeType && "cloneNode" in src){
      // DOM Node
      return src.cloneNode(true); // Node
    }
    if(src instanceof Date){
      // Date
      return new Date(src.getTime()); // Date
    }
    if(src instanceof RegExp){
      // RegExp
      return new RegExp(src);   // RegExp
    }
    var r, i, l;
    if(src instanceof Array){
      // array
      r = [];
      for(i = 0, l = src.length; i < l; ++i){
        if(i in src){
          r.push(vp.clone(src[i]));
        }
      }
    }else{
      // generic objects
      r = src.constructor ? new src.constructor() : {};
    }
    return mixin(r, src, vp.clone);
  }


};
