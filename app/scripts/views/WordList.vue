<template>
  <div>
    <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
    <div>
      <p>Known: {{ stats ? stats.knownCount : '???' }}</p>
      <p>Marked: {{ stats ? stats.markedCount : '???' }}</p>
    </div>
    <v-text-field
      append-icon="search"
      label="Search"
      single-line
      hide-details
      v-model="searchInput"
    ></v-text-field>
    <v-data-table
      :headers="headers"
      :items="entries"
      :loading="loading"
      :search="searchQuery"
      :rows-per-page-items="[100, 500, 1000, {'text': 'All', 'value': -1}]"
      :pagination.sync="pagination"
    >
      <template slot="items" slot-scope="props">
        <td>{{ props.item.dateStr }}</td>
        <td v-if="freqSupported">{{ props.item.freq }}</td>
        <td>{{ props.item.key }}</td>
        <td>
          <span>{{ props.item.context.before }}</span>
          <span class="word-in-context">{{ props.item.context.word }}</span>
          <span>{{ props.item.context.after }}</span>
        </td>
        <td>
          <a :href="props.item.source.url" target="_blank">{{ props.item.source.title }}</a>
        </td>
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
import { MarkedEntry, State } from "../entry";

interface TableEntry {
  date: number;
  dateStr: string;
  freq: number;
  key: string;
  context: {
    before: string;
    word: string;
    after: string;
  };
  source: {
    url: string;
    title: string;
  };
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
        type: "get-entry-stats",
        pkgId: pkg.id
      }).then(stats => {
        this.stats = stats;
      });
      getEntriesToShow(pkg.id).then(({ entries, entryToFreq }) => {
        let headers = [
          { text: "Date", value: "date" },
          { text: "Key", value: "key" },
          { text: "Context", value: "date", sortable: false },
          { text: "Source", value: "date", sortable: false }
        ];
        this.freqSupported = entryToFreq !== null;
        if (entryToFreq !== null) {
          headers.splice(1, 0, { text: "Frequency", value: "freq" });
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
            context: splitContext(
              entry.context.text,
              entry.context.begin,
              entry.context.end
            ),
            source: entry.source
          });
        }
        this.entries = newEntries;
        this.loading = false;
      });
    },
    searchInput: debounce(function() {
      this.searchQuery = this.searchInput;
    }, 300)
  }
});
</script>

<style scoped>
.word-in-context {
  color: red;
  font-weight: bold;
}
</style>
