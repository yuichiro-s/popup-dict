<template>
  <span>
    <h1>{{pkg.id}}</h1>
    <v-text-field label="Name" v-model="pkg.name"></v-text-field>
    <v-text-field label="Language Code (ISO 639-3)" v-model="pkg.languageCode"></v-text-field>
    <!-- TODO: edit capitalization option -->
    <v-select
      :items="showDictionaryValues"
      label="When to show the dictionary tooltip"
      v-model="pkg.showDictionary"
    ></v-select>
    <v-dialog v-model="dialog">
      <v-btn slot="activator">Add Dictionary</v-btn>
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="editedItem.name" label="Name"></v-text-field>
          <v-text-field v-model="editedItem.pattern" label="Pattern"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="close">Cancel</v-btn>
          <v-btn @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-data-table :headers="headers" :items="pkg.dictionaries">
      <template slot="items" slot-scope="props">
        <td>{{ props.item.name }}</td>
        <td>{{ props.item.pattern }}</td>
        <td>
          <v-icon small @click="editItem(props.item)">edit</v-icon>
          <v-icon small @click="deleteItem(props.item)">delete</v-icon>
        </td>
      </template>
    </v-data-table>
  </span>
</template>

<script lang="ts">
import Vue from "vue";
import { debounce, Dictionary } from "lodash";
import { sendCommand } from "../command";
import { Settings, DictionaryInfo } from "../settings";

export default Vue.extend({
  name: "PackageEditor",
  props: ["pkg"],
  data() {
    return {
      showDictionaryValues: [
        { text: "Always", value: "always" },
        { text: "Unknown or Marked", value: "unknown-or-marked" },
        { text: "Never", value: "never" }
      ],
      headers: [
        { text: "Name", value: "name" },
        { text: "Pattern", value: "pattern" },
        { text: "Actions", value: "name" }
      ],
      dialog: false,
      editedIndex: -1,
      editedItem: {
        name: "",
        pattern: ""
      },
      defaultItem: {
        name: "",
        pattern: ""
      }
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Dictionary" : "Edit Dictionary";
    }
  },
  watch: {
    pkg: {
      handler() {
        this.updatePackage();
      },
      deep: true
    }
  },
  methods: {
    updatePackage: debounce(function() {
      let pkgId = this.pkg.id;
      sendCommand({ type: "update-package", pkg: this.pkg }).then(() => {
        console.log(`Updated package: ${pkgId}`);
      });
    }, 300),
    close() {
      this.dialog = false;
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      }, 300);
    },
    save() {
      if (this.editedIndex > -1) {
        Object.assign(this.pkg.dictionaries[this.editedIndex], this.editedItem);
      } else {
        this.pkg.dictionaries.push(this.editedItem);
      }
      this.close();
    },
    editItem(item: DictionaryInfo) {
      this.editedIndex = this.pkg.dictionaries.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },
    deleteItem(item: DictionaryInfo) {
      const index = this.pkg.dictionaries.indexOf(item);
      confirm(`Are you sure you want to delete ${item.name}?`) &&
        this.pkg.dictionaries.splice(index, 1);
    }
  }
});
</script>

<style>
</style>
