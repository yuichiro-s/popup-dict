import Vue from 'vue';
import router from './options/router';
import Options from './options/Options.vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

Vue.use(Vuetify, {
    iconfont: 'mdi',
});

new Vue({
    router,
    el: '#app',
    render: h => h(Options),
});