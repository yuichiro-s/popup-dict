<template>
  <div>
    <package-selector v-model="currentPackage"></package-selector>

    <v-flex xs12>
      <v-subheader class="pl-0">Rank</v-subheader>
      <v-slider
        v-model="slider"
        :min="1"
        :max="entryCount"
        thumb-label="always"
        @change="update"
        :thumb-size="64"
      ></v-slider>

      <v-subheader class="pl-0">Entries to be marked as known</v-subheader>
      <v-btn @click="markAsKnown">Mark as known</v-btn>
      <v-data-table
        :headers="headers"
        :items="entriesToShow"
        item-key="key"
        :loading="loading"
        :rows-per-page-items="[100]"
      >
        <template slot="items" slot-scope="props">
          <td class="caption">{{ props.item.rank }}</td>
          <td class="caption">{{ props.item.freq }}</td>
          <td class="body-2">{{ props.item.keyDisplay }}</td>
        </template>
      </v-data-table>
    </v-flex>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import debounce from "lodash/debounce";

import { sendCommand } from "../command";
import { Settings } from "../settings";
import { PackageID } from "../packages";
import { DictionaryItem } from "../dictionary";
import { Entry, MarkedEntry, KnownEntry, State } from "../entry";
import { createToolTip } from "../tooltip";

import PackageSelector from "../components/PackageSelector.vue";

interface TableEntry {
  freq: number;
  rank: number;
  key: string;
  keyDisplay: string;
  entry: Entry;
}

let allEntries: TableEntry[] = [];
const MAX_RANK = 20000;

async function getEntriesToShow(pkgId: PackageID) {
  let entries: Entry[] = await sendCommand({
    type: "list-entries",
    pkgId
  });
  const freqs = await sendCommand({
    type: "get-frequency",
    pkgId,
    keys: entries.map(entry => entry.key)
  });
  let entryToFreq = new Map<Entry, number>();
  for (let i = 0; i < freqs.length; i++) {
    entryToFreq.set(entries[i], freqs[i]);
  }
  return { entries, entryToFreq };
}

export default Vue.extend({
  data: () => ({
    currentPackage: null,
    headers: [
      { text: "Rank", value: "rank", sortable: false },
      { text: "Freq", value: "freq", sortable: false },
      { text: "Key", value: "keyDisplay", sortable: false }
    ],
    loading: false,
    entriesToShow: [],
    entryCount: 0,
    slider: 1
  }),
  components: { PackageSelector },
  watch: {
    currentPackage(pkg: Settings) {
      this.loading = true;
      getEntriesToShow(pkg.id).then(({ entries, entryToFreq }) => {
        const entriesWithFreq = [];
        for (let entry of entries) {
          if (entryToFreq.has(entry)) {
            let freq = entryToFreq.get(entry)!;
            entriesWithFreq.push({
              freq,
              entry
            });
          }
        }
        entriesWithFreq.sort((a, b) => b.freq - a.freq);
        const newEntries: TableEntry[] = [];
        for (let i = 0; i < Math.min(entriesWithFreq.length, MAX_RANK); i++) {
          const entryWithFreq = entriesWithFreq[i];
          const entry = entryWithFreq.entry;
          const keyDisplay = this.currentPackage.tokenizeByWhiteSpace
            ? entry.key
            : entry.key.replace(/ /g, "");
          const rank = i + 1;
          newEntries.push({
            freq: entryWithFreq.freq,
            rank,
            key: entry.key,
            keyDisplay,
            entry
          });
        }
        allEntries = newEntries;
        this.entryCount = allEntries.length;
        this.loading = false;
        this.slider = 1;
        this.update();
      });
    }
  },
  methods: {
    update() {
      const i = this.slider;
      this.entriesToShow = allEntries.slice(0, i).reverse();
    },
    markAsKnown() {
      const n = this.entriesToShow.length;
      if (
        confirm(
          `Are you sure you want to mark ${n} entries as known? This action cannot be undone.`
        )
      ) {
        const entries: KnownEntry[] = [];
        for (const tableEntry of this.entriesToShow) {
          const entry = tableEntry.entry;
          const newEntry: KnownEntry = {
            pkgId: entry.pkgId,
            key: entry.key,
            state: State.Known
          };
          entries.push(newEntry);
        }
        sendCommand({ type: "update-entries", entries }).then(() => {
          alert(`Successfully marked ${n} entries as known.`);
        });
      }
    }
  }
});
</script>

<style>
</style>
