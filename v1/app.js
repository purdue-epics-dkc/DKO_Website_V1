var express = require("express");
var app = express();
var bodyparser  = require("body-parser");

app.use(bodyparser.urlencoded({extended: true}));


app.set("view engine", "ejs");

app.get("/login", function(req, res) {
    res.render("login");
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
