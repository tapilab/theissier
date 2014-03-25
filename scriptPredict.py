#!/bin/python
import pymongo
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
db = client.tweetsClassifier
collection = db['scoredTweets']
for document in collection.find( { }, { "text": 1, "_id": 0 }):
    print document