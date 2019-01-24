<template>
<div>
    <p>WordList</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    data: () => ({
        counter: 0,
    }),
    computed: {},
    created () {},
    mounted () {},
    methods: {
        onClick() {
            this.counter = this.counter + 1;
        },
    },
})
</script>

<style scoped>
</style>
