<template>
  <v-layout justify-center>
    <v-dialog :value="true" persistent max-width="800px">
      <v-card>
        <v-card-title primary-title>
          <div class="headline">Import package</div>
        </v-card-title>

        <v-card-text>
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
        </v-card-text>

        <v-card-actions v-if="!importing">
          <v-spacer></v-spacer>
          <v-btn @click="cancel" flat>Cancel</v-btn>
          <v-btn @click="startImport" :disabled="!importable" color="primary">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang="ts">
import Vue from "vue";
import FileUpload from "vue-upload-component";
import { throttle } from "lodash-es";

import { IProgress } from "../../common/importer";
import { sendCommand } from "../../content/command";
import { IPackage } from "../../common/package";

import { importPackageFromFiles, validatePackage } from "../importer";
import { preventUnload } from "../prevent-unload";

export default Vue.extend({
  name: "PackageImporter",
  data: () => ({
    files: [],

    // progress
    importing: false,
    importProgress: 0,
    importProgressToShow: 0,
    importMessage: ""
  }),
  components: {
    FileUpload
  },
  computed: {
    importable() {
      return this.messages.errors.length === 0;
    },
    messages() {
      let files = this.files.map((f: any) => f.file);
      let { errors, warnings } = validatePackage(files);
      return { errors, warnings };
    }
  },
  methods: {
    cancel() {
      preventUnload(false);
      this.$emit("cancel");
    },
    done(pkg: IPackage) {
      preventUnload(false);
      this.$emit("done", pkg);
    },
    selectPackageDirectoryButton() {
      this.files = [];
      const input = this.$refs.upload.$el.querySelector("input");
      input.click();
    },
    startImport() {
      preventUnload(true);
      this.importing = true;
      this.importMessage = "Started import";
      let files = this.files.map((f: any) => f.file);
      importPackageFromFiles(files, (progress: IProgress) => {
        const p = Math.round(progress.ratio * 100);
        this.importProgress = p;
        this.importMessage = `[${p}%] ${progress.msg}`;
      })
        .then((pkg: IPackage) => {
          alert(`Successfully imported ${pkg.name}.`);
          this.done(pkg);
        })
        .catch((err: Error) => {
          alert(err);
          this.cancel();
        });
    }
  },
  watch: {
    importProgress: throttle(function() {
      this.importProgressToShow = this.importProgress;
    }, 1000)
  }
});
</script>
