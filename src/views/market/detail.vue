<template>
  <main class="detail-shell"><header><router-link to="/market">← 返回市场</router-link><router-link :to="userStore.token?'/home':'/login'">{{ userStore.token?'工作台':'登录' }}</router-link></header>
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-result v-else-if="error" icon="error" title="无法加载插件" :sub-title="error" />
    <article v-else-if="plugin">
      <div class="headline"><div><el-tag round>{{ plugin.category }}</el-tag><h1>{{ plugin.name }}</h1><p>{{ plugin.summary }}</p></div><div class="purchase"><strong>{{ plugin.pricingModel==='free'?'免费':money(plugin.priceCents) }}</strong><span>{{ plugin.pricingModel==='free'?'登录后即可下载':'一次购买，永久授权' }}</span><el-button type="primary" size="large" @click="act">{{ actionText }}</el-button></div></div>
      <div class="content"><section><h2>插件介绍</h2><p class="description">{{ plugin.description||plugin.summary||'开发者暂未提供详细介绍。' }}</p><h3>标签</h3><el-tag v-for="tag in plugin.tags" :key="tag" class="tag">{{ tag }}</el-tag></section>
      <aside><dl><dt>插件 ID</dt><dd>{{ plugin.pluginId }}</dd><dt>最新版本</dt><dd>{{ plugin.latestVersion||'—' }}</dd><dt>发布者</dt><dd>{{ plugin.publisherName||plugin.publisherId||'—' }}</dd><dt>权限</dt><dd>{{ plugin.permissions?.join('、')||'无额外权限' }}</dd></dl></aside></div>
    </article>
    <div class="policy">订单兑换即视为数字内容永久授权已交付，购买后不支持退款。请在兑换前确认插件信息与金额；欺诈、重复扣款或法律另有强制规定的异常情况请联系平台人工处理。</div>
    <el-dialog v-model="redeemVisible" title="验证爱发电订单" width="min(520px, 92vw)"><el-alert title="请先在平台爱发电主页自选金额赞助，金额不得低于插件价格。订单只能兑换一次。" type="info" show-icon :closable="false"/><el-form label-position="top" class="form"><el-form-item label="爱发电订单号"><el-input v-model="orderNumber" autocomplete="off" /></el-form-item><el-form-item label="超额金额用于"><el-radio-group v-model="destination"><el-radio value="publisher">赞助发布者（仍按10%/90%分成）</el-radio><el-radio value="platform">赞助平台</el-radio></el-radio-group></el-form-item></el-form><template #footer><el-button @click="redeemVisible=false">取消</el-button><el-button type="primary" :loading="redeeming" @click="redeem">验证并授权</el-button></template></el-dialog>
  </main>
</template>
<script setup lang="ts">
import { computed,onMounted,ref } from 'vue'; import { useRoute,useRouter } from 'vue-router'; import { ElMessage } from 'element-plus';
import { pluginCenterApi,type MarketPlugin } from '@/api/pluginCenter'; import useUserStore from '@/stores/modules/user';
const route=useRoute(),router=useRouter(),userStore=useUserStore(); const plugin=ref<MarketPlugin>(); const loading=ref(true),error=ref(''),entitled=ref(false),redeemVisible=ref(false),redeeming=ref(false),orderNumber=ref(''),destination=ref('publisher');
const money=(c:number)=>`¥${(c/100).toFixed(2)}`; const actionText=computed(()=>entitled.value?'已拥有，下载':plugin.value?.pricingModel==='free'?'登录并下载':'购买 / 验证订单');
const requireLogin=async()=>{if(userStore.token)return true;await router.push({path:'/login',query:{redirect:route.fullPath}});return false;};
const act=async()=>{if(!await requireLogin()||!plugin.value)return;if(plugin.value.pricingModel==='one_time'&&!entitled.value){redeemVisible.value=true;return;}ElMessage.info('请在 PCL.N 桌面端插件市场安装此插件。');};
const redeem=async()=>{if(!plugin.value||!orderNumber.value.trim()){ElMessage.warning('请输入订单号');return;}redeeming.value=true;try{await pluginCenterApi.redeemPurchase(plugin.value.pluginId,orderNumber.value.trim(),destination.value);entitled.value=true;redeemVisible.value=false;orderNumber.value='';ElMessage.success('订单验证成功，已获得永久授权');}catch(e){ElMessage.error(e instanceof Error?e.message:'订单验证失败');}finally{redeeming.value=false;}};
onMounted(async()=>{try{plugin.value=await pluginCenterApi.getMarketPlugin(String(route.params.pluginId));if(userStore.token){entitled.value=(await pluginCenterApi.getEntitlement(plugin.value.pluginId)).entitled;}}catch(e){error.value=e instanceof Error?e.message:'加载失败';}finally{loading.value=false;}});
</script>
<style scoped lang="scss">
.detail-shell{min-height:100vh;padding:0 clamp(20px,7vw,110px) 70px;background:var(--el-bg-color-page)}header{height:72px;display:flex;justify-content:space-between;align-items:center}.headline{display:grid;grid-template-columns:1fr 300px;gap:40px;padding:64px 0}.headline h1{font-size:clamp(36px,5vw,60px);margin:16px 0}.headline p{font-size:18px;color:var(--el-text-color-secondary)}.purchase{display:flex;flex-direction:column;gap:12px;padding:26px;border-radius:20px;background:var(--el-bg-color);box-shadow:0 18px 50px rgba(35,48,110,.1)}.purchase strong{font-size:34px}.purchase span{color:var(--el-text-color-secondary)}.content{display:grid;grid-template-columns:1fr 320px;gap:28px}.content section,.content aside{padding:28px;border-radius:18px;background:var(--el-bg-color)}.description{white-space:pre-wrap;line-height:1.8}.policy{margin-top:24px;padding:16px;border-radius:12px;color:var(--el-color-warning-dark-2);background:var(--el-color-warning-light-9)}.tag{margin:0 8px 8px 0}dl{margin:0}dt{font-size:12px;color:var(--el-text-color-secondary);margin-top:16px}dd{margin:5px 0;word-break:break-all}.form{margin-top:20px}@media(max-width:800px){.headline,.content{grid-template-columns:1fr}.headline{padding-top:34px}}
</style>
