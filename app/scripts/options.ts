import Vue from 'vue';
import router from './router';
import Options from './Options.vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';

Vue.use(Vuetify);

new Vue({
    router,
    el: '#app',
    render: h => h(Options),
});