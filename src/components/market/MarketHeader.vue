<template>
  <header class="market-header">
    <div class="market-header-inner">
      <router-link class="brand" to="/"><strong>NexaCreftLauncher</strong></router-link>
      <nav aria-label="导航"><router-link to="/launcher">启动器</router-link><router-link to="/store">NexaStore</router-link><router-link to="/download">下载</router-link><router-link to="/changelog">更新日志</router-link><router-link to="/console">工作空间 ↗</router-link></nav>
    </div>
  </header>
</template>
<style scoped>
.market-header{width:100%;border-bottom:1px solid #e2e7dd;background:#fff}
.market-header-inner{width:min(1200px,calc(100% - 48px));min-height:72px;margin:0 auto;padding:16px 0;display:flex;align-items:center;justify-content:space-between;gap:20px}
.brand,nav{display:flex;gap:24px;align-items:center}.brand{gap:10px}.brand strong{white-space:nowrap}nav{font-size:13px;flex-wrap:wrap}
@media(max-width:600px){.market-header-inner{width:calc(100% - 28px);flex-wrap:wrap;gap:8px}nav{gap:18px;font-size:12px}}
</style>
