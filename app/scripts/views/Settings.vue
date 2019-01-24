<template>
<div>
    <p>Settings</p>
<p>{{counter}}</p>
<button @click="onClick">Increment</button>
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
<style lang="scss" scoped>

</style>
