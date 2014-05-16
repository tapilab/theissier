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

            socket.on('trainClassifier', function(sessionName) {
                var unlabledTweets = [];
                var allIds = [];
                var hits = [];

                // first we do a search, and specify a scroll timeout
                ESclient.search({
                    index: 'test',
                    // Set to 30 seconds because we are calling right back
                    scroll: '30s',
                    fields: ['text']
                }, function getMoreUntilDone(error, response) {
                    // collect the title from each response
                    response.hits.hits.forEach(function (hit) {
                        hits.push(hit);
                        allIds.push(hit._id)
                    });
                    //console.log("REDOOOOOOO THE FIND THEREEEEEEEE");
                    // console.log("WITH IDS OF HITS : ", allIds);
                    collection.find(
                        {
                            $and: [
                                { $or : [ { id: { $in: allIds } } ] },
                                { $or : [ { sessionname: sessionName } ] }
                            ]
                        },
                        {
                            id: 1, _id : 0
                        }
                    ).toArray(function(err, idLabeledTweets) {
                            if (err)
                                throw err;
                            else {
                                console.log("ids : ", idLabeledTweets);
                                unlabledTweets = [];
                                var idsRelevantTweets = [];
                                findUnlabledTweets(hits, idLabeledTweets , unlabledTweets);
                                clientZeroRPC.connect("tcp://127.0.0.1:4242");
                                clientZeroRPC.invoke("train", unlabledTweets, function(error, res, more) {
                                    //console.log("res : ", res);
                                    //console.log("heyyeyeyeyeyeye");
                                    //console.log("res[0] : ", res[0]);
                                    //console.log("res[1] : ", res[1]);
                                    if (!(res[0] == "[" && res[1] == "]")) {
                                        console.log("its ok");
                                        var idTweetsThatMatchTheCriterion = res.replace("[", "");
                                        idTweetsThatMatchTheCriterion = idTweetsThatMatchTheCriterion.replace("]", "");
                                        regExp=/'/g
                                        idTweetsThatMatchTheCriterion = idTweetsThatMatchTheCriterion.replace(regExp, "");
                                        idsRelevantTweets = stringToArray(idTweetsThatMatchTheCriterion);
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
                                                    socket.emit('resultsFromClassifier', { idsTweets : response.docs });
                                            });
                                        } else {
                                            if (response.hits.total !== hits.length) {
                                                // now we can call scroll over and over
                                                ESclient.scroll({
                                                    scrollId: response._scroll_id,
                                                    scroll: '30s'
                                                }, getMoreUntilDone);
                                            }
                                        }
                                    } else //HANDLE THE ERROR -> send back the ids even if there are less that MAX_TOP_TWEETS
                                        console.log("ERROR");
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
