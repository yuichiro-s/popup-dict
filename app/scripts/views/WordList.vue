<template>
  <div>
    <v-layout>
      <v-flex xs4>
        <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
      </v-flex>
      <v-flex xs4>
        <div>
          <span>Known: {{ stats ? stats.knownCount : '???' }}</span>
          <span>Marked: {{ stats ? stats.markedCount : '???' }}</span>
        </div>
      </v-flex>
      <v-flex xs4>
        <v-text-field
          append-icon="search"
          label="Search"
          single-line
          hide-details
          v-model="searchInput"
        ></v-text-field>
      </v-flex>
    </v-layout>
    <v-data-table
      :headers="headers"
      :items="entries"
      item-key="key"
      :loading="loading"
      :search="searchQuery"
      :rows-per-page-items="[100, 500, 1000, {'text': 'All', 'value': -1}]"
      :pagination.sync="pagination"
      expand
    >
      <template slot="items" slot-scope="props">
        <tr
          @click="props.expanded = !props.expanded; expand(props.item)"
          :class="{ known: props.item.known }"
        >
          <td class="caption">{{ props.item.dateStr }}</td>
          <td v-if="freqSupported" class="caption">{{ props.item.freq }}</td>
          <td class="body-2">{{ props.item.keyDisplay }}</td>
          <td>
            <div>
              <span>{{ props.item.context.before }}</span>
              <span class="word-in-context">{{ props.item.context.word }}</span>
              <span>{{ props.item.context.after }}</span>
            </div>
            <div class="caption font-italic">
              <a
                class="source-link"
                :href="props.item.source.url"
                target="_blank"
              >{{ props.item.source.title }}</a>
            </div>
          </td>
        </tr>
      </template>
      <template slot="expand" slot-scope="props">
        <v-card flat :color="props.item.known ? '#ddffdd' : undefined">
          <v-checkbox
            v-model="props.item.known"
            label="I know this"
            @change="changeKnown(props.item)"
          ></v-checkbox>
          <v-card-text
            v-for="(lemma, index) in props.item.lemmas"
            :key="index"
          >{{ lemma }} {{ props.item.defs[index] }}</v-card-text>
        </v-card>
        <v-divider></v-divider>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import debounce from "lodash/debounce";
import { sendCommand } from "../command";
import { Settings } from "../settings";
import { PackageID } from "../packages";
import { Entry, MarkedEntry, KnownEntry, State } from "../entry";

interface TableEntry {
  date: number;
  dateStr: string;
  freq: number;
  key: string;
  keyDisplay: string;
  context: {
    before: string;
    word: string;
    after: string;
  };
  source: {
    url: string;
    title: string;
  };
  lemmas: string[];
  defs: string[][];
  known: boolean;
  entry: MarkedEntry;
}

async function getEntriesToShow(pkgId: PackageID) {
  let entries: MarkedEntry[] = await sendCommand({
    type: "list-entries",
    pkgId,
    state: State.Marked
  });
  const freqs = await sendCommand({
    type: "get-frequency",
    pkgId,
    keys: entries.map(entry => entry.key)
  });
  let entryToFreq;
  if (freqs === null) {
    entryToFreq = null;
  } else {
    entryToFreq = new Map<MarkedEntry, number>();
    for (let i = 0; i < freqs.length; i++) {
      entryToFreq.set(entries[i], freqs[i]);
    }
  }
  return { entries, entryToFreq };
}

function splitContext(text: string, begin: number, end: number) {
  let beforeStr = text.slice(0, begin);
  let word = text.slice(begin, end);
  let afterStr = text.slice(end);
  const MAX_LENGTH = 100;
  if (beforeStr.length >= MAX_LENGTH) {
    beforeStr = "... " + beforeStr.slice(beforeStr.length - MAX_LENGTH);
  }
  if (afterStr.length >= MAX_LENGTH) {
    afterStr = afterStr.slice(0, MAX_LENGTH) + " ...";
  }
  return {
    before: beforeStr,
    word: word,
    after: afterStr
  };
}

export default Vue.extend({
  data: () => ({
    // package info
    packages: {},
    currentPkgId: null,
    stats: null,

    // table
    freqSupported: false,
    headers: [],
    loading: false,
    entries: [],
    searchInput: "",
    searchQuery: "",
    pagination: {
      sortBy: "date",
      descending: true
    }
  }),
  computed: {
    items() {
      const items = [];
      for (const pkgId in this.packages) {
        const pkg = this.packages[pkgId];
        items.push({
          text: pkg.name,
          value: pkgId
        });
      }
      return items;
    },
    currentPackage() {
      return this.packages[this.currentPkgId];
    }
  },
  created() {
    (async () => {
      const packages = await sendCommand({ type: "get-packages" });
      let lastPkgId = await sendCommand({ type: "get-last-package-id" });
      this.packages = packages;
      if (lastPkgId) {
        this.currentPkgId = lastPkgId;
      } else {
        let pkgIds = Object.keys(packages);
        if (pkgIds.length > 0) {
          this.currentPkgId = pkgIds[0];
        }
      }
    })();
  },
  watch: {
    currentPackage(pkg: Settings) {
      this.loading = true;
      this.stats = null;
      sendCommand({
        type: "get-stats",
        pkgId: pkg.id
      }).then(stats => {
        this.stats = stats;
      });
      getEntriesToShow(pkg.id).then(({ entries, entryToFreq }) => {
        let headers = [
          { text: "Date", value: "date" },
          { text: "Key", value: "keyDisplay" },
          { text: "Context", value: "date", sortable: false }
        ];
        this.freqSupported = entryToFreq !== null;
        if (entryToFreq !== null) {
          headers.splice(1, 0, { text: "Freq.", value: "freq" });
        }
        this.headers = headers;

        const newEntries: TableEntry[] = [];
        for (let entry of entries) {
          let freq = (entryToFreq && entryToFreq.get(entry)) || 0;
          newEntries.push({
            date: entry.date,
            dateStr: new Date(entry.date).toLocaleDateString(),
            freq,
            key: entry.key,
            keyDisplay: pkg.tokenizeByWhiteSpace
              ? entry.key
              : entry.key.replace(/ /g, ""),
            context: splitContext(
              entry.context.text,
              entry.context.begin,
              entry.context.end
            ),
            source: entry.source,
            defs: [],
            lemmas: [],
            known: false,
            entry
          });
        }
        this.entries = newEntries;
        this.loading = false;
      });
    },
    searchInput: debounce(function() {
      this.searchQuery = this.searchInput;
    }, 300)
  },
  methods: {
    expand(entry: TableEntry) {
      const pkgId = this.currentPkgId;
      const key = entry.key;
      sendCommand({ type: "lookup-dictionary", pkgId, keys: [key] }).then(
        items => {
          const item = items[0];
          entry.defs = item.defs;
          entry.lemmas = item.lemmas;
        }
      );
    },
    changeKnown(entry: TableEntry) {
      let originalEntry = entry.entry;
      let newEntry: Entry;
      if (entry.known) {
        // change to known
        newEntry = {
          key: originalEntry.key,
          pkgId: originalEntry.pkgId,
          state: State.Known
        };
      } else {
        // change to marked
        newEntry = originalEntry;
      }
      sendCommand({ type: "update-entry", entry: newEntry });
    }
  }
});
</script>

<style>
.word-in-context {
  color: red;
  font-weight: bold;
}
a.source-link {
  color: gray;
  text-decoration: none;
}
a.source-link:hover {
  text-decoration: underline;
}
.known {
  background-color: #ddffdd;
}
</style>
