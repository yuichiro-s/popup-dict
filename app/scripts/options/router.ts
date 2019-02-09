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
