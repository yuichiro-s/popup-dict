<template>
  <div>
    <v-dialog :value="true" persistent>
      <v-card>
        <v-card-title primary-title>
          <div class="headline">Delete package</div>
        </v-card-title>

        <div v-if="!deleting">
          <v-card-text class="body-2">
            Are you sure you want to delete
            <span class="font-italic">{{ this.pkg.name }}</span>? This cannot be undone.
          </v-card-text>
        </div>
        <div v-else>
          <v-progress-linear indeterminate color="primary" :height="30"></v-progress-linear>
        </div>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="cancel" :disabled="deleting">Cancel</v-btn>
          <v-btn @click="startDelete" :disabled="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
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