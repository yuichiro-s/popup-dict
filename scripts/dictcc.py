import sys
import json
import re
from collections import defaultdict

RE1 = re.compile(r'\(.*\)')
RE2 = re.compile(r'\[.*\]')
RE3 = re.compile(r'{.*}')
RE4 = re.compile(r'\<.*\>')
RE5 = re.compile(r' +')


def main():
    dictcc_path = sys.argv[1]
    dictcc = defaultdict(list)
    with open(dictcc_path) as f:
        for line in f:
            es = line.strip().split('\t')
            lemma = es[0]
            definition = es[1]
            if len(es) >= 4:
                definition += ' ' + es[3]
            key = lemma
            key = RE1.sub('', key)
            key = RE2.sub('', key)
            key = RE3.sub('', key)
            key = RE4.sub('', key)
            key = RE5.sub(' ', key)
            if key.find('/') > 0:
                key = key[:key.find('/')]
            key = key.strip()

            if key.startswith('-') or ('.' in key) or (',' in key):
                continue

            dictcc[key].append((lemma, definition))

    for key, defs in sorted(dictcc.items()):
        obj = {}
        d = defaultdict(list)
        for lemma, definition in defs:
            d[lemma].append(definition)
        lemmas = []
        definitions = []
        for k, v in d.items():
            lemmas.append(k)
            definitions.append(v)
        if key.strip():
            obj['word'] = key
            if lemmas:
                obj['lemmas'] = lemmas
            if definitions:
                obj['defs'] = definitions
            print(json.dumps(obj))


if __name__ == '__main__':
    main()
