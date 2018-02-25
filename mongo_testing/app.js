var express     = require("express");
var app         = express();
var bodyparser  = require("body-parser");
var request  = require("request");

var mongoose    = require("mongoose");

mongoose.connect("mongodb://localhost/dko_test1");
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

var videoSchema = new mongoose.Schema({
    domain: String,
    topic: String, 
    title: String, 
    description: String, 
    url: String
});

var urlToParse = "http://www.khanacademy.org/api/v1/topic/law-of-sines";

var mainUrl = "http://www.khanacademy.org/api/v1/topic/math";

var Video = mongoose.model("video", videoSchema);

app.get("/results", function(req, res)
{
    request(urlToParse, function(error, response, body){
        if(!error && response.statusCode == 200){
            var data = JSON.parse(body);
            res.send("<h1>Got All Results</h1>")
            goThroughChildren(data.children, "law-of-sines", "math");
        }       
    });
});

app.get("/all-results", function(req, res) {
    var topic = "trigonometry";
    createRequestWithTopic(topic);
    res.send("<h1>Got All Results</h1>")
});

function createRequestWithTopic(topic) {
    var topicUrl = "http://www.khanacademy.org/api/v1/topic/" + topic;

    request(topicUrl, function(error, response, body) {
        if(!error && response.statusCode == 200){
            var data = JSON.parse(body);
            goThroughChildren(data.children, topic, "math");
        }  
    });
}

function goThroughChildren(children, topic, domain) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        console.log(child.kind);
        if (child.kind == "Video") {
            addChildToDatabase(child, topic, domain)
        }
        else if (child.kind == "Topic") {
            var currentTopic = child.node_slug;
            createRequestWithTopic(currentTopic);
        }
    }
}

function addChildToDatabase(child, topic, domain) {
    var data = {
        domain: domain,
        topic: topic, 
        title: child.translated_title, 
        description: child.description, 
        url: child.url 
    };
    // console.log(data);
    Video.create(data, function(err, video) {
        if (err) {
            console.log("Error adding child to database\n" + child);
            console.log(err);
        } else {
            console.log("Created Video " + data.title);
            // console.log(video);
        }
    });
}

app.listen(3000, function(req, res) {
    console.log("Started Mongo Testing Server");
});


// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/";

// var express = require("express");
// var app = express();
// var request = require("request");
// //app.set("view engine", "ejs"); 

// app.get("/results", function(req, res)
// {
//     request("https://www.khanacademy.org/api/v1/topic/cc-early-math-counting/videos", function(error, response, body){
//         if(!error && response.statusCode == 200){
//             var data = JSON.parse(body) 
//         }       
//     });
// });

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("Videos");url
//   var myobj = { ka_url: "******", title: "******"  ,description: "******", downloadURL: "******", url: "******"};
//   dbo.collection("video").insertOne(myobj, function(err, res) {
//     if (err) throw err;
//     console.log("1 document inserted");

//     dbo.collection("video").find({}).toArray(function(err, result) {
//     if (err) throw err;
//     console.log(result);
//   });
//     db.close();
//   });
// });