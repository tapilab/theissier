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

/***** PUSH DATA IN JSON FILE ****/
twit.stream('statuses/sample', function(stream) {
    var cpt = 0;
    stream.on('data', function (data) {
        var dataToAppend = JSON.stringify(data);
        if (data.geo != null && cpt != 1) {
                dataToAppend = JSON.stringify(data);
            fs.appendFile('/Users/thomastheissier/Desktop/tweet.json', dataToAppend, function (err) {
                if (err)
                    throw err;
                else {
                    console.log('The "data to append" was appended to file!');
                    console.log(cpt);
                    cpt++;
                }
            });
        }
        if (cpt == 1) {
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


