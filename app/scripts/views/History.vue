<template>
  <div>
    <div>
      <h1>History</h1>
      <package-selector v-model="currentPackage"></package-selector>
    </div>
    <v-data-table :headers="headers" :items="entries" item-key="key" :loading="loading">
      <template slot="items" slot-scope="props">
        <td>{{ new Date(props.item.date).toLocaleDateString() }}</td>
        <td>{{ props.item.known }}</td>
        <td>{{ props.item.marked }}</td>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import FileUpload from "vue-upload-component";

import { sendCommand } from "../command";
import { Settings } from "../settings";
import { importPackage, validatePackage, loadFile } from "../importer";
import { PackageID } from "../packages";
import { getStatsHistory } from "../stats";

import PackageEditor from "../components/PackageEditor.vue";
import PackageSelector from "../components/PackageSelector.vue";

export default Vue.extend({
  data: () => ({
    currentPackage: null,
    headers: [
      { text: "Date", value: "date" },
      { text: "Known", value: "known" },
      { text: "Marked", value: "marked" }
    ],
    entries: [],
    loading: false
  }),
  components: { PackageSelector },
  watch: {
    currentPackage(pkg: Settings) {
      this.loading = true;
      getStatsHistory(pkg.id).then(res => {
        const entries = [];
        for (let stats of res) {
          entries.push({
            date: stats.date,
            known: stats.knownCount,
            marked: stats.markedCount
          });
        }
        this.entries = entries;
        this.loading = false;
      });
    }
  }
});
</script>

<style scoped>
</style>
