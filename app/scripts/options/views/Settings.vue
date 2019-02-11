<template>
  <div>
    <package-importer
      v-if="importDialog"
      @cancel="importDialog = false"
      @done="importDialog = false; showNewPackage($event)"
    ></package-importer>
    <package-deleter
      :pkg="currentPackage"
      v-if="deleteDialog"
      @cancel="deleteDialog = false"
      @done="deleteDialog = false; currentPkgId = null"
    ></package-deleter>
    <eijiro-importer
      v-if="eijiroDialog"
      @cancel="eijiroDialog = false"
      @done="eijiroDialog = false; showNewPackage($event)"
    ></eijiro-importer>
    <file-upload v-model="userDataFiles" :extensions="['json']" ref="uploadUserData"></file-upload>

    <v-container>
      <v-layout justify-center column>
        <h1>General</h1>
        <v-flex>
          <v-card>
            <global-settings></global-settings>
          </v-card>
        </v-flex>

        <h1>Package</h1>
        <v-flex>
          <v-card>
            <v-list>
              <v-list-tile @click="importDialog = true">
                <v-list-tile-content>
                  <v-list-tile-title>Import package</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-icon>arrow_right</v-icon>
                </v-list-tile-action>
              </v-list-tile>

              <v-divider></v-divider>

              <v-list-tile @click="eijiroDialog = true" :disabled="eijiroExists">
                <v-list-tile-content>
                  <v-list-tile-title>Import 英辞郎</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-icon>arrow_right</v-icon>
                </v-list-tile-action>
              </v-list-tile>

              <v-divider></v-divider>

              <v-list-tile>
                <v-list-tile-content>
                  <v-list-tile-title>Manage packages</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-icon>arrow_right</v-icon>
                </v-list-tile-action>
              </v-list-tile>

              <v-select :items="items" v-model="currentPkgId" label="Select package"></v-select>
            <v-btn @click="deleteDialog = true" :disabled="!currentPackage" @cancel="deleteDialog = false" @done="deleteDialog = false; currentPkgId = null; reloadPackages()">Delete this package</v-btn>
            <!--<package-editor :pkg="currentPackage" v-if="currentPackage"></package-editor>-->
            </v-list>
          </v-card>
        </v-flex>

        <h1>User Data</h1>
        <v-flex>
          <v-card>
            <v-list>
              <v-list-tile @click="exportUserDataButton">
                <v-list-tile-content>
                  <v-list-tile-title>Export</v-list-tile-title>
                  <v-list-tile-sub-title>Your word list and</v-list-tile-sub-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-icon>arrow_right</v-icon>
                </v-list-tile-action>
              </v-list-tile>

              <v-divider></v-divider>

              <v-list-tile @click="importUserDataButton">
                <v-list-tile-content>
                  <v-list-tile-title>Import</v-list-tile-title>
                  <v-list-tile-sub-title>Your word list and</v-list-tile-sub-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-icon>arrow_right</v-icon>
                </v-list-tile-action>
              </v-list-tile>
            </v-list>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
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
import PackageDeleter from "../components/PackageDeleter.vue";
import GlobalSettings from "../components/settings/global-settings/GlobalSettings.vue";
import { importPackageFromFiles, validatePackage, loadFile } from "../importer";

export default Vue.extend({
  data: () => ({
    deleteDialog: false,
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
    GlobalSettings,
    PackageImporter,
    PackageDeleter
  },
  methods: {
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
    }
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
    }
  }
});
</script>

<style scoped>
</style>
