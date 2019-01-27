<template>
  <span>
    <v-toolbar fixed app dense color="primary" dark>
      <v-toolbar-items>
        <v-btn flat to="/settings">Settings</v-btn>
        <v-btn flat to="/wordlist">Word List</v-btn>
      </v-toolbar-items>
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
