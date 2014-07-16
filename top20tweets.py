#!/bin/python
import pymongo
from pymongo import MongoClient
client = MongoClient('localhost', 27017)
from sklearn.feature_extraction.text import CountVectorizer
vec = CountVectorizer()
from sklearn.linear_model import LogisticRegression
from elasticsearch import Elasticsearch
es = Elasticsearch()
import zerorpc
import array
import json
db = client.tweetsClassifier
collection = db['scoredTweets']
clf = LogisticRegression(class_weight="auto")
epsilon = 0.5

##### QUICK SORT ALGORITHM ####
def partition(myList, start, end):
    pivot = myList[start].probaYES
    left = start+1
    # Start outside the area to be partitioned
    right = end
    done = False
    while not done:
        while left <= right and myList[left].probaYES <= pivot:
            left = left + 1
        while myList[right].probaYES >= pivot and right >=left:
            right = right -1
        if right < left:
            done= True
        else:
            # swap places
            temp=myList[left]
            myList[left]=myList[right]
            myList[right]=temp
    # swap start with myList[right]
    temp=myList[start]
    myList[start]=myList[right]
    myList[right]=temp
    return right

def quicksort(myList, start, end):
    if start < end:
        # partition the list
        split = partition(myList, start, end)
        # sort both halves
        quicksort(myList, start, split-1)
        quicksort(myList, split+1, end)
    return myList

#### QUICK SORT ALGORITHM ####

def returnTopNTweets(myList, numberOfTweets):
    return myList[:numberOfTweets]

class TweetInfo:
    def __init__(self, id, text, probaYES, probaNO):
        self.id = id
        self.text = text
        self.probaYES = probaYES
        self.probaNO = probaNO
class TrainClassifier(object):
    def fit(self, sessionname):
        print ("currently fitting")
        print("object :", object)
        textTweetsArray = []
        scores = []
        for document in collection.find({ "sessionname": sessionname }, { "text": 1, "id": 1, "score": 1, "sessionname": 1, "_id": 0 }):
            textTweetsArray.append(document['text'])
            scores.append(document['score'])
        resultMatrix = vec.fit_transform(textTweetsArray).toarray()
        clf.fit(resultMatrix, scores)
    def predict(self, sessionname):
        tweetsList = []
        print("sessionname : ", sessionname)
        idsLabeledTweets = []
        for document in collection.find({ "sessionname": sessionname }, { "text": 1, "id": 1, "sessionname": 1, "_id": 0 }):
            idsLabeledTweets.append(document['id'])
        print ("here are the ids of the labeled tweets : ")
        print(idsLabeledTweets)
        textUnlabledTweets = []
        bestTweets = []
        res = es.search(index="test2", body={"query": {"match_all": {}}})
        totalHits = res['hits']['total']
        totalUnlabled = totalHits - len(idsLabeledTweets)
        res = es.search(index="test2", size=totalUnlabled, body={"query": {"match_all": {}}})
        for hit in res['hits']['hits']:
            x = TweetInfo(hit["_id"], hit["_source"]["text"], 0.0, 0.0)
            tweetsList.append(x)
            textUnlabledTweets.append(hit["_source"]["text"])
        matrixUnlabledTweets = vec.transform(textUnlabledTweets).toarray()
        predictUnlabledTweets = clf.predict_proba(matrixUnlabledTweets)
        print("predict : " , predictUnlabledTweets)
        count = 0
        for tweet in tweetsList:
            tweet.probaNO = predictUnlabledTweets[count][0]
            tweet.probaYES = predictUnlabledTweets[count][1]
            count += 1
        sortedList = quicksort(tweetsList,0,len(tweetsList)-1)
        sortedList = sortedList[::-1]
        bestTweets = returnTopNTweets(sortedList, 20)
        #tweets that respect the criterion (more than a certain probability) will be sent to node.js
        idsToSend = []
        for bestTweet in bestTweets:
            idsToSend.append(bestTweet.id.encode('utf8'))
        print("ids to send :", idsToSend)
        return "%s " % idsToSend
s = zerorpc.Server(TrainClassifier())
s.bind("tcp://127.0.0.1:4242")
s.run()


