<template>
  <section class="account-page">
    <div class="workspace-heading"><div><p class="eyebrow">ACCOUNT</p><h1>账户状态</h1></div><button v-if="session" class="secondary-button" :disabled="busy" @click="logout">退出登录</button></div>
    <p v-if="checking" class="empty-state" role="status">正在检查会话…</p>
    <template v-else-if="session">
      <section class="work-panel account-card"><span class="status-pill">已登录</span><h2>{{ session.name }}</h2><p>{{ session.email || '第三方身份账户' }}</p><p>当前账户会话有效。不同邮箱的 GitHub 和 Microsoft 身份也可以绑定到同一账户。</p><div class="actions"><button class="secondary-button" :disabled="busy" @click="link('github')">绑定 GitHub</button><button class="secondary-button" :disabled="busy" @click="link('microsoft')">绑定 Microsoft</button></div></section>
      <div class="account-links"><router-link class="work-panel" to="/developer"><h2>开发者</h2><p>管理发布者工作空间与资源。</p></router-link><router-link class="work-panel" to="/website-management"><h2>网站管理申请</h2><p>查看网站管理申请入口。</p></router-link></div>
    </template>
    <section v-else class="work-panel login-choice"><h2>登录 Nexa Cloud</h2><p>使用已接入的身份提供商登录。平台不提供邮箱注册，也不会在此创建虚构账户。</p><div class="actions"><button class="primary-button" :disabled="busy" @click="oauth('github')">使用 GitHub 登录 ↗</button><button class="secondary-button" :disabled="busy" @click="oauth('microsoft')">使用 Microsoft 登录 ↗</button></div><p v-if="error" class="form-error" role="alert">{{ error }}</p></section>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { platform, ApiError, type Session } from '@/api/platform';
const session=ref<Session>(), checking=ref(true), busy=ref(false), error=ref('');
function oauth(provider:'github'|'microsoft'){ busy.value=true; platform.oauthStart(provider, '/account', 'login'); }
function link(provider:'github'|'microsoft'){ busy.value=true; platform.oauthStart(provider, '/account', 'link'); }
async function logout(){ busy.value=true; error.value=''; try{ await platform.logout('console'); session.value=undefined; }catch(e){ error.value=e instanceof Error?e.message:'退出登录失败，请重试。'; }finally{busy.value=false;} }
onMounted(async()=>{try{session.value=await platform.session('console');}catch(e){if(!(e instanceof ApiError && e.status===401))error.value=e instanceof Error?e.message:'暂时无法检查账户状态。';}finally{checking.value=false;}});
</script>
