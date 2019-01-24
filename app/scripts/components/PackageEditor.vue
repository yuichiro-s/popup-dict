<template>
  <span>
    <p>{{pkg.id}}</p>
    <p>{{pkg.name}}</p>
    <!-- show ID -->
    <!-- edit name to display -->
    <!-- edit language code -->
    <!-- edit capitalization option -->
    <!-- edit when to show popup dictionary -->
    <!-- edit dictionaries -->
  </span>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "PackageEditor",
  props: ["pkg"]
});
</script>

<style scoped>
</style>
