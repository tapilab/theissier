/**
 * Created with JetBrains WebStorm.
 * User: thomastheissier
 * Date: 19/05/2014
 * Time: 11:12
 * To change this template use File | Settings | File Templates.
 */


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

var MAX_TOP_TWEETS = 20;
var hits = [];
var allIds = [];

ESclient.search({
    index: 'test',
    // Set to 30 seconds because we are calling right back
    scroll: '30s',
    fields: ['text'],
    match_all : {}
}, function getMoreUntilDone(error, response) {
    console.log("response : ", response);
    // collect the title from each response
    response.hits.hits.forEach(function (hit) {
        hits.push(hit);
        allIds.push(hit._id)
    });

    if (response.hits.total !== hits.length) {
        // now we can call scroll over and over
        ESclient.scroll({
            scrollId: response._scroll_id,
            scroll: '30s'
        }, getMoreUntilDone);
    }

    console.log("ALL ids : ", Object.size(allIds));
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
