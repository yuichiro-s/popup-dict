<template>
  <v-select :items="items" v-model="currentPackage" label="Select package"></v-select>
</template>

<script lang="ts">
import Vue from "vue";

import { IPackage } from '../../common/package';
import { sendCommand } from '../../content/command';

export default Vue.extend({
  props: ["value"],
  data: () => ({
    packages: {},
    currentPackage: null,
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
    sendCommand({ type: "get-packages" }).then(packages => {
      this.packages = packages;
      let pkgs = Object.values(packages);
      if (pkgs.length > 0) {
        this.currentPackage = pkgs[0];
      }
    });
  },
  watch: {
    currentPackage(newValue: IPackage) {
      this.$emit("input", newValue);
    }
  }
});
</script>

<style scoped>
</style>
