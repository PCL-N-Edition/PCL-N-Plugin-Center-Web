<template>
  <div class="cloud-shell">
    <a class="skip-link" href="#cloud-content">跳至内容</a>
    <header class="cloud-header">
      <router-link class="cloud-brand" to="/"><strong>NexaCreftLauncher</strong></router-link>
      <nav aria-label="平台入口"><router-link to="/download">下载</router-link><router-link to="/docs">文档</router-link></nav>
      <div class="account-menu">
        <button class="account-status" type="button" :aria-expanded="menuOpen" aria-haspopup="menu" @click="menuOpen = !menuOpen"><span class="status-dot" aria-hidden="true"></span>{{ accountLabel }}</button>
        <div v-if="menuOpen" class="account-dropdown" role="menu"><router-link role="menuitem" to="/account" @click="menuOpen = false">我的账户</router-link><router-link role="menuitem" to="/developer" @click="menuOpen = false">开发者控制台 / 注册成为开发者</router-link><router-link role="menuitem" to="/website-management" @click="menuOpen = false">网站管理后台 / 申请参与网站管理</router-link><div class="account-divider" role="separator"></div><button type="button" role="menuitem" @click="logout">退出登录</button></div>
      </div>
    </header>
    <div class="cloud-body" :class="{ 'store-body': storePage }">
      <aside v-if="!storePage" class="cloud-sidebar">
        <p class="nav-caption">{{ route.path === '/' ? 'NEXACREFTLAUNCHER' : 'NEXA CLOUD' }}</p>
        <router-link to="/"><span>⌂</span>首页</router-link><router-link to="/account" :class="{selected: route.path === '/account'}"><span>◎</span>账户</router-link><router-link to="/developer" :class="{selected: route.path === '/developer'}"><span>◇</span>开发者</router-link>
      </aside>
      <main id="cloud-content" class="cloud-content"><router-view :key="route.path.startsWith('/store') ? 'store' : route.path" /></main>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError, platform, type Session } from '@/api/platform';
const route = useRoute(), router = useRouter();
const session = ref<Session>(), menuOpen = ref(false);
const accountLabel = computed(() => session.value ? (session.value.name || '账户管理') : '登录 / 注册');
async function loadSession() { try { session.value = await platform.session('console'); } catch (error) { if (error instanceof ApiError && error.status === 401) session.value = undefined; } }
async function logout() { if (!session.value) return router.push('/account'); await platform.logout('console'); session.value = undefined; await router.push('/account'); }
const onFocus = () => void loadSession();
onMounted(() => { void loadSession(); window.addEventListener('focus', onFocus); });
onUnmounted(() => window.removeEventListener('focus', onFocus));
const storePage = computed(() => route.path.startsWith('/store'));
</script>
