<template>
  <v-list-tile @click="$emit('click')">
    <v-list-tile-content>
      <v-list-tile-title>{{ title }}</v-list-tile-title>
      <v-list-tile-subtitle v-if="subtitle">{{ subtitle }}</v-list-tile-subtitle>
    </v-list-tile-content>
    <v-list-tile-action>
      <v-icon>arrow_right</v-icon>
    </v-list-tile-action>
  </v-list-tile>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "ListItem",
  props: ["title", "subtitle", "to"]
});
</script>