var elasticsearch = require('elasticsearch')
    , mongoose = require('mongoose')
    , forEachAsync = require('forEachAsync')
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

        socket.on('trainClassifier', function(sessionName) {
            var nbDocs = 0;
            var offset = 0;
            ESclient.count({
                index: 'test'
            }, function setOffset(error, resp) {
                var unlabledTweets = [];
                var hits = [];
                var idsHits = [];
                if (error)
                    console.log("error : ", error);
                else {
                    nbDocs = resp.count;
                    offset = (Math.floor(Math.random() * nbDocs)) + 1;
                }
                ESclient.search({
                    index: 'test',
                    type: 'test',
                    from: offset,
                    size: 20,
                    query: {
                        match_all: {}
                    }
                },function getMoreUntilDone(error, resp) {
                        if (error)
                            console.log("error : ", error);
                        else
                            hits = resp.hits.hits;
                        for (var i = 0; i < Object.size(hits); i++)
                            idsHits[i] = hits[i]._id;
                        console.log("session name : ", sessionName.sessionName);
                        collection.find(
                            {
                                /*id: { $in: idsHits }*/

                                /*  WITH SESSION */
                                 $and: [
                                     { $or : [ { id: { $in: idsHits } } ] },
                                     { $or : [ { sessionname: sessionName.sessionName } ] }
                                 ]
                            },
                            {
                                id: 1, _id : 0
                            }
                        ).toArray(function(err, idLabeledTweets) {
                                if (err)
                                    console.log("error : ", err);
                                else {
                                    console.log("labeled tweeeeets : ", idLabeledTweets);
                                    findUnlabledTweets(hits, idLabeledTweets , unlabledTweets);
                                    clientZeroRPC.connect("tcp://127.0.0.1:4242");
                                    console.log("unalbled tweets :", unlabledTweets);
                                    clientZeroRPC.invoke("train", unlabledTweets, function(error, res, more) {
                                        console.log("res : ", res);
                                        if (res[0] != "[" && res[1] != "]") {
                                            var idTweetsThatMatchTheCriterion = res.replace("[", "");
                                            idTweetsThatMatchTheCriterion = idTweetsThatMatchTheCriterion.replace("]", "");
                                            regExp=/'/g
                                            idTweetsThatMatchTheCriterion = idTweetsThatMatchTheCriterion.replace(regExp, "");
                                            var idsRelevantTweets = stringToArray(idTweetsThatMatchTheCriterion);
                                        }
                                    });
                                }
                            });
                        });
                         /*retrieveNTweetsUnlabeled(10, ESclient, 0, function(hits) {
                             var labeledTweets = [];
                             var ids = [];
                             for (var i = 0; i < Object.size(hits); i++) {
                                ids[i] = hits[i]._id;
                             }
                             collection.find(
                                 {
                                    id: { $in: ids }
                                 }
                             ).toArray(function(err, item) {
                                     if (err)
                                         console.log("error : ", hits);
                                     else {
                                         labeledTweets = item;
                                     }
                                 });

                             var unlabledTweets = findUnlabledTweets(labeledTweets,hits);
                             console.log("unlabled tweets : ", unlabledTweets);


                             for (var i = 0; i < Object.size(hits); i++) {
                                 console.log("i : ", i);
                                 var objects = collection.findOne({'id': hits[i]._id}, function(err, document) {
                                     if (err) return console.error(err);
                                     else {
                                         console.log("this is i : ", i);
                                         console.log(" and this is the doc : ", document);
                                         //!(isInHitsUnlabled(hitsUnlabled, hits[i].id))
                                         if (document == null) {  //if object is not in the database, it means that it has not been labled.
                                             nbUnlabledTweets++;
                                            // resultTweets.push(hits[i]); //so we push it and we'll send this array to the python script
                                             //console.log("result tweets", resultTweets);
                                         }
                                     }
                                });
                             }



                              hits.forEach(function(hit) {
                                 var object = collection.findOne({'id': hit._id}, function(err, document) {
                                     if (err) return console.error(err);
                                     else {
                                         //console.log("this is the doc : ", document);
                                         //!(isInHitsUnlabled(hitsUnlabled, hits[i].id))
                                         if (document == null) {  //if object is not in the database, it means that it has not been labled.
                                             nbUnlabledTweets++;
                                             console.log("nb unlabled tweets : ", nbUnlabledTweets);
                                             resultTweets.push(hit); //so we push it and we'll send this array to the python script
                                         }
                                     }
                                 });
                             });
                             console.log("result tweets : ", resultTweets);
                         });*/
                });
          });

    });

    }
});

/*function isInHitsUnlabled(hitsunlabled, id) {
    console.log("size array : ", Object.size(hitsunlabled));
    for (var i = 0; i < hitsunlabled.size(); i++) {
        if (hitsunlabled[i].id == id) {
            console.log("already in !!");
            return true;
        }
    }
    return false;
}  */

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

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function stringToArray(string) {
    if (!string) return [];
    return string.split(',').map(Number);
}

/* hits.forEach(function(hit) {
 var object = collection.findOne({'id': hit._id}, function(err, document) {
 if (err) return console.error(err);
 else {
 //console.log("this is the doc : ", document);
 //!(isInHitsUnlabled(hitsUnlabled, hits[i].id))
 if (document == null) {  //if object is not in the database, it means that it has not been labled.
 nbUnlabledTweets++;
 console.log("nb unlabled tweets : ", nbUnlabledTweets);
 resultTweets.push(hit); //so we push it and we'll send this array to the python script
 console.log("result tweets : ", resultTweets);
 }
 }
 });
 });    */

