import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

export default new VueRouter({
    routes: [
        {
            path: "/settings",
            name: "settings",
            component: () => import("./views/Settings.vue"),
        },
        {
            path: "/settings/global/blacklist-languages",
            name: "settings-global-blacklist-languages",
            component: () => import("./views/global-settings/BlacklistLanguages.vue"),
        },
        {
            path: "/wordlist",
            name: "wordlist",
            component: () => import("./views/WordList.vue"),
        },
        {
            path: "/history",
            name: "history",
            component: () => import("./views/History.vue"),
        },
        {
            path: "/filter",
            name: "filter",
            component: () => import("./views/Filter.vue"),
        },
    ],
});
