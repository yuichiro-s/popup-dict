import json


def main(args):
    d = {}
    with open(args.wiki) as f:
        for line in f:
            entry = json.loads(line)
            word = entry['word']
            del entry['word']
            if word not in d:
                d[word] = {
                    'word': word,
                    'entries': [],
                }
            d[word]['entries'].append(entry)
    for item in d.values():
        print(json.dumps(item))


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(
        'Merge entries in wiki.json according to lemma.')
    parser.add_argument('wiki', help='wiki.json')
    main(parser.parse_args())
