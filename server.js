/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 10/05/2014
 * Time: 11:47
 * To change this template use File | Settings | File Templates.
 */

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

var MAX_TOP_TWEETS = 20;

MongoClient.connect(locationDb, function(err, db) {
    if(err)
        throw err;
    else {
        var collection = db.collection('scoredTweets');

        io.sockets.on('connection', function (socket) {
            socket.on('updateTweets', function (keyword) {
                if(keyword.keyword.indexOf(" ") == -1) {    //if keyword
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

            socket.on('affectScore', function(object) {
                collection.insert(object.object, function(err, docs) {
                });
            });

            socket.on('trainClassifier', function(sessionName) {
                clientZeroRPC.connect("tcp://127.0.0.1:4242");
                var unlabledTweets = [];
                var allIds = [];
                var hits = [];
                clientZeroRPC.invoke("fit", sessionName.sessionName, function(error, res, more) {
                    console.log("well-fit");
                });

                // first we do a search, and specify a scroll timeout
                ESclient.search({
                    index: 'test',
                    // Set to 30 seconds because we are calling right back
                    scroll: '30s',
                    fields: ['text'],
                    match_all : {}
                }, function getMoreUntilDone(error, response) {
                    //console.log("response : ", response);
                    // collect the title from each response
                    response.hits.hits.forEach(function (hit) {
                        hits.push(hit);
                        allIds.push(hit._id);
                    });
                    console.log("all ids : ", allIds);
                    console.log("sessionname : ", sessionName);
                    collection.find(
                        {
                            id: { $in: allIds }
                            /*** WITH SESSIONS ****/
                          //  $and: [ { id: { $in: allIds } }, { sessionname: sessionName } ]
                            /**********************/
                        },
                        {
                            id: 1, _id : 0
                        }
                    ).toArray(function(err, idLabeledTweets) {
                            if (err)
                                throw err;
                            else {
                                unlabledTweets = [];
                                var idsRelevantTweets = [];
                                console.log("idLabeledTweets : ", idLabeledTweets);
                                findUnlabledTweets(hits, idLabeledTweets , unlabledTweets);
                                console.log("unlabled tweets : ");
                                for(var k = 0; k < Object.size(unlabledTweets); k++) {
                                    console.log(unlabledTweets[k]._id);
                                }
                                clientZeroRPC.invoke("predict", unlabledTweets, function(error, res, more) {
                                    console.log("res return by python script : ", res);
                                    if (!(res[0] == "[" && res[1] == "]")) {
                                        var idTweetsThatMatchTheCriterion = res.replace("[", "");
                                        idTweetsThatMatchTheCriterion = idTweetsThatMatchTheCriterion.replace("]", "");
                                        regExp=/'/g;
                                        idTweetsThatMatchTheCriterion = idTweetsThatMatchTheCriterion.replace(regExp, "");
                                        idsRelevantTweets = stringToArray(idTweetsThatMatchTheCriterion);
                                        console.log("size ids Relevant tweets :", Object.size(idsRelevantTweets));
                                        if (Object.size(idsRelevantTweets) > MAX_TOP_TWEETS) {
                                            console.log("it's done, here are the ids : ", idsRelevantTweets);
                                            ESclient.mget({
                                                index: 'test',
                                                type: 'test',
                                                body: {
                                                    ids: idsRelevantTweets
                                                }
                                            }, function(error, response) {
                                                if (error) throw error;
                                                else
                                                    socket.emit('data', response.docs);
                                            });
                                        } else {
                                            if (response.hits.total !== hits.length) {
                                                // now we can call scroll over and over
                                                ESclient.scroll({
                                                    scrollId: response._scroll_id,
                                                    scroll: '30s'
                                                }, getMoreUntilDone);
                                            }
                                            else {
                                                socket.emit('data', response.docs);
                                            }
                                        }
                                    } else //HANDLE THE ERROR -> send back the ids even if there are less that MAX_TOP_TWEETS
                                        console.log("NO DATA !");
                                        socket.emit('nodata', {});
                                });
                            }
                        });
                });
            });
        });
    }
});

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function findUnlabledTweets(hits, idsLabeledTweets, tweetsUnlabled) {
    for (var i = 0; i < Object.size(hits); i++) {
        var hasBeenLabeled = false;
        for (var j = 0; j < Object.size(idsLabeledTweets); j++) {
            if (hits[i]._id == idsLabeledTweets[j].id) {
                hasBeenLabeled = true;
                j = Object.size(idsLabeledTweets);
            }
        }
        if (hasBeenLabeled == false)
            tweetsUnlabled.push(hits[i]);
    }
};

function stringToArray(string) {
    if (!string) return [];
    return string.split(',').map(Number);
}
