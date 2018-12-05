import json
import sys


def main():
    path = sys.argv[1]
    words = []
    with open(path) as f:
        for line in f:
            obj = json.loads(line)
            word = obj[0]
            words.append(word)
    words.sort()
    for word in words:
        print(json.dumps({'word': word}))


if __name__ == '__main__':
    main()
