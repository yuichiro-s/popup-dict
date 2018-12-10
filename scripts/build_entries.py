import sys
import json

from util import lemmatize, load_dictionary


def main(lang, dict_path, lemmatizer_path):
    d = load_dictionary(dict_path)
    entries = []
    for word in d:
        lemmas = lemmatize(word, lang, lemmatizer_path)
        key = ' '.join(lemmas)
        entries.append(key)
    print(json.dumps(entries))


if __name__ == '__main__':
    main(*sys.argv[1:])