<template>
  <span>
    <v-toolbar fixed app>
      <v-btn flat to="/settings">Settings</v-btn>
      <v-btn flat to="/wordlist">Word List</v-btn>
    </v-toolbar>
  </span>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "AppNavigation"
});
</script>

<style scoped>
</style>
