<template>
</template>

<script lang="ts">
import Vue from "vue";
import { debounce } from "lodash-es";

import { INITIAL_HIGHLIGHT_STYLE } from "../../../../common/global-settings";
import { sendCommand } from "../../../../content/command";
import { removeStyle, applyStyle } from "../../../../content/style";

export default Vue.extend({
  data: () => ({
    globalSettings: null,
    previewHTML: `
    <HLTR data-state="unknown">Unknown</HLTR>
    <HLTR data-state="marked">Marked</HLTR>
    <HLTR data-state="known">Known</HLTR>
    `
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
