<template>
  <v-dialog :value="true" persistent>
    <v-stepper v-model="e1">
      <v-stepper-header>
        <v-stepper-step :complete="e1 > 1" step="1">Select EIJIRO file</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="e1 > 2" step="2">Select auxiliary files</v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3">Done</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-btn @click="selectEijiroButton">Select EIJIRO</v-btn>
          <file-upload v-model="eijiroFileData" ref="uploadEijiro"></file-upload>

          <p>{{ eijiroFileData }}</p>
          <v-btn color="primary" @click="e1 = 2" :disabled="eijiroFile === null">Continue</v-btn>
          <v-btn flat @click="cancel">Cancel</v-btn>
        </v-stepper-content>

        <v-stepper-content step="2">
          <div v-if="auxiliaryFilesData.length > 0">
            <v-alert
              v-model="errors[idx]"
              type="error"
              v-for="(msg, idx) in errors"
              :key="msg"
            >{{ msg }}</v-alert>
          </div>
          <p>{{ auxiliaryFilesData }}</p>
          <file-upload directory multiple v-model="auxiliaryFilesData" ref="uploadAuxiliary"></file-upload>
          <v-btn @click="selectAuxiliaryButton">Select auxiliary files</v-btn>

          <v-btn color="primary" @click="e1 = 3; startImport()" :disabled="!importable">Import</v-btn>
          <v-btn flat @click="cancel">Cancel</v-btn>
        </v-stepper-content>

        <v-stepper-content step="3">
          <div class="text-xs-center">
            <v-progress-linear :value="importProgressToShow" color="primary" :height="30"></v-progress-linear>
            <h2>{{ importMessage }}</h2>
          </div>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import FileUpload from "vue-upload-component";
import { throttle } from "lodash-es";

import { IPackage } from "../../common/package";
import { IProgress } from "../../common/importer";
import { sendCommand } from "../../content/command";

import { loadEijiroFromFiles } from "../../options/eijiro";
import { preventUnload } from "../prevent-unload";

export default Vue.extend({
  name: "EijiroImporter",
  data() {
    return {
      e1: 1,
      eijiroFileData: [],
      auxiliaryFilesData: [],

      // progres
      importing: false,
      importProgress: 0,
      importProgressToShow: 0,
      importMessage: " "
    };
  },
  components: {
    FileUpload
  },
  computed: {
    eijiroFile() {
      if (this.eijiroFileData.length === 1) {
        return this.eijiroFileData[0].file;
      } else {
        return null;
      }
    },
    inflectionFile() {
      return this.findFile("inflection");
    },
    frequencyFile() {
      return this.findFile("frequency");
    },
    whitelistFile() {
      return this.findFile("whitelist");
    },
    importable() {
      return (
        this.eijiroFile &&
        this.inflectionFile &&
        this.frequencyFile &&
        this.whitelistFile
      );
    },
    errors() {
      const errors = [];
      if (!this.inflectionFile) errors.push('File "inflection" not found.');
      if (!this.frequencyFile) errors.push('File "frequency" not found.');
      if (!this.whitelistFile) errors.push('File "whitelist" not found.');
      return errors;
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
    selectAuxiliaryButton() {
      this.auxiliaryFilesData = [];
      const input = this.$refs.uploadAuxiliary.$el.querySelector("input");
      input.click();
    },
    selectEijiroButton() {
      const input = this.$refs.uploadEijiro.$el.querySelector("input");
      input.click();
    },
    findFile(name: string) {
      for (const file of this.auxiliaryFilesData) {
        if (file.file.name === name) {
          return file.file;
        }
      }
      return null;
    },
    startImport() {
      preventUnload(true);
      this.importing = true;
      loadEijiroFromFiles(
        this.eijiroFile,
        this.inflectionFile,
        this.frequencyFile,
        this.whitelistFile,
        (progress: IProgress) => {
          const p = Math.round(progress.ratio * 100);
          this.importProgress = p;
          this.importMessage = `[${p}%] ${progress.msg}`;
        }
      )
        .then((pkg: IPackage) => {
          alert(`Successfully imported ${pkg.name}.`);
          this.done(pkg);
        })
        .catch(err => {
          alert(err);
          this.cancel();
        });
    }
  },
  watch: {
    importProgress: throttle(function() {
      this.importProgressToShow = this.importProgress;
    }, 1000),
  }
});
</script>

<style>
</style>
