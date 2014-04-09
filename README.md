theissier
=========

Master's project
Procfile for heroku
- First thing first, run node ./server.js
- Second, don't forget to cd elasticsearch-0.90.11/ and run the following command "bin/elasticsearch -f" to launch elasticsearch
- Third, the application has to be launched from public/mapTweets.html so you have to get a local server that renders this file
That's it!

Node.js communicates with a python script through a tcp socket thanks to zeroRPC
To make it work you've to get zeroMQ, libtool working on your machine.
There were still some errors while installing zeroRPC. I finally installed executing this line:
"sudo ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-e"
