var express = require("express");
var app = express();

app.set("view engine", "ejs");

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/signup", function(req, res) {
    res.render("signup");
});

app.post("/login", function(req, res) {
    res.redirect("/home");
})

app.get("/home", function(req, res) {
    res.render("home");
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
    res.send("asdf");
});

app.listen(3000, function() {
    console.log("you have started your server");
});
