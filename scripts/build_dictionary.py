import json
import sys
from collections import defaultdict

from util import lemmatize, load_dictionary


def main(lang, dict_path, lemmatizer_path, frequency_path):
    freq_dict = defaultdict(int)
    entries = {}
    with open(frequency_path) as f:
        for line in f:
            form, freq = line.strip().split()
            freq = int(freq)
            lemma = lemmatize(form, lang, lemmatizer_path, lower=True)
            key = ' '.join(lemma)
            freq_dict[key] += freq

    d = load_dictionary(dict_path)
    for word, obj in d.items():
        lemmas = lemmatize(word, lang, lemmatizer_path)
        key = ' '.join(lemmas)
        freq_key = ' '.join(lemmatize(word, lang, lemmatizer_path, lower=True))
        entry = {
            'word': word,
            'freq': freq_dict[freq_key],
        }
        if 'defs' in obj:
            entry['defs'] = obj['defs']
        if 'lemmas' in obj:
            entry['lemmas'] = obj['lemmas']
        entries[key] = entry
    print(json.dumps(entries))


if __name__ == '__main__':
    main(*sys.argv[1:])