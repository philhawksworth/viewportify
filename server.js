var Hapi = require("hapi");
var Path = require('path');
var fs = require('fs');
var AWS = require('aws-sdk');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var shortId = require('short-mongo-id');

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/testdb';
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo db connection error:'));
db.once('open', function callback () {
  console.log("mongo db connected.");
});

var graphSchema = mongoose.Schema({
    id: String,
    url: String,
    data: String
});
var Graph = mongoose.model('Graph', graphSchema);

// configure access to S3
var bucket = 'graphs.viewports.hawksworx.com';
AWS.config.update({ accessKeyId:  process.env.S3KEYID, secretAccessKey: process.env.S3SECRET });

// configure the server
var server = new Hapi.Server((process.env.PORT || 5000), {
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
    Graph.find().sort('-_id').exec(function (err, graphs) {
      if (err) return console.error(err);
      response.view("home", { graphs : graphs, bucket : bucket});
    });
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
    Graph.find({ id: request.params.id }, function(err, graph){
      if(err) {
        console.error(error);
      }
      response.view("graph", { graph : graph[0], bucket: bucket });
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


// route requests for the site assets.
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

    var graph = new Graph({ id: 'the-id', url: JSON.parse(request.payload.data).name, data: request.payload.data });
    graph.id = shortId(graph._id); // give it a url freindly short id;
   
    // Add the data to the database,
    // upload a thumbnail to S3
    // redirect the user to the render page for the graph 
    graph.save(function(err, graph){
      var imgData = request.payload.thumbnail.replace(/^data:image\/png;base64,/, "");
      var base64data = new Buffer(imgData, 'base64');
      var s3bucket = new AWS.S3({params: {Bucket: bucket}});
      var data = {
        Key: graph.id + ".png",
        Body: base64data,
        ContentType: "image/png",
        Expires: 153792000 // 5 years
      };
      s3bucket.putObject(data, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded data to myBucket/myKey");
        }
      });
      response.redirect('/graph/'+ graph.id);
    });

  }
});

// start the server
server.start(function() {
  console.log("server running ");
});
