<template>
  <div>
    <div>
      <h1>History</h1>
      <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
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
import { sendCommand } from "../command";
import { Settings } from "../settings";
import PackageEditor from "../components/PackageEditor.vue";
import FileUpload from "vue-upload-component";
import { importPackage, validatePackage, loadFile } from "../importer";
import { PackageID } from "../packages";
import { getStatsHistory } from "../stats";

export default Vue.extend({
  data: () => ({
    packages: {},
    currentPkgId: null,
    headers: [
      { text: "Date", value: "date" },
      { text: "Known", value: "known" },
      { text: "Marked", value: "marked" }
    ],
    entries: [],
    loading: false
  }),
  computed: {
    items() {
      const items = [];
      for (const pkgId in this.packages) {
        let pkg = this.packages[pkgId];
        items.push({
          text: pkg.name,
          value: pkgId
        });
      }
      return items;
    }
  },
  created() {
    this.reloadPackages().then(() => {
      let pkgIds = Object.keys(this.packages);
      if (pkgIds.length > 0) {
        this.currentPkgId = pkgIds[0];
      }
    });
  },
  methods: {
    reloadPackages() {
      return new Promise(resolve => {
        sendCommand({ type: "get-packages" }).then(packages => {
          this.packages = packages;
          resolve();
        });
      });
    }
  },
  watch: {
    currentPkgId(pkgId: PackageID) {
      this.loading = true;
      getStatsHistory(pkgId).then(res => {
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
