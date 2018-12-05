import json
import sys
from util import load_dictionary
import tqdm

MAX_DEPTH = 10


def main(lang, dict_path, inflection_path):
    # load dictionary
    d = load_dictionary(dict_path)

    # load inflection patterns
    patterns = {}
    with open(inflection_path) as f:
        for line in f:
            es = line.strip().split('\t')
            if len(es) == 2:
                lemma, form = es
                patterns[form] = lemma

    lemmatizer = {}
    for original_form in patterns.keys():
        if len(original_form.split()) == 1:
            # ignore phrases
            form = original_form
            for _ in range(MAX_DEPTH):
                if form in d:
                    if form != original_form:
                        lemmatizer[original_form] = form
                    break
                if form not in patterns:
                    break
                else:
                    form = patterns[form]

    print(json.dumps(lemmatizer))


if __name__ == '__main__':
    main(*sys.argv[1:])