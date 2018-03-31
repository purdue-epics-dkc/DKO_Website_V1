var express     = require("express");
var app         = express();
var bodyparser  = require("body-parser");
var request  = require("request");

var mongoose    = require("mongoose");

mongoose.connect("mongodb://localhost/dko_auth1");
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

var videoSchema = new mongoose.Schema({
    user_id: String, 
    admin_id: String, 
    tree_path: String,
    domain: String,
    topic: String, 
    title: String, 
    description: String, 
    url: String,
    uploaded: Boolean,
    approved: Boolean
}, { collection: 'videos_info' });

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

app.get("/all-results/:domain_id/:video_id", function(req, res) {
    var topic = "trigonometry";
    var topic_id = req.params.video_id;
    if (!(topic_id.length == 0 || topic_id == null)) {
        topic = topic_id;
    } else {
        res.send("Invalid topic");
        return;
    }

    console.log("\n\nDOWNLOADING" + topic + "\n\n");

    var domain = "math";
    var domain_id = req.params.domain_id;

    if (!(domain_id.length == 0 || domain_id == null)) {
        domain = domain_id;
    } else {
        res.send("Invalid domain");
        return;
    }

    var path = domain + "+$+";

    createRequestWithTopic(topic, path);
    res.send("<h1>Got All Results</h1>")
});

function createRequestWithTopic(topic, path) {
    var topicUrl = "http://www.khanacademy.org/api/v1/topic/" + topic;

    request(topicUrl, function(error, response, body) {
        if(!error && response.statusCode == 200){
            var data = JSON.parse(body);
            goThroughChildren(data.children, topic, "math", path+topic);
        }  
    });
}

function goThroughChildren(children, topic, domain, path) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        console.log(child.kind);
        if (child.kind == "Video") {
            addChildToDatabase(child, topic, domain, path)
        }
        else if (child.kind == "Topic") {
            var currentTopic = child.node_slug;
            createRequestWithTopic(currentTopic, path+"+$+");
        }
    }
}

function addChildToDatabase(child, topic, domain, path) {
    var data = {
        user_id: null, 
        admin_id: null,
        tree_path: path,
        domain: domain,
        topic: topic, 
        title: child.translated_title, 
        description: child.description, 
        url: child.url,
        uploaded: false,
        approved: false
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
