#!/bin/python
import pymongo
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
from sklearn.feature_extraction import DictVectorizer
vec = DictVectorizer()
db = client.tweetsClassifier
collection = db['scoredTweets']
textTweetsArray = []
for document in collection.find( { }, { "text": 1, "_id": 0 }):
    textTweetsArray.append(document)
print textTweetsArray
resultMatrix = vec.fit_transform(textTweetsArray).toarray()
print ("result matrix : ", resultMatrix)
return resultMatrix


