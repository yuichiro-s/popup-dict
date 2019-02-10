<template>
  <div v-if="globalSettings !== null">
    <h1>Language Blacklist</h1>
    <v-btn @click="globalSettings.blacklistedLanguages.push('')">Add</v-btn>
    <div v-for="(code, idx) in globalSettings.blacklistedLanguages" :key="idx">
      <v-text-field v-model="globalSettings.blacklistedLanguages[idx]"></v-text-field>
      <v-icon small @click="globalSettings.blacklistedLanguages.splice(idx, 1)">delete</v-icon>
    </div>
    <h1>URL Blacklist</h1>
    <v-btn @click="globalSettings.blacklistedURLPatterns.push('')">Add</v-btn>
    <div v-for="(pattern, idx) in globalSettings.blacklistedURLPatterns" :key="idx">
      <v-text-field v-model="globalSettings.blacklistedURLPatterns[idx]"></v-text-field>
      <v-icon small @click="globalSettings.blacklistedURLPatterns.splice(idx, 1)">delete</v-icon>
    </div>
    <h1>Highlight Styles</h1>
    <v-btn @click="resetStyle">Reset</v-btn>
    <v-textarea label="Unknown" v-model="globalSettings.highlightStyle.unknown"></v-textarea>
    <v-textarea label="Marked" v-model="globalSettings.highlightStyle.marked"></v-textarea>
    <v-textarea label="Known" v-model="globalSettings.highlightStyle.known"></v-textarea>
    <v-textarea label="Hover" v-model="globalSettings.highlightStyle.hover"></v-textarea>
    <div v-html="previewHTML"></div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { debounce } from "lodash-es";

import { sendCommand } from "../../content/command";
import { INITIAL_HIGHLIGHT_STYLE } from "../../common/global-settings";
import { removeStyle, applyStyle } from "../../content/style";

export default Vue.extend({
  data: () => ({
    globalSettings: null,
    previewHTML: `
    <HLTR data-state="unknown">Unknown</HLTR>
    <HLTR data-state="marked">Marked</HLTR>
    <HLTR data-state="known">Known</HLTR>
    `,
  }),
  created() {
    sendCommand({ type: "get-global-settings" }).then(globalSettings => {
      this.globalSettings = globalSettings;
      applyStyle();
    });
  },
  methods: {
    updateGlobalSettings: debounce(function() {
      sendCommand({
        type: "set-global-settings",
        globalSettings: this.globalSettings
      }).then(() => {
        removeStyle();
        applyStyle();
      });
    }, 300),
    resetStyle() {
      if (confirm(`Are you sure you want to reset the style of highlights?`)) {
        this.globalSettings.highlightStyle = INITIAL_HIGHLIGHT_STYLE;
      }
    }
  },
  watch: {
    globalSettings: {
      handler(newValue, oldValue) {
        if (oldValue !== null) {
          this.updateGlobalSettings();
        }
      },
      deep: true
    }
  }
});
</script>

<style scoped>
</style>
