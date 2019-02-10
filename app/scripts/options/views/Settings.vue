<template>
  <div>
    <package-importer
      v-if="importDialog"
      @cancel="importDialog = false"
      @done="importDialog = false; showNewPackage($event)"
    ></package-importer>

    <eijiro-importer
      v-if="eijiroDialog"
      @cancel="eijiroDialog = false"
      @done="eijiroDialog = false; showNewPackage($event)"
    ></eijiro-importer>

    <!-- delete dialog -->
    <v-dialog v-model="deleteDialog" v-if="currentPackage" :persistent="deleting">
      <v-card>
        <v-card-title primary-title>
          <div class="headline">Delete package</div>
        </v-card-title>
        <v-card-text class="body-2">
          Are you sure you want to delete
          <span class="font-italic">{{ this.currentPackage.name }}</span>? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false" :disabled="deleting" :loading="deleting">Cancel</v-btn>
          <v-btn @click="deletePackage" :disabled="deleting" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <file-upload v-model="userDataFiles" :extensions="['json']" ref="uploadUserData"></file-upload>

    <v-card>
      <!-- import/export of user data -->
      <h1>User data</h1>
      <v-btn @click="importUserDataButton">Import User Data</v-btn>
      <v-btn @click="exportUserDataButton">Export User Data</v-btn>

      <v-divider></v-divider>

      <!-- global settings -->
      <global-settings-editor></global-settings-editor>

      <v-divider></v-divider>

      <!-- package settings -->
      <h1>Packages</h1>
      <v-btn @click="importDialog = true">Import New Package</v-btn>
      <v-btn @click="eijiroDialog = true" :disabled="eijiroExists">Import EIJIRO</v-btn>

      <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
      <v-btn @click="deleteDialog = true" :disabled="!currentPackage">Delete This Package</v-btn>
      <package-editor :pkg="currentPackage" v-if="currentPackage"></package-editor>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import FileUpload from "vue-upload-component";
import { throttle } from "lodash-es";

import { IProgress } from "../../common/importer";
import { sendCommand } from "../../content/command";
import { IPackage } from "../../common/package";

import { keys } from "../../common/objectmap";

import { EIJIRO_PKG_ID } from "../../preprocess/eijiro";

import PackageEditor from "../components/PackageEditor.vue";
import EijiroImporter from "../components/EijiroImporter.vue";
import PackageImporter from "../components/PackageImporter.vue";
import GlobalSettingsEditor from "../components/GlobalSettingsEditor.vue";
import { togglePreventUnload } from "../prevent-unload";
import { importPackageFromFiles, validatePackage, loadFile } from "../importer";

export default Vue.extend({
  data: () => ({
    deleteDialog: false,
    deleting: false,
    importDialog: false,
    eijiroDialog: false,
    packages: {},
    currentPkgId: null,
    files: [],
    userDataFiles: []
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
    },
    eijiroExists() {
      return keys(this.packages).some(pkgId => pkgId === EIJIRO_PKG_ID);
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
    FileUpload,
    EijiroImporter,
    GlobalSettingsEditor,
    PackageImporter
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
    reloadPackages() {
      return new Promise(resolve => {
        sendCommand({ type: "get-packages" }).then(packages => {
          this.packages = packages;
          resolve();
        });
      });
    },
    importUserDataButton() {
      const input = this.$refs.uploadUserData.$el.querySelector("input");
      input.click();
    },
    exportUserDataButton() {
      sendCommand({ type: "export-user-data" }).then(json => {
        let blob = new Blob([json], { type: "text/json" });
        let e = document.createEvent("MouseEvents");
        let a = document.createElement("a");
        a.download = "highlighter_backup.json";
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
        e.initMouseEvent(
          "click",
          true,
          false,
          window,
          0,
          0,
          0,
          0,
          0,
          false,
          false,
          false,
          false,
          0,
          null
        );
        a.dispatchEvent(e);
      });
    },
    showNewPackage(pkg: IPackage) {
      this.reloadPackages().then(() => {
        this.currentPkgId = pkg.id;
      });
    },
  },
  watch: {
    userDataFiles(value) {
      if (value.length === 1) {
        let f: File = value[0].file;
        loadFile(f)
          .then(data => {
            sendCommand({ type: "import-user-data", data })
              .then(() => {
                alert("Import completed.");
              })
              .catch(alert);
          })
          .catch(alert);
      }
    },
    deleting(value) {
      togglePreventUnload(value);
    },
  }
});
</script>

<style scoped>
</style>
