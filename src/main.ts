import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './routers';
import i18n from './languages';
import './styles/cloud.css';
createApp(App).use(i18n).use(ElementPlus).use(router).mount('#app');
