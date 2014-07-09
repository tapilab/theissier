#!/bin/python
import pymongo
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
from sklearn.feature_extraction.text import CountVectorizer
vec = CountVectorizer()
from sklearn.linear_model import LogisticRegression
import zerorpc
import array
import json
db = client.tweetsClassifier
collection = db['scoredTweets']
clf = LogisticRegression(class_weight="auto")
epsilon = 0.7
class TrainClassifier(object):
    def fit(self, object):
        print ("currently fitting")
        print("object :", object)
        textTweetsArray = []
        scores = []
        for document in collection.find({ "sessionname": object }, { "text": 1, "id": 1, "score": 1, "sessionname": 1, "_id": 0 }):
            textTweetsArray.append(document['text'])
            scores.append(document['score'])
        resultMatrix = vec.fit_transform(textTweetsArray).toarray()
        clf.fit(resultMatrix, scores)
    def predict(self, object):
        print ("currently predicting")
        textUnlabledTweets = []
        idTweetsThatMatchTheCriterion = []
        for i in range(len(object)):
            textUnlabledTweets.append(object[i]['fields']['text'])
        matrixUnlabledTweets = vec.transform(textUnlabledTweets).toarray()
        predictUnlabledTweets = clf.predict_proba(matrixUnlabledTweets)
        print("predict : " , predictUnlabledTweets)
        for j in range(len(predictUnlabledTweets)):
            if (predictUnlabledTweets[j][1] >= epsilon):
                idTweetsThatMatchTheCriterion.append(object[j]['_id'])
        #tweets that respect the criterion (more than a certain probability) will be sent to node.js
	    print ("id tweets sent back ", idTweetsThatMatchTheCriterion)
        return "%s " % idTweetsThatMatchTheCriterion
s = zerorpc.Server(TrainClassifier())
s.bind("tcp://127.0.0.1:4242")
s.run()


