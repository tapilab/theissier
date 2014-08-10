theissier
=========

If you don't have node.js running on your machine go to : http://nodejs.org/ download and install the current version. 
-> Project running on version ```2.4.8```.

If you don't have mongodb running on your machine go to : http://www.mongodb.org/ download and install the current version.
-> Project running on version ```v0.10.24```.

If you don't have ElasticSearch running on your machine go to : http://www.elasticsearch.org/ download and install the current version. -> Project running on version ```version[0.90.11]```.

You should index some documents (tweets) into an ElasticSearch index with the bulk API
```
INDEX NAME HAS TO BE : tweets
INDEX TYPE HAS TO BE : tweet
```
Help here : http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/docs-bulk.html

Command to run : 
```
curl -s -XPOST localhost:9200/_bulk --data-binary @myfilename; echo
```
myfilename has to be structured like that : 
```
{"index": {"_index": "tweets", "_type": "tweet", "_id": "468510797367615488" }} 
{ yourJsonTweet }  
{"index": {"_index": "tweets", "_type": "tweet", "_id": "468509383576801280"}}
{ yourJsonTweet } 
etc...
```

Master's project
Procfile for heroku
- First thing first, run node ./server.js
- Second, don't forget to cd elasticsearch-0.90.11/ and run the following command "bin/elasticsearch -f" to launch elasticsearch

Node.js communicates with a python script through a tcp socket thanks to zeroRPC
To make it work you've to get zeroMQ, libtool working on your machine.
There were still some errors while installing zeroRPC. I finally installed executing this line:
"sudo ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-e"
