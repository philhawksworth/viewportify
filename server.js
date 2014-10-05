var Hapi = require("hapi");
var Path = require('path');
var formidable = require('formidable');
var Datastore = require('nedb');
var fs = require('fs');

var db = new Datastore({filename: 'datastore.json', autoload: true });

var graphs = [];

var server = new Hapi.Server(8080, "localhost", {
  views: {
    engines: {
      html: require('swig')
    },
    path: './views'
  }
});

// update the listing of files
fs.readdir("./graphs", function(err, files){
  graphs = files;
});


// render the home page with a load of thumbnails in the gallery
server.route({
  path: "/",
  method: "GET",
  handler: function(request, response) {
    // array of thumbnail file names in the graphs directory
    response.view("home", { thumbs : graphs});
  }
});

// route requests for the creation form page
server.route({
  path: "/make",
  method: "GET",
  handler: function(request, response) {
    response.view("make");
  }
});


// route requests for a specific graph form page
server.route({
  path: "/graph/{id}",
  method: "GET",
  handler: function(request, response) {
    // get the graph data from the db and return it in the page
    db.findOne({"_id": request.params.id}).exec(function (err, docs) {
      response.view("graph", { data : docs.data });
    });
  }
});


// route requests for the graph images
server.route({
  method: 'GET',
  path: '/graphs/{param*}',
  handler: {
    directory: {
      path: "./graphs",
    }
  }
});


// route requests for the cms site assets.
server.route({
  method: 'GET',
  path: '/assets/{param*}',
  handler: {
    directory: {
      path: "./assets",
    }
  }
});



// handle the posting of data updates
server.route({
  path: "/make",
  method: "POST",
  handler: function(request, response) {

    // Add the data to the database then redirect the user to the render page for the graph
    db.insert({ data : request.payload.data } , function (err, newDoc) {
      var imgData = request.payload.thumbnail.replace(/^data:image\/png;base64,/, "");
      fs.writeFile('./graphs/'+ newDoc._id +".png", imgData, "base64", function (err) {
        if (err) throw err;
        // update the listing of files
        fs.readdir("./graphs", function(err, files){
          graphs = files;
        });
      });
      response.redirect('/graph/'+ newDoc._id);
    });

  }
});


// start the server
server.start(function() {
  console.log("server running ");
});
