theissier
=========
[Procfile for heroku]

##Installation & Configuration

If you don't have node.js running on your machine go to : http://nodejs.org/ download and install the current version 
-> Project running on version ```2.4.8```.

If you don't have MongoDB running on your machine go to : http://www.mongodb.org/ download and install the current version -> Project running on version ```v0.10.24```.

If you don't have ElasticSearch running on your machine go to : http://www.elasticsearch.org/ download and install the current version
-> Project running on version ```version[0.90.11]```.

#####ElasticSearch setup

You should index some documents (tweets) into an ElasticSearch index with the bulk API
```
INDEX NAME HAS TO BE : tweets
INDEX TYPE HAS TO BE : tweet
```

Command to run : 
```
curl -s -XPOST localhost:9200/_bulk --data-binary @myfilename; echo
```
where ```myfilename``` has to be structured like that :
````
{"index": {"_index": "tweets", "_type": "tweet", "_id": "468510797367615488" }} 
{ yourJsonTweet }  
{"index": {"_index": "tweets", "_type": "tweet", "_id": "468509383576801280"}}
{ yourJsonTweet } 
etc...
```

Documentation of ```ElasticSearch``` on the ```Bulk API``` : http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/docs-bulk.html

#####Python setup

Node.js & python scripts run on two different processes.
They can communicate and send data to each other thanks to ZeroRPC library : http://zerorpc.dotcloud.com/
Install ZeroRPC libraries: 
- Node.js : ```npm install zerorpc```
- Python : ```pip install zerorpc```

**If you have errors:**
It might be because ```zeroMQ``` and ```libtool``` libraries are not installed on your machine.
I succeeded in installing zeroRPC library after executing this command : 
```
sudo ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-e
```

##Overview of system architecture

**The system is composed of :**
- a ```MongoDB``` database composed of two collections : *users* and *scoredTweets*. Users & labeled tweets are sorted in those collections.
- an ```ElasticSearch``` index called ```tweets``` composed of documents of type ```tweet``` that makes the tweets searchable.
- a ```Python``` script where a ```Logistical Regression classifier``` predicts the relevance of unlabeled tweets, sort all the tweets by relevance and sends back the top 20 tweets to the ```Node.js server```
- a ```Node.js``` application that handles different types of requests performed by the user (ex: ```/search```, ```/train```)


######Example of a ```/search``` request performed by the user:
![Alt text](searchRequest.png?raw=true "Search request performed by the user")

######Example of a ```/affectscore``` request performed by the user when clicking on *YES* or *NO* buttons:
![Alt text](affectScore.png?raw=true "Search request performed by the user")

######Example of a ```/train``` request performed when the user clicks on the ```TrainClassifier``` button:
![Alt text](trainClassifier.png?raw=true "TrainClassifer request performed by the user")

##Launch the app

- Launch elasticsearch. If elasticsearch directory at the root of the folder : ```elasticsearch-0.90.11/bin/elasticsearch -f```
- Start MongoDB server : ```mongod```
- Start python script : ```python topNtweets.py```
- Start the node application : ```node app.js```
