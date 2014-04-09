#!/bin/python
import pymongo
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
from sklearn.feature_extraction.text import CountVectorizer
vec = CountVectorizer()
from sklearn.linear_model import LogisticRegression
clf = LogisticRegression()
import zerorpc
db = client.tweetsClassifier
collection = db['scoredTweets']
textTweetsArray = []
sessionNames = []
scores = []
for document in collection.find({ }, { "text": 1, "id": 1, "score": 1, "sessionname": 1, "_id": 0 }):
    textTweetsArray.append(document['text'])
    sessionNames.append(document['sessionname'])
    scores.append(document['score'])
print ("scores : ", scores)
resultMatrix = vec.fit_transform(textTweetsArray).toarray()
print ("result matrix : ", resultMatrix[0])
#clf.fit(resultMatrix, scores)
#clf.predict_proba()
class TrainClassifier(object):
    def train(self, object):
        return "Train this data, %s" % object

s = zerorpc.Server(TrainClassifier())
s.bind("tcp://127.0.0.1:4242")
s.run()


