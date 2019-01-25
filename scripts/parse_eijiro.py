import sys
import json
from collections import defaultdict


def main():
    path = sys.argv[1]
    dict_path = sys.argv[2]
    enwiki_dict_path = sys.argv[3]
    inflection_dict = {}
    entries = defaultdict(lambda: defaultdict(list))

    words = set()
    with open(enwiki_dict_path) as f:
        for line in f:
            obj = json.loads(line)
            word = obj['word']
            words.add(word)

    with open(path) as f:
        for line in f:
            line = line.strip()
            assert line.startswith('■')
            word, def_str = line[1:].split(' : ', 1)

            es = word.split('  ')
            assert len(es) <= 2
            if len(es) == 2:
                word, pos = es
                if pos.startswith('{') and pos.endswith('}'):
                    pos = pos[1:-1]
                    pos_elements = pos.split('-')
                    if len(pos_elements) >= 2 and pos_elements[-1].isnumeric():
                        pos = '-'.join(pos_elements[:-1])
                    lemma = (word, pos)
                else:
                    # broken entry
                    continue
            else:
                lemma = word

            if word not in words:
                continue

            if '【変化】' in def_str:
                for e in def_str.split('、'):
                    e = e.strip()
                    if e.startswith('【変化】'):
                        e = e[4:]
                        e = e.split('》')[1]
                        forms = e.split(' | ')
                        forms2 = []
                        for form in forms:
                            for f in form.split('または'):
                                f = f.strip()
                                forms2.append(f)
                if word not in forms2:
                    for form in forms2:
                        if form in inflection_dict and inflection_dict[form] != word:
                            word2 = inflection_dict[form]
                            use_previous = True
                            for defs in entries[word2].values():
                                for d in defs:
                                    if '<→' in d:
                                        use_previous = False
                            if use_previous:
                                print(f'Ignored: {form} -> {word}', file=sys.stderr)
                            else:
                                inflection_dict[form] = word
                                print(f'Overridden: {form} -> {word} (previous: {word2})', file=sys.stderr)
                        else:
                            inflection_dict[form] = word

            entries[word][lemma].append(def_str)
    
    with open(dict_path, 'w') as f_dict:
        for word, v in entries.items():
            lemmas = []
            defs = []
            for lemma, d in sorted(v.items(), key=lambda t: (','.join(t[0]) if isinstance(t[0], tuple) else t[0], t[1])):
                if isinstance(lemma, tuple):
                    lemma, pos = lemma
                    #forms = []
                    #if '動' in pos:
                    #    forms.extend(verb_forms(word))
                    #elif pos.startswith('名'):
                    #    forms.extend(noun_forms(word))
                    #for form in forms:
                    #    if form not in inflection_dict:
                    #        inflection_dict[form] = word
                    #        print(f'ADDED: {form} -> {word}')
                    lemma_str = f'{lemma} {{{pos}}}'
                else:
                    lemma_str = lemma
                lemmas.append(lemma_str)
                defs.append(d)
            obj = {
                'word': word,
                'lemmas': lemmas,
                'defs': defs,
            }
            print(json.dumps(obj), file=f_dict)


if __name__ == "__main__":
    main()