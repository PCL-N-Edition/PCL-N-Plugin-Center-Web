<template>
  <div class="cloud-shell">
    <a class="skip-link" href="#cloud-content">跳至内容</a>
    <header class="cloud-header">
      <router-link class="cloud-brand" to="/store"><span class="nexa-mark" aria-hidden="true">n</span><strong>Nexa<span>Cloud</span></strong></router-link>
      <nav aria-label="平台入口"><router-link to="/store">商店</router-link><router-link to="/console">控制台</router-link><router-link to="/operations">管理</router-link></nav>
      <router-link class="header-link" to="/download">获取启动器 ↗</router-link>
    </header>
    <div class="cloud-body">
      <aside class="cloud-sidebar">
        <p class="nav-caption">{{ operations ? 'OPERATIONS' : consolePage ? 'CONSOLE' : 'NEXASTORE' }}</p>
        <template v-if="operations"><router-link to="/operations" :class="{selected: route.path === '/operations'}"><span>◫</span>统一待办</router-link><router-link to="/operations/telemetry" :class="{selected: route.path.endsWith('/telemetry')}"><span>⌁</span>遥测与诊断</router-link></template>
        <template v-else-if="consolePage"><router-link class="selected" to="/console"><span>◫</span>我的工作空间</router-link><router-link to="/store"><span>◇</span>浏览商店</router-link></template>
        <template v-else><router-link to="/store" :class="{selected: route.path.startsWith('/store') && !route.query.category}"><span>◈</span>探索</router-link><router-link v-for="c in categories" :key="c.id" :to="{path:'/store', query:{category:c.id}}" :class="{selected:route.query.category===c.id}"><span>{{ c.icon }}</span>{{ c.name }}</router-link></template>
      </aside>
      <main id="cloud-content" class="cloud-content"><router-view :key="route.path.startsWith('/store') ? 'store' : route.path" /></main>
    </div>

  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const operations = computed(() => route.path.startsWith('/operations'));
const consolePage = computed(() => route.path.startsWith('/console'));
const categories = [{id:'plugin', name:'插件', icon:'⊞'}, {id:'theme',name:'界面资源',icon:'◐'}, {id:'template',name:'模板',icon:'▤'}];
</script>
