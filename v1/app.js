require("dotenv").config();
console.log(process.env.AWS_KEY);

var express = require("express");
var app = express();
var fileUpload = require('express-fileupload');
app.use(fileUpload());
var request = require("request");
var knox = require("knox-s3");
var s3 = require('s3');


var fs = require('fs');

var AWS = require('aws-sdk');

var bodyparser  = require("body-parser");

app.use(bodyparser.urlencoded({extended: true}));

app.use(express.static("public"));
app.set("view engine", "ejs");


var client = knox.createClient({
    key: process.env.AWS_KEY
  , secret: process.env.AWS_SECRET
  , bucket: process.env.AWS_BUCKET
});

var clientS3 = s3.createClient({
    maxAsyncS3: 20,     // this is the default 
    s3RetryCount: 3,    // this is the default 
    s3RetryDelay: 1000, // this is the default 
    multipartUploadThreshold: 209715200, // this is the default (20 MB) => Changed to 200 MB
    multipartUploadSize: 157286400, // this is the default (15 MB) => Changed to 150 MB
    s3Options: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      // any other options are passed to new AWS.S3() 
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
    },
});


app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/upload-test", function(req, res) {
    res.render("upload-test");
});

app.post('/upload-test', function(req, res) {
    console.log(req.files); // the uploaded file object

    var sampleFile = req.files.sampleFile;

    var convertedSampleFile = JSON.stringify(sampleFile);

    fs.writeFile("./upload_data/current_upload.txt", convertedSampleFile, function(err) {
        if(err) {
            console.log("The current upload was not saved!");
            return console.log(err);
        }

        console.log("The current upload was saved!");

        var params = {
            localFile: "./upload_data/current_upload.txt",
           
            s3Params: {
              Bucket: "dkoupload",
              Key: "current_upload.txt",
              // other options supported by putObject, except Body and ContentLength. 
              // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
            },
        };
    
        var uploader = clientS3.uploadFile(params);
        uploader.on('error', function(err) {
            console.error("unable to upload:", err.stack);
        });
        uploader.on('progress', function() {
            console.log("progress", uploader.progressMd5Amount,
                    uploader.progressAmount, uploader.progressTotal);
        });
        uploader.on('end', function() {
            console.log("done uploading");
            //res.redirect("/download-test");
            res.send("done uploading file");
        }); 
    });
});

app.get("/download-test", function(req, res) {
    var localFile = "./upload_data/download_upload.txt"
    var params = {
        localFile: localFile,
       
        s3Params: {
          Bucket: "dkoupload",
          Key: "current_upload.txt",
          // other options supported by getObject 
          // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property 
        },
    };
    var downloader = clientS3.downloadFile(params);
        downloader.on('error', function(err) {
        console.error("unable to download:", err.stack);
    });
    downloader.on('progress', function() {
        console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    downloader.on('end', function() {
        console.log("done downloading");
        fs.readFile(localFile, function (err, data) {
            if (err) { 
                console.log("download error");
                console.log(err);
            }

            var parsedData = JSON.parse(data);
            var name = "./upload_data/converted_" + parsedData.name;
            console.log("pringing name " + name);
            console.log(name);
            fs.writeFile(name, new Buffer(parsedData.data), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The download file was saved!");
                res.send("File downloaded");
            });
        });
    });
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
