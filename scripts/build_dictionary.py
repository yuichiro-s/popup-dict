import json
import sys
import os
from collections import defaultdict

from util import lemmatize, load_dictionary


def main(args):
    # load word frequency data
    freq_dict = defaultdict(int)
    with open(args.frequency_path) as f:
        for line in f:
            form, freq = line.strip().split()
            freq = int(freq)
            lemma = lemmatize(form, args.lang, args.lemmatizer_path, lower=not args.no_lower)
            key = ' '.join(lemma)
            freq_dict[key] += freq

    # load dictionary data
    entries = {}
    freqs = {}
    d = load_dictionary(args.dict_path)
    for word, obj in d.items():
        lemmas = lemmatize(word, args.lang, args.lemmatizer_path)
        key = ' '.join(lemmas)
        freq_key = ' '.join(lemmatize(word, args.lang, args.lemmatizer_path, lower=not args.no_lower))
        entry = {
            'word': word,
        }
        freqs[key] = freq_dict[freq_key]
        if 'defs' in obj:
            entry['defs'] = obj['defs']
        if 'lemmas' in obj:
            entry['lemmas'] = obj['lemmas']
        entries[key] = entry
    
    # split entries into chunks
    index = {}
    chunks = defaultdict(dict)
    for i, (key, entry) in enumerate(sorted(entries.items(), key=lambda kv: -freqs[kv[0]])):
        chunk_index = i // args.size
        index[key] = chunk_index
        chunks[chunk_index][key] = entry

    # write to files
    index_path = os.path.join(args.out, 'index.json')
    os.makedirs(args.out, exist_ok=True)
    with open(index_path, 'w') as f_index:
        json.dump(index, f_index)
    for i, chunk in chunks.items():
        print(f'Writing chunk {i+1}/{len(chunks)} ...', file=sys.stderr)
        chunk_path = os.path.join(args.out, f'subdict{str(i)}.json')
        with open(chunk_path, 'w') as f_chunk:
            json.dump(chunk, f_chunk)
    with open(args.out_frequency, 'w') as f:
        json.dump(freqs, f)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('lang')
    parser.add_argument('dict_path')
    parser.add_argument('lemmatizer_path')
    parser.add_argument('frequency_path')
    parser.add_argument('out')
    parser.add_argument('out_frequency')
    parser.add_argument('--size', type=int, default=5000)
    parser.add_argument('--no-lower', action='store_true', help='don\'t lowercase words when looking up frequency')
    main(parser.parse_args())
