import json


def tokenize(text, lang, lower=False):
    if lower:
        text = text.lower()
    if lang == 'Chinese':
        return list(text)
    else:
        return text.split()


_CACHE = {}


def lemmatize(text, lang, lemmatizer_path, lower=False):
    key = (lemmatizer_path, lower)
    if key in _CACHE:
        lemmatizer = _CACHE[key]
    else:
        with open(lemmatizer_path) as f:
            lemmatizer = json.load(f)
        if lower:
            new_lemmatizer = {}
            for k, v in lemmatizer.items():
                new_lemmatizer[k.lower()] = v.lower()
            lemmatizer = new_lemmatizer
        _CACHE[key] = lemmatizer

    result = []
    for token in tokenize(text, lang, lower):
        lemma = lemmatizer.get(token, token)
        result.append(lemma)
    return result


def load_dictionary(path):
    result = {}
    with open(path) as f:
        for line in f:
            obj = json.loads(line)
            word = obj['word']
            result[word] = obj
    return result