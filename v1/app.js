require("dotenv").config();
console.log(process.env.AWS_KEY);

var express = require("express");
var app = express();
var fileUpload = require('express-fileupload');
app.use(fileUpload());
var request = require("request");
var knox = require("knox-s3");



var bodyparser  = require("body-parser");

app.use(bodyparser.urlencoded({extended: true}));

app.use(express.static("public"));
app.set("view engine", "ejs");


var client = knox.createClient({
    key: process.env.AWS_KEY
  , secret: process.env.AWS_SECRET
  , bucket: process.env.AWS_BUCKET
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/upload-test", function(req, res) {
    res.render("upload-test");
});

app.post('/upload-test', function(req, res) {
    console.log(req.files); // the uploaded file object

    // var object = { foo: "bar" };
    // var string = JSON.stringify(object);
    // var req = client.put('/test/obj.json', {
    //     'Content-Length': Buffer.byteLength(string)
    //     , 'Content-Type': 'application/json'
    // });
    // req.on('response', function(res){
    //     if (200 == res.statusCode) {
    //         console.log('saved to %s', req.url);
    //     }
    // });
    // req.end(string);

});

app.get("/user/signup", function(req, res) {
    res.render("user/signup");
});

app.get("/admin/signup", function(req, res) {
    res.render("admin/signup");
});

app.post("/login", function(req, res) {
    //console.log(req);
    console.log("username: " + req.body.username);
    console.log("password: " + req.body.password);
    /*
        if (username belongs to user) then redirect to /user/home
        if (username belongs to admin) then redirect to /admin/home 
    */
    //res.redirect("/user/:id/home");
    //res.redirect("/admin/:id/home");

    res.redirect("/user/home");
});

app.get("/user/home", function(req, res) {
    res.render("user/home");
});

app.get("/admin/home", function(req, res) {
    res.render("admin/home");
});

app.get("/videos", function(req, res) {

    //res.send("<h1>Videos</h1>");
    //console.log(req);

    //var searchRoute = "http://www.khanacademy.org/api/v1/topic/trigonometry";
    var searchRoute = "http://www.khanacademy.org/api/v1/topictree";
    request(searchRoute, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            //res.send(body);
            var parsedData = JSON.parse(body);

            console.log(parsedData);
            if (parsedData["Response"] == "False") {
                res.send("<h1>No Exercise Found!</h1>");
            }
            else {
                parsedData = parsedData["children"];
                res.send(parsedData);
            }
        }
        else {
            res.send(error);
        }
    });
});

app.get("/video/:id", function(req, res) {
    console.log("video selected: " + req.params.id);
    var currVideo = {
        id: req.params.id
    }
    res.render("video/new", {video: currVideo});
});

app.post("/video/:id", function(req, res) {
    console.log("video upload: " + req.params.id);
    res.redirect("/video/" + req.params.id +"/upload");
});

app.get("/video/:id/upload", function(req, res) {
    console.log("video upload redirect: " + req.params.id);
    var currVideo = {
        id: req.params.id
    }
    res.render("video/upload", {video: currVideo});
});

app.get("*", function(req, res) {
    res.render("landing");
});

app.listen(3000, function() {
    console.log("you have started your server");

});
