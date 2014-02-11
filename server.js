var elasticsearch = require('elasticsearch')
    , io          = require('socket.io').listen(8080)
    , client = new elasticsearch.Client({
        host: 'localhost:9200'
    });

//Ping the elasticsearch index to see if it responds
/*client.ping({
    // ping usually has a 100ms timeout
    requestTimeout: 1000,

    // undocumented params are appended to the query string
    hello: "elasticsearch!"
}, function (error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});  */

io.sockets.on('connection', function (socket) {
    socket.on('updateTweets', function (keyword) {
        client.search({
            index: 'test',
            type: 'test',
            body: {
                query: {
                    bool: {
                        must : [
                            {
                                term: {
                                    "text": keyword.keyword
                                }
                            }
                        ]
                    }
                }
            }
        }).then(function (resp) {
                var hits = resp.hits.hits;
                console.log(hits);
                io.sockets.emit('data', hits);
            }, function (err) {
                console.trace(err.message);
            });
    });
});