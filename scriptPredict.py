#!/bin/python
import pymongo
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
from sklearn.feature_extraction.text import CountVectorizer
vec = CountVectorizer()
from sklearn.linear_model import LogisticRegression
clf = LogisticRegression()
import zerorpc
import array
import json
db = client.tweetsClassifier
collection = db['scoredTweets']
textTweetsArray = []
sessionNames = []
scores = []
for document in collection.find({ }, { "text": 1, "id": 1, "score": 1, "sessionname": 1, "_id": 0 }):
    textTweetsArray.append(document['text'])
    sessionNames.append(document['sessionname'])
    scores.append(document['score'])
resultMatrix = vec.fit_transform(textTweetsArray).toarray()
clf.fit(resultMatrix, scores)
list = clf.predict_proba(resultMatrix)
print ("predict just fit : ",list)
class TrainClassifier(object):
    def train(self, object):
        epsilon = 0.54
        textUnlabledTweets = []
        idTweetsThatMatchTheCriterion = []
        for i in range(len(object)):
            textUnlabledTweets.append(object[i]['_source']['text'])
        matrixUnlabledTweets = vec.transform(textUnlabledTweets).toarray()
        predictUnlabledTweets = clf.predict_proba(matrixUnlabledTweets)
        print("predict unlabled tweets : ", predictUnlabledTweets)
        for j in range(len(predictUnlabledTweets)):
            if (predictUnlabledTweets[j][1] >= epsilon):
                idTweetsThatMatchTheCriterion.append(object[j]['_id'])
        #tweets that respect the criterion (more than a certain probability) will be sent to node.js
        print ("ids : ", idTweetsThatMatchTheCriterion)
        return "%s " % idTweetsThatMatchTheCriterion
s = zerorpc.Server(TrainClassifier())
s.bind("tcp://127.0.0.1:4242")
s.run()


