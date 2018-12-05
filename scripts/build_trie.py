import sys
import json

from util import lemmatize, load_dictionary


NEXT = 'n'
EXISTS = 'e'


def create_node():
    return { NEXT: {}, EXISTS: False }


def add(root, lemmas):
    node = root
    for lemma in lemmas:
        if lemma not in node[NEXT]:
            node[NEXT][lemma] = create_node()
        node = node[NEXT][lemma]
    node[EXISTS] = True


def main(lang, dict_path, lemmatizer_path):
    d = load_dictionary(dict_path)
    root = create_node()
    for word in d:
        lemmas = lemmatize(word, lang, lemmatizer_path)
        add(root, lemmas)
    print(json.dumps(root))


if __name__ == '__main__':
    main(*sys.argv[1:])