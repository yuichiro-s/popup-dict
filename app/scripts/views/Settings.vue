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
        items: [],
        currentPackage: null,
    }),
    computed: {},
    created () {
        sendCommand({ type: 'get-packages' }).then(async packages => {
            const pkgIds = Object.keys(packages);
            const items = [];
            for (const pkgId of pkgIds) {
                let pkg = await sendCommand({ type: 'get-package', pkgId });
                let item = {
                    text: pkg.name,
                    value: pkg,
                };
                items.push(item);
            }
            this.items = items;
        });
    },
    mounted () {},
    methods: {},
    components: {
        PackageEditor,
    }
})
</script>

<style scoped>
</style>
