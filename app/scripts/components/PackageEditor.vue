<template>
  <span>
    <h1>{{pkg.id}}</h1>
    <v-text-field label="Name" v-model="pkg.name"></v-text-field>
    <v-text-field label="Language Code (ISO 639-3)" v-model="pkg.languageCode"></v-text-field>
    <!-- TODO: edit capitalization option -->
    <v-select
      :items="showDictionaryValues"
      label="When to show the dictionary tooltip"
      v-model="pkg.showDictionary"
    ></v-select>
    <!-- TODO: edit dictionaries -->
  </span>
</template>

<script lang="ts">
import Vue from "vue";
import { debounce } from "lodash";
import { sendCommand } from "../command";
import { Settings } from "../settings";

export default Vue.extend({
  name: "PackageEditor",
  props: ["pkg"],
  watch: {
    pkg: {
      handler() {
        this.updatePackage();
      },
      deep: true
    }
  },
  data() {
    return {
      showDictionaryValues: [
        { text: "Always", value: "always" },
        { text: "Unknown or Marked", value: "unknown-or-marked" },
        { text: "Never", value: "never" }
      ]
    };
  },
  methods: {
    updatePackage: debounce(function() {
      let pkgId = this.pkg.id;
      sendCommand({ type: "update-package", pkg: this.pkg }).then(() => {
        console.log(`Updated package: ${pkgId}`);
      });
    }, 300)
  }
});
</script>

<style scoped>
</style>
