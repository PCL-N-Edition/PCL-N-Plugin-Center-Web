<template>
  <main class="telemetry-page">
    <header>
      <div><p class="eyebrow">NEXA 2</p><h1>遥测监控</h1><p>查看必要遥测与诊断信息的匿名汇总数据。</p></div>
      <div class="controls">
        <el-segmented v-model="days" :options="periods" aria-label="统计时间范围" @change="load" />
        <el-button :loading="loading" @click="load">刷新</el-button>
      </div>
    </header>
    <el-segmented v-model="level" :options="levels" aria-label="遥测级别" @change="load" />
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <p class="note">按 UTC 日期统计事件次数，不代表独立用户数。重试可能重复计数；不包含旧版 1.x 数据。</p>
    <section class="metrics" aria-label="事件汇总" :aria-busy="loading">
      <article v-for="metric in metrics" :key="metric.event"><span>{{ metric.label }}</span><strong>{{ data ? metric.count.toLocaleString() : '—' }}</strong></article>
    </section>
    <section class="panel">
      <div class="panel-heading"><h2>启动趋势</h2><span>{{ data ? `${data.since} — ${data.until}` : '等待数据' }}</span></div>
      <p v-if="!loading && data && !data.daily.length" class="empty">此时间范围内尚无遥测数据。</p>
      <div v-else class="bars" role="img" aria-label="每日启动次数；各柱可聚焦查看日期和次数">
        <div v-for="day in trend" :key="day.day" class="bar-track" tabindex="0" :aria-label="`${day.day}：${day.count} 次启动`" :title="`${day.day} · ${day.count} 次`">
          <span :style="{ height: `${Math.max(day.count ? 2 : 0, day.count / peak * 100)}%` }" />
        </div>
      </div>
    </section>
    <div class="breakdowns">
      <section class="panel"><h2>启动器版本</h2><el-table :data="data?.versions ?? []" empty-text="尚无数据"><el-table-column prop="version" label="版本" /><el-table-column prop="count" label="启动次数" align="right" /></el-table></section>
      <section class="panel"><h2>操作系统</h2><el-table :data="data?.platforms ?? []" empty-text="尚无数据"><el-table-column label="平台"><template #default="{ row }">{{ platform(row.os) }} · {{ row.arch }}</template></el-table-column><el-table-column prop="count" label="启动次数" align="right" /></el-table></section>
    </div>
    <p class="note">{{ data ? `更新于 ${new Date(data.generatedAt).toLocaleString()}` : '数据加载后显示更新时间' }}。页面可见时每分钟刷新。</p>
  </main>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import { pluginCenterApi } from '@/api/pluginCenter';
const days = ref(7);
const level = ref("all");
const levels = [{ label: "全部", value: "all" }, { label: "必要遥测", value: "necessary" }, { label: "诊断信息", value: "diagnostic" }, { label: "历史协议", value: "legacy" }];
const periods = [{ label: '7 天', value: 7 }, { label: '30 天', value: 30 }, { label: '90 天', value: 90 }];
const data = ref<Awaited<ReturnType<typeof pluginCenterApi.launcherTelemetry>>>();
const loading = ref(false), error = ref('');
let generation = 0, timer: ReturnType<typeof setInterval> | undefined;
async function load() {
  const current = ++generation;
  loading.value = true; error.value = '';
  try { const result = await pluginCenterApi.launcherTelemetry(days.value, level.value); if (current === generation) data.value = result; }
  catch (e) { if (current === generation) error.value = e instanceof Error ? e.message : '暂时无法读取遥测数据，请稍后重试。'; }
  finally { if (current === generation) loading.value = false; }
}
const metrics = computed(() => [
  { event: 'app.started', label: '启动器启动' }, { event: 'app.failure', label: '启动器异常' },
  { event: 'game.started', label: '游戏启动' }, { event: 'game.exited', label: '游戏退出' },
  { event: 'task.started', label: '任务开始' }, { event: 'task.finished', label: '任务结束' },
  { event: 'update.checked', label: '更新检查' }, { event: 'rollout.checked', label: '灰度检查' },
].map(item => ({ ...item, count: data.value?.daily.filter(row => row.event === item.event).reduce((sum, row) => sum + row.count, 0) ?? 0 })));
const trend = computed(() => data.value ? Array.from({ length: data.value.days }, (_, i) => {
  const day = new Date(Date.parse(data.value!.since) + i * 86400000).toISOString().slice(0, 10);
  return { day, count: data.value!.daily.filter(row => row.day === day && row.event === 'app.started').reduce((sum, row) => sum + row.count, 0) };
}) : []);
const peak = computed(() => Math.max(1, ...trend.value.map(day => day.count)));
const platform = (os: string) => ({ windows: 'Windows', macos: 'macOS', linux: 'Linux' }[os] ?? os);
function start() { if (timer) return; void load(); timer = setInterval(() => { if (!document.hidden && !loading.value) void load(); }, 60000); }
function stop() { clearInterval(timer); timer = undefined; generation++; loading.value = false; }
onMounted(start); onActivated(start); onDeactivated(stop); onUnmounted(stop);
</script>

<style scoped>
.telemetry-page { max-width: 1200px; margin: auto; padding: 28px; color: var(--el-text-color-primary); }
header, .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
h1 { font-size: 32px; letter-spacing: -.035em; margin: 4px 0 12px; } h2 { font-size: 18px; margin: 0 0 18px; font-weight: 600; }
header p, .note, .panel-heading span { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
.eyebrow { letter-spacing: .14em; font-weight: 600; } .controls { display: flex; gap: 12px; align-items: center; }
.note { margin: 22px 0; } .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
.metrics article, .panel { background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 20px; padding: 24px; }
.metrics span { display: block; font-size: 13px; color: var(--el-text-color-secondary); } .metrics strong { display: block; font-size: 36px; font-weight: 600; letter-spacing: -.04em; margin-top: 12px; font-variant-numeric: tabular-nums; }
.bars { display: flex; gap: 4px; height: 150px; align-items: end; } .bar-track { flex: 1; height: 100%; display: flex; align-items: end; border-radius: 3px; }
.bar-track span { display: block; width: 100%; background: var(--el-color-primary); border-radius: 3px 3px 0 0; transition: height .25s ease; }
.bar-track:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; } .empty { text-align: center; padding: 48px; color: var(--el-text-color-secondary); }
.breakdowns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
@media (max-width: 800px) { header { align-items: start; flex-direction: column; } .metrics { grid-template-columns: 1fr 1fr; } .breakdowns { grid-template-columns: 1fr; } .telemetry-page { padding: 16px; } }
@media (prefers-reduced-motion: reduce) { .bar-track span { transition: none; } }
</style>
