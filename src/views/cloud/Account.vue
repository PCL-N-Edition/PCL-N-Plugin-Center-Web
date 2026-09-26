<template>
  <section class="account-page">
    <p v-if="checking" class="empty-state" role="status">正在检查会话…</p>
    <template v-else-if="session">
      <div class="workspace-heading"><div><p class="eyebrow">ACCOUNT</p><h1>账户状态</h1></div><button class="secondary-button" :disabled="busy" @click="logout">退出登录</button></div>
      <section class="work-panel account-card"><span class="status-pill">已登录</span><h2>{{ session.name }}</h2><p>{{ session.email || '第三方身份账户' }}</p><p>当前账户会话有效。不同邮箱的 GitHub 和 Microsoft 身份也可以绑定到同一账户。</p><div class="actions"><button class="secondary-button" :disabled="busy" @click="link('github')">绑定 GitHub</button><button class="secondary-button" :disabled="busy" @click="link('microsoft')">绑定 Microsoft</button></div></section>
      <div class="account-links"><router-link class="work-panel" to="/developer"><h2>开发者</h2><p>管理发布者工作空间与资源。</p></router-link><router-link class="work-panel" to="/website-management"><h2>网站管理申请</h2><p>查看网站管理申请入口。</p></router-link></div>
    </template>
    <div v-else class="login-hero">
      <div class="login-card">
        <span class="login-mark" aria-hidden="true">N</span>
        <h2>登录 NexaCL</h2>
        <p class="login-sub">使用 GitHub 或 Microsoft 账户继续，平台不提供邮箱注册。</p>
        <div class="login-providers">
          <button class="provider-button github" :disabled="busy" @click="oauth('github')"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>使用 GitHub 继续</span></button>
          <button class="provider-button microsoft" :disabled="busy" @click="oauth('microsoft')"><svg viewBox="0 0 23 23" width="16" height="16" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg><span>使用 Microsoft 继续</span></button>
        </div>
        <p v-if="error || oauthError" class="form-error" role="alert">{{ oauthError || error }}</p>
        <p class="login-fine">账户与会话由 auth.pcln.top 提供，一个账户可同时绑定 GitHub 与 Microsoft。</p>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { platform, type Session } from '@/api/platform';
const route = useRoute();
const session = ref<Session>(), checking = ref(true), busy = ref(false), error = ref('');
const oauthError = computed(() => { const value = route.query.oauth_error; return typeof value === 'string' && value ? value : ''; });
function oauth(provider:'github'|'microsoft'){ busy.value=true; platform.oauthStart(provider, '/account', 'login'); }
function link(provider:'github'|'microsoft'){ busy.value=true; platform.oauthStart(provider, '/account', 'link'); }
async function logout(){ busy.value=true; error.value=''; await platform.logout(); session.value=undefined; busy.value=false; }
onMounted(async()=>{ session.value=await platform.session(); checking.value=false; });
</script>
