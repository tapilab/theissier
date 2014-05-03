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
print("scores : ", scores)
resultMatrix = vec.fit_transform(textTweetsArray).toarray()
print ("result matrix : ", resultMatrix)
clf.fit(resultMatrix, scores)
list = clf.predict_proba(resultMatrix)
class TrainClassifier(object):
    def trainUnlabledTweets(self, object):
        print ("list : ", list)
        textUnlabledTweets = []
        for i in range(object):
            textUnlabledTweets.append(object[i]['_source']['text'])
        matrixUnlabledTweets = vec.fit_transform(textUnlabledTweets).toarray()
        print("text unlabled tweets : ", textUnlabledTweets)
        print ('matrix unlabled tweets : ', matrixUnlabledTweets)
        predictUnlabledTweets = clf.predict_proba(matrixUnlabledTweets)   #this line
        print("predict : ", predictUnlabledTweets)
         #tweets that respect the criterion (more than a certain probability) will be sent to node.js
        return "New tweets are there : " % object
s = zerorpc.Server(TrainClassifier())
s.bind("tcp://127.0.0.1:4242")
s.run()


