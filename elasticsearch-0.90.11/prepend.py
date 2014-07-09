"""
Prepend elastic search object before each tweet:
cat mine.json | python prepend.py > mine.es.json
"""
#!/bin/python
import json
import codecs
import sys

sys.stdout = codecs.getwriter('utf8')(sys.stdout)

for line in sys.stdin:
    try:
        j = json.loads(line)
        if type(j) is dict:  # as opposed to a list of dicts.
            j = [j]
        for jj in j:
            d = {'index': {'_index': 'test2', '_type': 'tweet', '_id': jj['id_str']}}
            sys.stdout.write('%s\n' % json.dumps(d))
            sys.stdout.write('%s\n' % json.dumps(jj))
    except:
        sys.stderr.write('bad line\n')
