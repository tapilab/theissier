/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 23/01/2014
 * Time: 23:06
 * To change this template use File | Settings | File Templates.
 */
var http = require("http");
var path = require('path');
var fs = require("fs");
var express = require("express");
var logfmt = require("logfmt");
var io = require('socket.io').listen(10001);
var twitter = require('ntwitter');
var app = express();

app.use(logfmt.requestLogger());
//app.use(express.static(path.join(__dirname, 'css')));
//app.use(express.static(path.join(__dirname, 'js')));

app.configure(function() {
    var directoryCss = __dirname;
    directoryCss = directoryCss.replace("js", "css");
    console.log('dir CSS ', directoryCss);
    app.use(express.static(directoryCss));
});

app.get('/', function(req, res) {
    var directory = __dirname;
    directory = directory.replace("js", "");
    var file = directory + "mapTweets.html";
    fs.readFile(file, function(err, text) {
        res.setHeader("Content-Type", "text/html");
        res.end(text);
    });
 // res.send('Hello World!');
});

var twit = new twitter({
    consumer_key: 'yszo9RyNwxIvrp5fsh13LA',
    consumer_secret: '7ij76PQILHYeDDjg8Vciti9CF6O7u2kd6DIqydO20M',
    access_token_key: '401483940-Ff9lR0Z1XE4sPkmuIudEkOw747x3A1ljI189RfH6',
    access_token_secret: 'YYogV2xReylhNPonY9kw60WZlQdyYWnTU8bDrCDorLNPk'
});

/*var twit2 = new twitter ({
    consumer_key: '4vLVy1fievlGnklN1E8xqg',
    consumer_secret: 'OM8OMab14Y2fjGmkEpQasHmzyKQNu4iYxRNCwt0UE',
    access_token_key: '401483940-wBqd2ZvaGWDrvZpX0KTC40vEONXWkB4nKycXT46c',
    access_token_secret: '0QZedGfeOSMgVhFQd06acTP42RKwNiQOZog77oZzer4Qf'
});  */

var port = Number(process.env.PORT || 5000);
app.listen(port, function(req,res) {
    //console.log("port : ", port);
    io.sockets.on('connection', function(socket) {
        twit.stream('statuses/sample', function(stream) {
            stream.on('data', function (data) {
                console.log(data);
                if (data.geo != null)
                    socket.emit('twitterStream', data);
            });
        });
    });
});

/*twit.stream('statuses/sample',
    function(stream) {
        stream.on('data', function (data) {
            if (data.geo != null) {
                io.sockets.on('connection', function (socket) {
                    var tweets = setInterval(function () {
                        socket.volatile.emit('twitterStream', data);
                    }, 100);
                    socket.on('disconnect', function () {
                        clearInterval(tweets);
                    });
                });
            }
        });
    });*/
