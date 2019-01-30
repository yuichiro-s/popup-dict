for lang in EnglishEijiro GermanWiktionary Chinese; do
  # in
  dict=data/$lang/dict.json
  inflection=data/$lang/inflection
  frequency=data/$lang/frequency

  # out
  pkg=data/$lang/package
  lemmatizer=$pkg/lemmatizer.json
  trie=$pkg/trie.json
  entries=$pkg/entries.json
  dictionary=$pkg/dictionary
  frequency_out=$pkg/frequency.json

  mkdir -p $pkg
  (
    python scripts/build_lemmatizer.py $dict $inflection > $lemmatizer
    python scripts/build_trie.py $lang $dict $lemmatizer > $trie
    python scripts/build_entries.py $lang $dict $lemmatizer > $entries
    python scripts/build_dictionary.py $lang $dict $lemmatizer $frequency $dictionary $frequency_out
    cp data/$lang/settings.toml $pkg
  )
done
