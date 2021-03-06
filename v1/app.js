require("dotenv").config();

var express = require("express");
var mongoose = require("mongoose");
var request = require("request");
var passport = require("passport");
var bodyparser  = require("body-parser");

// Authentication requires
var User = require("./models/user");
var localStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");

mongoose.connect("mongodb://localhost/dko_auth1");

var app = express();

// mongo stuff



var videoSchema = new mongoose.Schema({
    user_id: String, 
    admin_id: String, 
    tree_path: String,
    domain: String,
    topic: String, 
    title: String, 
    description: String, 
    ka_url: String,
    youtube_url: String,
    embed_url: String,
    image_url: String,
    uploaded: Boolean,
    approved: Boolean
}, { collection: 'videos_info' });

var Video = mongoose.model("video", videoSchema);

// AWS Upload requires
var knox = require("knox-s3");
var s3 = require('s3');
var fs = require('fs');
var AWS = require('aws-sdk');
var fileUpload = require('express-fileupload');

app.use(fileUpload());
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(require("express-session") ({
    secret: "DKOWebsite", 
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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

app.get("/select-videos", isLoggedIN, function(req, res) {
    var subjects = ["math", "science", "computing"];
    var topics = {
        "math": ["early-math", "ap-calculus-ab", "trigonometry", "algebra", "multivariable-calculus", "geomtry", 
        "arithmetic", "precalculus", "pre-algebra", "differential-equations", "ap-calculus-bc", "algebra2", 
        "linear-algebra", "ap-statistics", "statistics-probability"],
        "science": ["physics", "chemistry", "organic-chemistry", "biology", "high-school-biology",
        "cosmology-and-astronomy", "electrical-engineering", "health-and-medicine", "science-engineering-partners"],
        "computing": ["computer-programming", "hour-of-code", "computer-animation"]
    };

    res.render("select-videos", {topics: topics});
});

app.get("/delete-all-videos/", function(req, res) {
    Video.find({uploaded: true}, function(err, foundVideos) {
        foundVideos.forEach(function(video){
            console.log(video);
            Video.update({ _id: video.id }, { $set: { uploaded: false }}).exec();
        });
    });

    res.render("user/home");
});

app.get("/download-videos/", isLoggedIN, function(req, res) {
    Video.find({uploaded: true}, function(err, foundVideos) {
        if (err) {
            res.err(err + " \n " + regexQuery);
        } else {
            // res.send(foundVideos);
            res.render("download-videos", {videos: foundVideos});
        }
    })
});

app.get("/select-videos/:domain/:topic", isLoggedIN, function(req, res) {
    var regexQuery = '^' + req.params.domain + '\\+\\$\\+' + req.params.topic + '.*';
    console.log(regexQuery);
    Video.find({ tree_path: { $regex: regexQuery} }, function(err, foundVideos) {
        if (err) {
            res.err(err + " \n " + regexQuery);
        } else {
            // res.send(foundVideos);
            res.render("selected-videos", {domain: req.params.domain, topic: req.params.topic, videos: foundVideos});
        }
    });
});

// computing/computer-programming
// computing/computer-science
// math/multivariable-calculus


// db.videos_info.find({ tree_path: { $regex: '^math\\+\\$\\+geometry\\+\\$\\+hs\\-geo\\-f.*'} }).count()

app.get("/upload/:id/", isLoggedIN, function(req, res) {
    console.log("video selected: " + req.params.id);

    Video.findById(req.params.id, function(err, currVideo) {
        if (err) {
            res.err(err + " \n " + regexQuery);
        } else {
            console.log(currVideo);
            res.render("upload-test", {video: currVideo});
        }
    });
});

app.post('/upload-test/:id', isLoggedIN, function(req, res) {
    console.log(req.files); // the uploaded file object

    var currID = req.params.id;
    var currFileName = "./upload_data/current_upload.txt";

    var sampleFile = req.files.sampleFile;

    var convertedSampleFile = JSON.stringify(sampleFile);

    fs.writeFile(currFileName, convertedSampleFile, function(err) {
        if(err) {
            console.log("The current upload was not saved!");
            return console.log(err);
        }

        console.log("The current upload was saved!");

        Video.update({ _id: currID }, { $set: { uploaded: true }}).exec();

        var params = {
            localFile: currFileName,
           
            s3Params: {
              Bucket: "dkoupload",
              Key: "current_upload_" + currID + ".txt",
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
            //res.render("upload-progress");
        });
        uploader.on('end', function() {
            console.log("done uploading");
            //res.redirect("/download-test");
            //res.send("done uploading file");

            fs.unlink(currFileName, (err) => {
                if (err) throw err;
                console.log('successfully deleted ' + currFileName);
            });

            res.render("upload-complete");
            // /Users/rahulpatni/Projects/DKO_Website_V1/v1/views/upload-complete.ejs
        }); 
    });
});

app.get("/download-test/:id", isLoggedIN, function(req, res) {
    var currID = req.params.id;
    var localFile = "./upload_data/download_upload.txt"
    var params = {
        localFile: localFile,
       
        s3Params: {
          Bucket: "dkoupload",
          Key: "current_upload_" + currID + ".txt",
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
            var name = "./upload_data/downloaded_" + parsedData.name;
            console.log("pringing name " + name);
            console.log(name);
            fs.writeFile(name, new Buffer(parsedData.data), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The download file was saved!");

                fs.unlink(localFile, (err) => {
                    if (err) throw err;
                    console.log('successfully deleted ' + localFile);
                });

                // res.send("File downloaded");
                res.render("download-complete");
            });
        });
    });
});

app.get("/user/signup", function(req, res) {
    res.render("user/signup");    
});

app.post("/user/signup", function(req, res) {
    User.register(new User({username: req.body.username, admin: false}), req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render("register");
        }
        // here is where you use different strategies
        passport.authenticate("local")(req, res, function() {
            res.redirect("/secret");
    	});
    });
});

app.get("/admin/signup", function(req, res) {
    res.render("admin/signup");
});

app.get("/login", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("user/home")
    } else {
        res.render("login");
    }
});

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/user/home", 
        failureRedirect: "/login"
    }), function(req, res) {
});

app.get("/user/home", isLoggedIN, function(req, res) {
    res.render("user/home");
    console.log(req.user);
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

app.post("/video/:id", isLoggedIN, function(req, res) {
    console.log("video upload: " + req.params.id);
    res.redirect("/video/" + req.params.id +"/upload");
});

app.get("/video/:id/upload", isLoggedIN, function(req, res) {
    console.log("video upload redirect: " + req.params.id);
    var currVideo = {
        id: req.params.id
    }
    res.render("video/upload", {video: currVideo});
});

app.get("/logout", function(req, res) {
	req.logout();
	res.redirect("/");
});


app.get("*", function(req, res) {
    res.render("landing");
});

function isLoggedIN(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
    res.redirect("/login");
    console.log("you not logged in boi");
}

app.listen(3000, function() {
    console.log("you have started your server");

});
