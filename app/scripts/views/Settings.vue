<template>
  <span>
    <v-dialog v-model="dialog" v-if="currentPackage" :persistent="removing">
      <v-card>
        <v-card-text>Are you sure you want to delete {{ this.currentPackage.name }}? This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialog = false" :disabled="removing" :loading="removing">Cancel</v-btn>
          <v-btn @click="removePackage" :disabled="removing" :loading="removing">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-btn>Import</v-btn>
    <v-btn @click="dialog = true" :disabled="!currentPackage">Delete</v-btn>
    <v-select :items="items" v-model="currentPackage" label="Select package"></v-select>
    <package-editor :pkg="currentPackage" v-if="currentPackage"></package-editor>
  </span>
</template>

<script lang="ts">
import Vue from "vue";
import { sendCommand } from "../command";
import { Settings } from "../settings";
import PackageEditor from "../components/PackageEditor.vue";

export default Vue.extend({
  data: () => ({
    dialog: false,
    removing: false,
    packages: {},
    currentPackage: null
  }),
  computed: {
    items() {
      const items = [];
      for (const pkgId in this.packages) {
        let pkg = this.packages[pkgId];
        items.push({
          text: pkg.name,
          value: pkg
        });
      }
      return items;
    }
  },
  created() {
    this.reloadPackages();
  },
  components: {
    PackageEditor
  },
  methods: {
    removePackage() {
      let name = this.currentPackage.name;
      this.removing = true;
      sendCommand({
        type: "remove-package",
        pkgId: this.currentPackage.id
      }).then(() => {
        this.reloadPackages().then(() => {
          alert(`${name} has been successfully deleted.`);
          this.removing = false;
          this.dialog = false;
        });
      });
    },
    reloadPackages() {
      return new Promise(resolve => {
        sendCommand({ type: "get-packages" }).then(packages => {
          this.packages = packages;
          resolve();
        });
      });
    }
  }
});
</script>

<style scoped>
</style>
