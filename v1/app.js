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
    multipartUploadThreshold: 20971520, // this is the default (20 MB) 
    multipartUploadSize: 15728640, // this is the default (15 MB) 
    s3Options: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      // any other options are passed to new AWS.S3() 
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
    },
});

// AWS.config.update({ accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET });


app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/upload-test", function(req, res) {
    res.render("upload-test");
});

app.post('/upload-test', function(req, res) {
    console.log(req.files); // the uploaded file object

    var sampleFile = req.files.sampleFile;

    console.log(Buffer.byteLength(sampleFile.data, '7bit'));

    contentLength = Buffer.byteLength(sampleFile.data, '7bit');
    contentType = sampleFile.mimetype;

    console.log(req);

    var convertedSampleFile = JSON.stringify(sampleFile);

    var params = {
        localFile: "./current_upload.txt",
       
        s3Params: {
          Bucket: "dkoupload",
          Key: "current_upload.txt",
          // other options supported by putObject, except Body and ContentLength. 
          // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
        },
    };

    console.log("Client Printout")
    console.log(clientS3);

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
    });
      
    // fs.writeFile("./current_upload.txt", convertedSampleFile, function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    
    //     console.log("The file was saved!");
    // });

    // fs.writeFile("./" + sampleFile.name, sampleFile.data, function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    
    //     console.log("The file 2 was saved!");
    // });

    // fs.readFile("./current_upload.txt", function (err, data) {
    //     if (err) { throw err; }

    //     var base64data = new Buffer(data, 'binary');

    //     var s3 = new AWS.S3();
    //     s3.client.upload({
    //         Bucket: 'dkoupload',
    //         Key: 'current_upload.txt',
    //         Body: base64data,
    //         ACL: 'public-read'
    //     },function (resp) {
    //         console.log(arguments);
    //         console.log('Successfully uploaded package.');
    //     });
    // });

    // var toUpload = client.put('/test/' + sampleFile.name, {
    //     'Content-Length': contentLength.toString()
    //   , 'Content-Type': contentType
    // });

    // toUpload.on('response', function(resUpload){
    //     if (200 == resUpload.statusCode) {
    //       console.log('saved to %s', toUpload.url);
    //     }
    //   });
    // toUpload.end(sampleFile);

    // var headers = {
    //     'Content-Length': contentLength.toString()
    //   , 'Content-Type': contentType
    // };

    // client.putStream(res, '/doodle.png', headers, function(err, res){
    //     // check `err`, then do `res.pipe(..)` or `res.resume()` or whatever.
    // });

    // var headers = {
    //     'Content-Length': res.headers['content-length']
    //     , 'Content-Type': res.headers['content-type']
    // };

    // var name = "/test/" + sampleFile.name;
    // console.log(name);

    // http.get('http://google.com/doodle.png', function(res){

    // client.putStream(res, '/doodle.png', headers, function(err, res){
    //     // check `err`, then do `res.pipe(..)` or `res.resume()` or whatever.
    // });
    // });

    // var req = client.put(name, {
    //     'Content-Length': Buffer.byteLength(sampleFile)
    //     , 'Content-Type': 'application/json'
    // });

    // req.on('response', function(res){
    //     if (200 == res.statusCode) {
    //         console.log('saved to %s', req.url);
    //     }
    // });
    // req.end(sampleFile);

    // var object = { foo: "bar" };
    // var string = JSON.stringify(object);
    // 


});

app.get("/download-test", function(req, res) {
    var params = {
        localFile: "download_upload.txt",
       
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
        fs.readFile("./download_upload.txt", function (err, data) {
            //     if (err) { throw err; }
            // console.log(data.name);
            var name = JSON.parse(data);
            console.log(name);
            fs.writeFile("./downloaded.pdf", new Buffer(name.data), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file 2 was saved!");
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
