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
        var scoredTweets = db.collection('scoredTweets');
        var users = db.collection('users');

        io.sockets.on('connection', function (socket) {
            socket.on('createaccount', function(usernameAndPassword) {
                usernameAndPassword = usernameAndPassword.split("_");
                var username = usernameAndPassword[0];
                var password = usernameAndPassword[1];
                console.log("username : ", username);
                console.log("password : ", password);
            });
            socket.on('login', function(usernameAndPassword) {
                usernameAndPassword = usernameAndPassword.split("_");
                var username = usernameAndPassword[0];
                var password = usernameAndPassword[1];
                console.log("username : ", username);
                console.log("password : ", password);
                users.find(
                    {
                        username: username, password: password
                    }
                ).toArray(function(err, user) {
                        if (err)
                            throw err;
                        else
                        if (Object.size(user) == 1) {
                            console.log("user :", user);
                        } else if (Object.size(user) > 1) {
                            console.log("Multiple users have same name and password !");
                        } else {
                            console.log("No user found !");
                        }
                    });
            });

            socket.on("retrievesessions", function(username) {
                console.log("username : ", username);
                if (username != "") {
                    users.find(
                        {
                            username: username
                        }
                    ).toArray(function(err, user) {
                            if (err)
                                throw err;
                            else {
                                if (Object.size(user) == 1) {
                                    console.log("user : ", user);
                                    console.log("id : ", user[0]._id);
                                    console.log("username : ", user[0].username);
                                    console.log("sessions", user[0].sessions);
                                } else if (Object.size(user) == 0) {
                                    var jsObj = { username : username, sessions: [] };
                                    users.insert(jsObj, function(err, docs) {

                                    });
                                }
                                else {
                                    console.log("Multiple user with same name");
                                }
                            }
                        });
                }

            });

            socket.on("postsession", function(usernameAndSession) {
                console.log("username and pass : ", usernameAndSession);
                usernameAndSession = usernameAndSession.split("_");
                var username = usernameAndSession[0];
                var session = usernameAndSession[1];
                console.log("username : ", username);
                console.log("session : ", session);
                users.find(
                    {
                        username: username
                    }
                ).toArray(function(err, user) {
                        if (err)
                            throw err;
                        if (Object.size(user) == 1) {
                            console.log("user :", user[0].username);
                            console.log("user id : ", user[0]._id);
                            console.log("user sessions : ", user[0].sessions);
                            var sessions = user[0].sessions;

                        } else if (Object.size(user) > 1) {
                            console.log("Multiple users have same name and password !");
                        } else {
                            console.log("No user found !");
                        }
                    });
            });

            socket.on('updateTweets', function (keyword) {
                if(keyword.keyword.indexOf(" ") == -1) {    //if keyword
                    ESclient.search({
                        index: 'test2',
                        type: 'tweet',
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
                        index: 'test2',
                        type: 'tweet',
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
                scoredTweets.insert(object.object, function(err, docs) {
                });
            });

            socket.on('trainClassifier', function(sessionName) {
                clientZeroRPC.connect("tcp://127.0.0.1:4242");
                var allIds = [];
                var hits = [];
                clientZeroRPC.invoke("fit", sessionName.sessionName, function(error, res, more) {
                    console.log("well-fit");
                });

                clientZeroRPC.invoke("predict", sessionName.sessionName, function(error, res, more) {
                    console.log("send to python predict");
                    console.log("this is the res from python", res);
                    var ids = res.replace("[", "");
                    ids = ids.replace("]", "");
                    regExp=/'/g;
                    ids = ids.replace(regExp, "");
                    ids = stringToArray(ids);
                    console.log("here last id :", ids[Object.size(ids) - 1]);
                    var lastID = ids[Object.size(ids) - 1].split(" ");
                    ids[Object.size(ids) - 1] = lastID[0];
                    for (var k = 0; k < Object.size(ids); k++) {
                        console.log("id number : ", k, ids[k]);
                    }
                    ESclient.mget({
                        index: 'test2',
                        type: 'tweet',
                        body: {
                            ids: ids
                        }
                    }, function(error, response) {
                        if (error) throw error;
                        else {
                            socket.emit('data', response.docs);
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
    var array = [];
    if (!string) {
        return []
    } else {
        console.log("the string is : ", string);
        array = string.split(', ');
        return array;
    }
}

