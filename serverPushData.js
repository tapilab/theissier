var  twitter = require('ntwitter')
    , logfmt = require('logfmt')
    , fs = require('fs')

var twit = new twitter({
    consumer_key: 'yszo9RyNwxIvrp5fsh13LA',
    consumer_secret: '7ij76PQILHYeDDjg8Vciti9CF6O7u2kd6DIqydO20M',
    access_token_key: '401483940-Ff9lR0Z1XE4sPkmuIudEkOw747x3A1ljI189RfH6',
    access_token_secret: 'YYogV2xReylhNPonY9kw60WZlQdyYWnTU8bDrCDorLNPk'
});

// USING SEARCH API FILTER sanFransisco doesn't work ....
/*var cpt = 0;
var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ]
T.get('search/tweets', { q: 'tennis', count: 500, locations: sanFrancisco }, function(err, reply) {
    console.log(reply);
    //console.log(reply);
    var data = JSON.stringify(reply);
    //console.log(data);
    if (data.geo != null) {
        console.log(data);
    }
    cpt++;
}); */
/*
twit.stream('statuses/sample', function(stream) {
    var cpt = 0;
    var nbTweets = 983207;  // 2912 Tweets already in there...
    stream.on('data', function (data) {
        var dataToAppend = JSON.stringify(data) + ",";
        if (data.geo != null && cpt < nbTweets) {
            if (cpt == nbTweets - 1)
                dataToAppend = JSON.stringify(data);
            fs.appendFile('/Users/thomastheissier/Desktop/tweets.json', dataToAppend, function (err) {
                    if (err)
                        throw err;
                    else {
                        console.log('The "data to append" was appended to file!');
                        console.log(cpt);
                        cpt++;
                    }
                });
            }
            if (cpt == nbTweets) {
                stream.destroy();
            }
    });
});

*/

/***** TO BE INDEXED BY BULK API ELASTICSEARCH ******/

twit.stream('statuses/sample',  function(stream) {
    var cpt = 100; //100th tweet
    stream.on('data', function (data) {
        var cptString = cpt.toString();
        console.log(cptString);
        var dataToAppend;
        var esDataToAppendJSON;
        if (data.geo != null) {
            esDataToAppendJSON = JSON.stringify({"index":{"_index":"test","_type":"test","_id":cptString}});
            dataToAppend = JSON.stringify(data);
            var esAndData = esDataToAppendJSON + "\n" + dataToAppend + "\n";
            fs.appendFile('/Users/thomastheissier/Documents/IIT/CS597/tweetmapprojLOCAL/theissier/elasticsearch-0.90.11/tweet.json', esAndData, function (err) {
                if (err)
                    throw err;
                else {
                    console.log('The "data to append" was appended to file!');
                    console.log(cpt);
                    cpt++;
                }
            });
        }
        if (cpt == 200) {
            stream.destroy();
        }
    });
});

/* READ NUMBER OF TWEETS */
/*
var obj;
var cpt = 0;
fs.readFile('/Users/thomastheissier/Desktop/tweets.json', function(err, data) {
    if (err) throw err;
    else {
        obj = JSON.parse(data);
    }
    console.log("length : ", obj.length);
});
*/