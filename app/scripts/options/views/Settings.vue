<template>
  <div>
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

    <!-- import dialog -->
    <v-dialog v-model="importDialog" :persistent="importing">
      <v-card>
        <v-card-title primary-title>
          <div class="headline">Import package</div>
        </v-card-title>

        <div v-if="!importing">
          <div v-if="files.length > 0">
            <v-alert
              v-model="messages.errors[idx]"
              type="error"
              v-for="(msg, idx) in messages.errors"
              :key="msg"
            >{{ msg }}</v-alert>
            <v-alert
              v-model="messages.warnings[idx]"
              type="warning"
              v-for="(msg, idx) in messages.warnings"
              :key="msg"
            >{{ msg }}</v-alert>
          </div>
          <v-btn @click="selectPackageDirectoryButton">Select directory</v-btn>
          <file-upload directory multiple v-model="files" ref="upload"></file-upload>
          <ul>
            <li v-for="file in files" :key="file.id">{{ file.name }}</li>
          </ul>
        </div>

        <div v-else>
          <div class="text-xs-center">
            <v-progress-linear :value="importProgressToShow" color="primary" :height="30"></v-progress-linear>
            <h2>{{ importMessage }}</h2>
          </div>
        </div>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="importDialog = false" :disabled="importing">Cancel</v-btn>
          <v-btn @click="importPackage" :disabled="importing || !importable">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <file-upload v-model="userDataFiles" :extensions="['json']" ref="uploadUserData"></file-upload>

    <!-- import/export of user data -->
    <h1>User data</h1>
    <v-btn @click="importUserDataButton">Import User Data</v-btn>
    <v-btn @click="exportUserDataButton">Export User Data</v-btn>

    <v-divider></v-divider>

    <!-- global settings -->
    <div v-if="globalSettings !== null">
      <h1>Language Blacklist</h1>
      <v-btn @click="globalSettings.blacklistedLanguages.push('')">Add</v-btn>
      <div v-for="(code, idx) in globalSettings.blacklistedLanguages" :key="idx">
        <v-text-field v-model="globalSettings.blacklistedLanguages[idx]"></v-text-field>
        <v-icon small @click="globalSettings.blacklistedLanguages.splice(idx, 1)">delete</v-icon>
      </div>
    </div>

    <!-- package settings -->
    <h1>Packages</h1>
    <v-btn @click="importDialog = true">Import New Package</v-btn>
    <v-btn @click="eijiroDialog = true">Import EIJIRO</v-btn>
    <eijiro-importer :dialog="eijiroDialog" @cancel="eijiroDialog = false" @done="eijiroImportDone"></eijiro-importer>

    <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
    <v-btn @click="deleteDialog = true" :disabled="!currentPackage">Delete This Package</v-btn>
    <package-editor :pkg="currentPackage" v-if="currentPackage"></package-editor>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import FileUpload from "vue-upload-component";
import throttle from "lodash/throttle";

import { Progress } from "../../common/importer";
import { sendCommand } from "../../content/command";
import { Package, PackageID } from "../../common/package";

import PackageEditor from "../components/PackageEditor.vue";
import EijiroImporter from "../components/EijiroImporter.vue";
import { togglePreventUnload } from "../prevent-unload";
import { importPackageFromFiles, validatePackage, loadFile } from "../importer";

export default Vue.extend({
  data: () => ({
    deleteDialog: false,
    deleting: false,
    importDialog: false,
    eijiroDialog: false,
    importing: false,
    packages: {},
    currentPkgId: null,
    files: [],
    userDataFiles: [],
    globalSettings: null,

    // progress
    importProgress: 0,
    importProgressToShow: 0,
    importMessage: ""
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
    importable() {
      return this.messages.errors.length === 0;
    },
    messages() {
      let files = this.files.map((f: any) => f.file);
      let { errors, warnings } = validatePackage(files);
      return { errors, warnings };
    }
  },
  created() {
    sendCommand({ type: "get-global-settings" }).then(globalSettings => {
      this.globalSettings = globalSettings;
    });
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
    EijiroImporter
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
    importDone() {
      this.importDialog = false;
      this.importing = false;
    },
    importPackage() {
      this.importMessage = "";
      this.importProgress = 0;
      this.importing = true;

      let files = this.files.map((f: any) => f.file);
      importPackageFromFiles(files, (progress: Progress) => {
        const p = Math.round(progress.ratio * 100);
        this.importProgress = p;
        this.importMessage = `[${p}%] ${progress.msg}`;
      })
        .then((pkg: Package) => {
          this.reloadPackages().then(() => {
            alert(`Successfully imported ${pkg.name}.`);
            this.currentPkgId = pkg.id;
            this.importDone();
          });
        })
        .catch((err: Error) => {
          alert(err);
          this.importDone();
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
    resetFiles() {
      this.files = [];
    },
    selectPackageDirectoryButton() {
      this.resetFiles();
      const input = this.$refs.upload.$el.querySelector("input");
      input.click();
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
    eijiroImportDone(pkg: Package) {
      this.reloadPackages().then(() => {
        alert(`Successfully imported ${pkg.name}.`);
        this.currentPkgId = pkg.id;
        this.eijiroDialog = false;
      });
    }
  },
  watch: {
    importDialog(value) {
      this.resetFiles();
    },
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
    importProgress: throttle(function() {
      this.importProgressToShow = this.importProgress;
    }, 1000),
    importing(value) {
      togglePreventUnload(value);
    },
    deleting(value) {
      togglePreventUnload(value);
    },
    globalSettings: {
      handler() {
        sendCommand({
          type: "set-global-settings",
          globalSettings: this.globalSettings
        });
      },
      deep: true
    }
  }
});
</script>

<style scoped>
</style>
