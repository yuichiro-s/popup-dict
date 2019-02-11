<template>
  <v-layout justify-center>
    <v-dialog :value="true" persistent max-width="800px">
      <v-card>
        <v-card-title primary-title>
          <div class="headline">Delete <span class="font-italic">{{ this.pkg.name }}</span></div>
        </v-card-title>

        <v-card-text class="body-2">
          <div v-if="!deleting">
            Are you sure you want to delete
            <span class="font-italic">{{ this.pkg.name }}</span>? This cannot be undone.
          </div>
          <div v-else>
            <v-progress-linear indeterminate color="primary" :height="30"></v-progress-linear>
          </div>
        </v-card-text>

        <v-card-actions v-if="!deleting">
          <v-spacer></v-spacer>
          <v-btn @click="cancel" flat>Cancel</v-btn>
          <v-btn @click="startDelete" :disabled="deleting" color="error">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script lang="ts">
import Vue from "vue";

import { sendCommand } from "../../content/command";
import { preventUnload } from "../prevent-unload";

export default Vue.extend({
  name: "PackageDeleter",
  props: ["pkg"],
  data: () => ({
    deleting: false
  }),
  methods: {
    cancel() {
      preventUnload(false);
      this.$emit("cancel");
    },
    done() {
      preventUnload(false);
      this.$emit("done");
    },
    startDelete() {
      let name = this.pkg.name;
      preventUnload(true);
      this.deleting = true;
      sendCommand({
        type: "delete-package",
        pkgId: this.pkg.id
      }).then(() => {
        alert(`${name} has been successfully deleted.`);
        this.done();
      });
    }
  }
});
</script>