var express = require("express");
var app = express();

app.set("view engine", "ejs");

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/signup", function(req, res) {
    res.render("signup");
});

app.get("*", function(req, res) {
    res.send("asdf");
});

app.listen(3000, function() {
    console.log("you have started your server");
});
