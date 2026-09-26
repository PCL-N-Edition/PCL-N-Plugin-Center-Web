import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
export default defineConfig({plugins:[vue()],resolve:{alias:{'@':path.resolve('src')}},server:{host:'127.0.0.1',port:5730,proxy:{'/api':{target:'http://127.0.0.1:5732'},'/auth':{target:'http://127.0.0.1:5733'}}}});
