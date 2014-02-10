var   http    = require('http')
    , express = require('express')
    , Twit    = require('twit')
    , twitter = require('ntwitter')
    , logfmt  = require('logfmt')
    , fs      = require('fs')
    , elasticsearch = require('elasticsearch')
    , app     = express()
    , port    = process.env.PORT || 5000;

var twit = new twitter({
    consumer_key: 'yszo9RyNwxIvrp5fsh13LA',
    consumer_secret: '7ij76PQILHYeDDjg8Vciti9CF6O7u2kd6DIqydO20M',
    access_token_key: '401483940-Ff9lR0Z1XE4sPkmuIudEkOw747x3A1ljI189RfH6',
    access_token_secret: 'YYogV2xReylhNPonY9kw60WZlQdyYWnTU8bDrCDorLNPk'
});

var client = new elasticsearch.Client({
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

//query a keyword replacing the text value

client.search({
    index: 'test',
    type: 'tweet',
    body: {
        query: {
            bool: {
                must : [
                    {
                        term: {
                            "text": "lmaaao"
                        }
                    }
                ]
            }
        }
    }
}).then(function (resp) {
        var hits = resp.hits.hits;
        console.log(hits);
    }, function (err) {
        console.trace(err.message);
    });