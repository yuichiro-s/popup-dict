for lang in German English Chinese ChineseHanzi; do
  (
    python scripts/build_lemmatizer.py $lang data/$lang/{dict,inflection} > app/data/$lang/lemmatizer.json
    python scripts/build_trie.py $lang data/$lang/dict app/data/$lang/lemmatizer.json > app/data/$lang/trie.json
    python scripts/build_entries.py $lang data/$lang/dict app/data/$lang/lemmatizer.json > app/data/$lang/entries.json
    python scripts/build_dictionary.py $lang data/$lang/dict app/data/$lang/lemmatizer.json data/$lang/frequency > app/data/$lang/dictionary.json
  )
done
