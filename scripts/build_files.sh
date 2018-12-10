for lang in German English Chinese ChineseHanzi; do
  # in
  dict=data/$lang/dict
  inflection=data/$lang/inflection
  frequency=data/$lang/frequency

  # out
  pkg=data/$lang/package
  lemmatizer=$pkg/lemmatizer.json
  trie=$pkg/trie.json
  entries=$pkg/entries.json
  dictionary=$pkg/dictionary

  mkdir -p $pkg
  (
    python scripts/build_lemmatizer.py $lang $dict $inflection > $lemmatizer
    python scripts/build_trie.py $lang $dict $lemmatizer > $trie
    python scripts/build_entries.py $lang $dict $lemmatizer > $entries
    python scripts/build_dictionary.py $lang $dict $lemmatizer $frequency $dictionary
  )
done
