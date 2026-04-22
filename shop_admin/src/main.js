import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
// import "@ckeditor/ckeditor5-build-classic/build/ckeditor.css";
import CKEditor from "@ckeditor/ckeditor5-vue";
createApp(App).use(router).use(CKEditor).mount("#app");
