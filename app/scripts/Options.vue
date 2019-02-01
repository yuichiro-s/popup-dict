<template>
  <div id="app">
    <v-app>
      <app-navigation></app-navigation>
      <v-content transition="slide-x-transition">
        <v-container fluid>
          <router-view></router-view>
        </v-container>
      </v-content>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import AppNavigation from "./components/AppNavigation.vue";

export default Vue.extend({
  name: "App",
  components: {
    AppNavigation
  }
});
</script>

<style scoped>
</style>
