<template>
<span>
    <v-btn>Import</v-btn>
    <v-btn>Delete</v-btn>
    <v-select :items="items" v-model="currentPackage" label="Select package"></v-select>
    <package-editor :pkg="currentPackage" v-if="currentPackage"></package-editor>
</span>
</template>

<script lang="ts">
import Vue from 'vue'
import { sendCommand } from '../command';
import { Settings } from '../settings';
import PackageEditor from '../components/PackageEditor.vue';

export default Vue.extend({
    data: () => ({
        packages: {},
        currentPackage: null,
    }),
    computed: {
        items () {
            const items = [];
            for (const pkgId in this.packages) {
                let pkg = this.packages[pkgId];
                items.push({
                    text: pkg.name,
                    value: pkg,
                });
            }
            return items;
        },
    },
    created () {
        sendCommand({ type: 'get-packages' }).then(packages => {
            this.packages = packages;
        });
    },
    components: {
        PackageEditor,
    },
})
</script>

<style scoped>
</style>
