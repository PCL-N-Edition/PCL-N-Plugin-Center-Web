<template>
  <main class="market-shell">
    <header><router-link to="/market" class="brand">PCL.N Plugin Market</router-link><router-link :to="userStore.token ? '/home' : '/login'">{{ userStore.token ? '工作台' : '登录' }}</router-link></header>
    <section class="hero"><span>可信插件生态</span><h1>发现适合你的 PCL.N 插件</h1><p>公开浏览经过审核的插件。下载与购买需要登录。</p></section>
    <section class="filters">
      <el-input v-model="search" clearable placeholder="搜索名称或插件 ID" @keyup.enter="load" />
      <el-select v-model="category" placeholder="全部分类" clearable @change="load"><el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" /></el-select>
      <el-button type="primary" :loading="loading" @click="load">搜索</el-button>
    </section>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    <section v-loading="loading" class="grid">
      <router-link v-for="plugin in plugins" :key="plugin.pluginId" :to="`/market/plugins/${encodeURIComponent(plugin.pluginId)}`" class="card">
        <div class="card-top"><el-tag effect="plain" round>{{ categoryName(plugin.category) }}</el-tag><strong>{{ plugin.pricingModel === 'free' ? '免费' : money(plugin.priceCents) }}</strong></div>
        <h2>{{ plugin.name }}</h2><p>{{ plugin.summary || '暂无简介' }}</p>
        <div class="meta"><span>{{ plugin.pluginId }}</span><span v-if="plugin.latestVersion">v{{ plugin.latestVersion }}</span></div>
        <div><el-tag v-for="tag in plugin.tags" :key="tag" size="small" class="tag">{{ tag }}</el-tag></div>
      </router-link>
      <el-empty v-if="!loading && plugins.length === 0" description="没有符合条件的插件" />
    </section>
  </main>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { pluginCenterApi, type MarketCategory, type MarketPlugin } from '@/api/pluginCenter';
import useUserStore from '@/stores/modules/user';
const userStore=useUserStore(); const search=ref(''); const category=ref(''); const loading=ref(false); const error=ref('');
const plugins=ref<MarketPlugin[]>([]); const categories=ref<MarketCategory[]>([]);
const money=(c:number)=>`¥${(c/100).toFixed(2)}`; const categoryName=(id:string)=>categories.value.find(x=>x.id===id)?.name??id;
const load=async()=>{loading.value=true;error.value='';try{plugins.value=await pluginCenterApi.listMarketPlugins({search:search.value,category:category.value,take:100});}catch(e){error.value=e instanceof Error?e.message:'市场加载失败';}finally{loading.value=false;}};
onMounted(async()=>{try{categories.value=await pluginCenterApi.listCategories();}finally{await load();}});
</script>
<style scoped lang="scss">
.market-shell{min-height:100vh;padding:0 clamp(20px,6vw,90px) 64px;background:radial-gradient(circle at 85% 0,#dfe5ff 0,transparent 32%),var(--el-bg-color-page)}
header{height:72px;display:flex;align-items:center;justify-content:space-between}.brand{font-weight:800;font-size:18px;color:var(--el-text-color-primary)}
.hero{padding:72px 0 48px;max-width:760px}.hero span{color:var(--el-color-primary);font-weight:700}.hero h1{font-size:clamp(38px,5vw,64px);letter-spacing:-.04em;margin:14px 0}.hero p{font-size:18px;color:var(--el-text-color-secondary)}
.filters{display:grid;grid-template-columns:minmax(240px,1fr) 220px auto;gap:12px;padding:18px;background:var(--el-bg-color);border-radius:18px;box-shadow:0 16px 40px rgba(32,45,100,.08)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;margin-top:28px;min-height:180px}.card{padding:22px;border:1px solid var(--el-border-color-light);border-radius:18px;background:var(--el-bg-color);color:inherit;transition:.2s}.card:hover{transform:translateY(-3px);box-shadow:0 18px 38px rgba(32,45,100,.12)}.card-top,.meta{display:flex;justify-content:space-between;gap:12px}.card h2{margin:20px 0 10px}.card p{min-height:48px;color:var(--el-text-color-secondary);line-height:1.6}.meta{font-size:12px;color:var(--el-text-color-secondary);margin:18px 0}.tag{margin:0 6px 6px 0}
@media(max-width:700px){.filters{grid-template-columns:1fr}.hero{padding-top:38px}}
</style>
