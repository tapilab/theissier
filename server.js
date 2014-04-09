var elasticsearch = require('elasticsearch')
    , mongoose = require('mongoose')
    , zerorpc = require('zerorpc')
    , io     = require('socket.io').listen(8080)
    , ESclient = new elasticsearch.Client({
        host: 'localhost:9200'
    });

var clientZeroRPC = new zerorpc.Client();
var locationDb = "mongodb://127.0.0.1:27017/tweetsClassifier"
var MongoClient = require('mongodb')
    , format = require('util').format;

MongoClient.connect(locationDb, function(err, db) {
    if(err)
        throw err;
    else {
        var collection = db.collection('scoredTweets');


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
            if(keyword.keyword.indexOf(" ") == -1){    //if keyword
                ESclient.search({
                    index: 'test',
                    type: 'test',
                    body: {
                        query: {
                            bool: {
                                should : [
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
                        //console.log(hits);
                        io.sockets.emit('data', hits);
                    }, function (err) {
                        console.trace(err.message);
                    });
            } else {            //else phrase
                ESclient.search({
                    index: 'test',
                    type: 'test',
                    body: {
                        query :
                            { bool :
                                { must :
                                    { match :
                                        { text :
                                            { "query" : keyword.keyword, "type" : "phrase" }
                                        }
                                    }
                                }
                            }
                        }
                }).then(function (resp) {
                        var hits = resp.hits.hits;
                        io.sockets.emit('data', hits);
                    }, function (err) {
                        console.trace(err.message);
                    });
            }
        });

        socket.on('affectGoodScore', function(object) {
            collection.insert(object.object, function(err, docs) {
            });
        });

        socket.on('affectBadScore', function(object) {
           collection.insert(object.object, function(err, docs) {
           });
        });

        socket.on('trainClassifier', function() {
            console.log("train classifier called here");
            clientZeroRPC.connect("tcp://127.0.0.1:4242");
            ESclient.search({
                index: 'test',
                type: 'test',
                body: {
                    from : 0, size : 100
                }
            }).then(function (resp) {
                    var hits = resp.hits.hits;
                    //console.log(hits);
                    clientZeroRPC.invoke("train", hits, function(error, res, more) {
                        console.log(res);
                    });
                }, function (err) {
                    console.trace(err.message);
                });
        })
    });

    }
});