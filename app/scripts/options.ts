// import "@mdi/font/css/materialdesignicons.min.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import Vue from "vue";
import Vuetify from "vuetify/lib";
import "vuetify/src/stylus/app.styl";
import Options from "./options/Options.vue";
import router from "./options/router";

Vue.use(Vuetify, { iconfont: "mdi" });

new Vue({
    router,
    el: "#app",
    render: (h) => h(Options),
});
