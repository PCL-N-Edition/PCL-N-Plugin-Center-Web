<template>
  <div v-if="checking" class="empty-state" role="status">正在检查会话…</div>
  <template v-else-if="!session">
    <div class="login-layout"><form class="login-panel" @submit.prevent="login"><h2>{{ scope==='operations' ? '工作人员登录' : '登录控制台' }}</h2><p></p><label>账户名称<input v-model="name" required autocomplete="username" maxlength="80" /></label><label>密码<input v-model="password" required type="password" autocomplete="current-password" maxlength="256" /></label><p v-if="error" class="form-error" role="alert">{{ error }}</p><button class="primary-button" :disabled="busy">{{ busy ? '正在登录…' : '登录' }}</button></form></div>
  </template>
  <template v-else>
    <div class="workspace-heading"><div><h1>{{ scope==='operations' ? '待办' : '控制台' }}</h1></div><button class="secondary-button" :disabled="busy" @click="logout">退出登录</button></div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <template v-if="route.path.endsWith('/telemetry')"><Telemetry /></template>
    <template v-else>
      <section class="work-panel"><div class="section-heading"><div><h2>{{ scope==='operations' ? '需要你处理' : '支持请求' }}</h2></div><button class="secondary-button" :disabled="busy" @click="loadTickets">刷新</button></div><div class="category-tabs"><button :class="{active:!showResolved}" @click="showResolved=false">待处理</button><button :class="{active:showResolved}" @click="showResolved=true">已解决</button></div><div v-if="ticketsLoaded && !visibleTickets.length" class="empty-state"><h3>{{ showResolved ? '还没有已解决的请求' : '暂无待办' }}</h3></div><article v-for="ticket in visibleTickets" :key="ticket.id" class="ticket-row"><div><small>{{ new Date(ticket.created_at).toLocaleString() }}</small><h3>{{ ticket.subject }}</h3><p>{{ ticket.body }}</p></div><button v-if="scope==='operations' && ticket.status==='open'" class="secondary-button" :disabled="busy" @click="resolve(ticket)">标记已解决</button><span v-else class="status-pill">{{ ticket.status==='open' ? '待处理' : '已解决' }}</span></article><div class="pagination" v-if="total>50"><button class="secondary-button" :disabled="offset===0 || busy" @click="offset-=50;loadTickets()">上一页</button><span>{{ offset+1 }}–{{ Math.min(offset+50,total) }} / {{ total }}</span><button class="secondary-button" :disabled="offset+50>=total || busy" @click="offset+=50;loadTickets()">下一页</button></div></section>
      <form v-if="scope==='console'" class="work-panel support-form" @submit.prevent="submit"><h2>新建工单</h2><label>标题<input v-model="subject" required maxlength="120" /></label><label>详细说明<textarea v-model="body" required maxlength="4000" rows="4" /></label><button class="primary-button" :disabled="busy">提交</button><span class="form-success" role="status">{{ message }}</span></form>
    </template>
  </template>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { platform, ApiError, type Session, type Ticket } from '@/api/platform';
import Telemetry from '@/views/admin/telemetry/index.vue';
const route=useRoute();
const scope=route.path.startsWith('/operations') ? 'operations' : 'console';
const session=ref<Session>(), checking=ref(true), busy=ref(false), error=ref(''), name=ref(''), password=ref('');
const offset=ref(0), total=ref(0);
const tickets=ref<Ticket[]>([]), ticketsLoaded=ref(false), showResolved=ref(false), subject=ref(''), body=ref(''), message=ref('');
const visibleTickets=computed(()=>tickets.value.filter(t=>showResolved.value ? t.status==='resolved' : t.status==='open'));
const failure=(e:unknown)=>{error.value=e instanceof Error?e.message:'操作失败，请重试。';};
async function loadTickets(){busy.value=true;error.value='';try{const result=await platform.tickets(scope,offset.value);tickets.value=result.data;total.value=result.pagination.total;ticketsLoaded.value=true;}catch(e){failure(e);}finally{busy.value=false;}}
async function login(){busy.value=true;error.value='';try{session.value=await platform.login(name.value,password.value,scope);password.value='';await loadTickets();}catch(e){failure(e);}finally{busy.value=false;}}
async function logout(){busy.value=true;error.value='';try{await platform.logout(scope);session.value=undefined;tickets.value=[];ticketsLoaded.value=false;}catch(e){failure(e);}finally{busy.value=false;}}
async function submit(){busy.value=true;error.value='';message.value='';try{await platform.createTicket(subject.value,body.value);subject.value='';body.value='';message.value='请求已提交。';showResolved.value=false;await loadTickets();}catch(e){failure(e);}finally{busy.value=false;}}
async function resolve(ticket:Ticket){busy.value=true;error.value='';try{await platform.resolve(ticket);await loadTickets();}catch(e){failure(e);}finally{busy.value=false;}}
onMounted(async()=>{try{session.value=await platform.session(scope);if(!route.path.endsWith('/telemetry'))await loadTickets();}catch(e){if(!(e instanceof ApiError && e.status===401))failure(e);}finally{checking.value=false;}});
</script>
