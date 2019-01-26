<template>
  <span>
    <v-dialog v-model="deleteDialog" v-if="currentPackage" :persistent="deleting">
      <v-card>
        <v-card-text>Are you sure you want to delete {{ this.currentPackage.name }}? This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false" :disabled="deleting" :loading="deleting">Cancel</v-btn>
          <v-btn @click="deletePackage" :disabled="deleting" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="importDialog" :persistent="importing">
      <v-card>
        <v-card-text>Import package</v-card-text>
        <file-upload directory multiple v-model="files">Select</file-upload>
        <ul>
          <li v-for="file in files" :key="file.id">{{file.name}}</li>
        </ul>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="importDialog = false" :disabled="importing" :loading="importing">Cancel</v-btn>
          <v-btn
            @click="importPackage"
            :disabled="importing || files.length === 0"
            :loading="importing"
          >Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn @click="importDialog = true">Import</v-btn>
    <v-btn @click="deleteDialog = true" :disabled="!currentPackage">Delete</v-btn>

    <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
    <package-editor :pkg="currentPackage" v-if="currentPackage"></package-editor>
  </span>
</template>

<script lang="ts">
import Vue from "vue";
import { sendCommand } from "../command";
import { Settings } from "../settings";
import PackageEditor from "../components/PackageEditor.vue";
import FileUpload from "vue-upload-component";
import { importPackage } from "../importer";

export default Vue.extend({
  data: () => ({
    deleteDialog: false,
    deleting: false,
    importDialog: false,
    importing: false,
    packages: {},
    currentPkgId: null,
    files: []
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
    },
    currentPackage() {
      return this.packages[this.currentPkgId];
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
  components: {
    PackageEditor,
    FileUpload
  },
  methods: {
    deletePackage() {
      let name = this.currentPackage.name;
      this.deleting = true;
      sendCommand({
        type: "delete-package",
        pkgId: this.currentPkgId
      }).then(() => {
        this.reloadPackages().then(() => {
          alert(`${name} has been successfully deleted.`);
          this.currentPkgId = null;
          this.deleting = false;
          this.deleteDialog = false;
        });
      });
    },
    importPackage() {
      this.importing = true;
      let files = this.files.map((f: any) => f.file);
      importPackage(files)
        .then(pkg => {
          this.reloadPackages().then(() => {
            alert(`Successfully imported.`);
            this.currentPkgId = pkg.id;
            this.importing = false;
            this.importDialog = false;
          });
        })
        .catch(err => {
          alert(err);
          this.importing = false;
          this.importDialog = false;
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
  },
  watch: {
    importDialog(value) {
      this.files = [];
    }
  }
});
</script>

<style scoped>
</style>
