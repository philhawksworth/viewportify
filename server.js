var Hapi = require("hapi");
var Path = require('path');
var Datastore = require('nedb');
var fs = require('fs');
var AWS = require('aws-sdk');

var bucket = 'graphs.viewports.hawksworx.com';
AWS.config.update({ accessKeyId:  process.env.S3KEYID, secretAccessKey: process.env.S3SECRET });


var db = new Datastore({filename: 'datastore.json', autoload: true });


// stash the list of graph images rathe than require a db listing each request
var graphs = [];

refreshList();

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
    // array of thumbnail file names in the graphs directory
    response.view("home", { graphs : graphs, bucket : bucket});
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
      var base64data = new Buffer(imgData, 'base64');

      var s3bucket = new AWS.S3({params: {Bucket: bucket}});
      var data = {
        Key: newDoc._id + ".png",
        Body: base64data,
        ContentType: "image/png",
        Expires: 'Sun, 17-Jan-2038 19:00:00 GMT'
      };
      s3bucket.putObject(data, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded data to myBucket/myKey");
        }
      });

      // graphs.push("http://" + bucket + "/" + newDoc._id + ".png");

      // update the list of all known graphs
      refreshList();

      response.redirect('/graph/'+ newDoc._id);
    });

  }
});


function refreshList(){
  db.find({}).exec(function (err, docs) {
    for (var i = 0; i < docs.length; i++) {
      graphs.push(docs[i]._id);
    }
  });
}

// start the server
server.start(function() {
  console.log("server running ");
});
