import json
import sys

POS = {
    'noun': 'n.',
    'adjective': 'adj.',
    'verb': 'v.',
    'proper-noun': 'n.',
    'adverb': 'adv.',
    'preposition': 'prep.',
    'initialism': 'abbr.',
    'interjection': 'interj.',
    'prepositional-phrase': 'idiom',
    'prefix': 'pref.',
    'phrase': 'idiom',
    'abbreviation': 'abbr.',
    'proverb': 'idiom',
    'suffix': 'suff.',
    'contraction': 'contraction',
    'pronoun': 'pron.',
    'numeral': 'numeral',
    'conjunction': 'conj.',
    'determiner': 'determiner',
    'number': 'number',
    'particle': 'particle',
}


def main():
    path = sys.argv[1]
    words = []
    with open(path) as f:
        for line in f:
            obj = json.loads(line)[0]
            word = obj[0]
            pos = obj[1]
            variants = obj[3]
            definition = obj[4]
            words.append((word, pos, variants, definition))
    words.sort()
    for word, pos, variants, definition in words:
        pos = POS[pos]
        obj = {
            'word': word,
            'lemmas': [f'[{pos}] {word}'],
            'defs': [definition],
        }
        print(json.dumps(obj))


if __name__ == '__main__':
    main()
