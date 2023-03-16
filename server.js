const express = require('express');
const path = require("path");
const app = new express();
const https = require('https');
const fs = require('fs');
const { dirname } = require('path');

process.title = "demoNFT";

app.use("/static",express.static('public'));
app.use("/modules",express.static('node_modules'));
console.log(__dirname);
app.get('/vilnius-ar', function(request, response){
    response.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/', function(request, response){
    response.sendFile(path.join(__dirname + '/public/main.html'));
});

https.createServer({
    key: fs.readFileSync('C:\\Program Files\\Git\\usr\\bin\\cert.key'),
    cert: fs.readFileSync('C:\\Program Files\\Git\\usr\\bin\\cert.crt')
},
app).listen(3000, function(){
    console.log("Demo running at https://localhost:3000/");
});
