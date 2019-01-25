<template>
  <div>
    <v-select :items="items" v-model="currentPackage" label="Select package"></v-select>
    <v-data-table :headers="headers" :items="entries" :loading="loading">
      <template slot="items" slot-scope="props">
        <td>{{ props.item.date }}</td>
        <td>{{ props.item.frequency }}</td>
        <td>{{ props.item.key }}</td>
        <td>{{ props.item.context }}</td>
        <td>{{ props.item.source }}</td>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { sendCommand } from "../command";
import { Settings } from "../settings";
import { PackageID } from "../packages";
import { MarkedEntry, State } from "../entry";
import { DictionaryItem } from "../dictionary";

interface TableEntry {
  date: number;
  frequency: number;
  key: string;
  context: string;
  source: string;
}

async function getEntriesToShow(pkgId: PackageID) {
  let entries: MarkedEntry[] = await sendCommand({
    type: "list-entries",
    pkgId,
    state: State.Marked
  });
  let entryToItem = new Map<MarkedEntry, DictionaryItem>();
  const items = await sendCommand({
    type: "lookup-dictionary",
    pkgId,
    keys: entries.map(entry => entry.key)
  });
  for (let i = 0; i < items.length; i++) {
    entryToItem.set(entries[i], items[i]);
  }
  return { entries, entryToItem };
}

export default Vue.extend({
  data: () => ({
    packages: {},
    currentPackage: null,
    headers: [
      { text: "Date", value: "date" },
      { text: "Frequency", value: "frequency" },
      { text: "Key", value: "key" },
      { text: "Context", value: "date", sortable: false },
      { text: "Source", value: "date", sortable: false }
    ],
    loading: false,
    entries: []
  }),
  computed: {
    items() {
      const items = [];
      for (const pkgId in this.packages) {
        const pkg = this.packages[pkgId];
        items.push({
          text: pkg.name,
          value: pkg
        });
      }
      return items;
    }
  },
  created() {
    sendCommand({ type: "get-packages" }).then(packages => {
      this.packages = packages;
    });
  },
  watch: {
    currentPackage(pkg: Settings) {
      this.loading = true;
      getEntriesToShow(pkg.id).then(({ entries, entryToItem }) => {
        const newEntries: TableEntry[] = [];
        for (let entry of entries) {
          let item = entryToItem.get(entry);
          newEntries.push({
            date: entry.date,
            frequency: (item && item.freq) || 0,
            key: entry.key,
            context: entry.context.text,
            source: entry.source.title
          });
        }
        this.entries = newEntries;
        this.loading = false;
      });
    }
  },
  methods: {}
});
</script>

<style scoped>
</style>
