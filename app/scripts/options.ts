import "@mdi/font/css/materialdesignicons.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import Options from "./options/Options.vue";
import router from "./options/router";

Vue.use(Vuetify, { iconfont: "mdi" });

new Vue({
    router,
    el: "#app",
    render: (h) => h(Options),
});
