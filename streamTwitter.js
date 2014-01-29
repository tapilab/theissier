/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 23/01/2014
 * Time: 23:06
 * To change this template use File | Settings | File Templates.
 */
var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , twitter = require('ntwitter')
    , app = express()
    , port = process.env.PORT || 5000;

var server = http.createServer(app);
server.listen(port);

console.log('http server listening on %d', port);

app.configure(function() {
    app.use(logfmt.requestLogger());
    app.use(express.static(__dirname + "/public/"));
});

var wss = new WebSocketServer({server: server});
console.log('websocket server created');

/*io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});    */

app.get('/', function(req, res) {
    res.sendfile('public/mapTweets.html');
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

wss.on('connection', function(wss) {
    twit.stream('statuses/sample', function(stream) {
        stream.on('data', function (data) {
            //console.log(data);
            if (data.geo != null)
                wss.send('twitterStream', data);
        });
    });

    console.log("websocket connection open");

    ws.on('close', function() {
        console.log('websocket connection close');
    });
});