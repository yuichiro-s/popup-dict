import Vue from 'vue';
import VueRouter from 'vue-router';
import WordList from './views/WordList.vue';
import Settings from './views/Settings.vue';
import History from './views/History.vue';
import Filter from './views/Filter.vue';

Vue.use(VueRouter);

export default new VueRouter({
    routes: [
        {
            path: '/settings',
            name: 'settings',
            component: Settings,
        },
        {
            path: '/wordlist',
            name: 'wordlist',
            component: WordList,
        },
        {
            path: '/history',
            name: 'history',
            component: History,
        },
        {
            path: '/filter',
            name: 'filter',
            component: Filter,
        },
    ]
});