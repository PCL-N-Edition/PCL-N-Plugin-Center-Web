<template>
  <main class="landing-page">
    <MarketHeader />

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><i aria-hidden="true"></i>{{ t("site.home.badge") }}</span>
        <h1>{{ t("site.home.titleLead") }}<br /><span>{{ t("site.home.titleAccent") }}</span></h1>
        <p>{{ t("site.home.subtitle") }}</p>
        <div class="hero-actions">
          <router-link class="primary-action" to="/download">{{ t("site.home.download") }} <span aria-hidden="true">↓</span></router-link>
          <router-link class="secondary-action" to="/market">{{ t("site.home.market") }} <span aria-hidden="true">→</span></router-link>
        </div>
        <div class="platform-note">
          <span>⊞ Windows</span><span>⌘ macOS</span><span>◆ Linux</span>
        </div>
      </div>

      <div class="launcher-stage" aria-hidden="true">
        <div class="glow"></div>
        <div class="launcher-window">
          <div class="window-bar">
            <span class="window-brand"><img src="/pcln.png" alt="" /> PCL N</span>
            <span class="window-controls">—　□　×</span>
          </div>
          <div class="window-body">
            <aside><b></b><i></i><i></i><i></i><i></i></aside>
            <div class="game-panel">
              <span class="panel-kicker">MINECRAFT · 1.21.1</span>
              <h2>{{ t("site.home.previewTitle") }}</h2>
              <p>{{ t("site.home.previewText") }}</p>
              <div class="instance-row"><span class="grass-cube">◆</span><div><strong>Fabric 1.21.1</strong><small>128 mods · Java 21</small></div><em>✓</em></div>
              <div class="launch-row"><span>{{ t("site.home.previewReady") }}</span><b>{{ t("site.home.previewLaunch") }}　▶</b></div>
            </div>
          </div>
        </div>
        <div class="status-card status-plugin"><span>⌁</span><div><strong>{{ t("site.home.previewPlugin") }}</strong><small>{{ t("site.home.previewVerified") }}</small></div></div>
        <div class="status-card status-update"><span>↻</span><div><strong>{{ t("site.home.previewUpdate") }}</strong><small>{{ t("site.home.previewCurrent") }}</small></div></div>
      </div>
    </section>

    <section class="principles" :aria-label="t('site.home.featuresTitle')">
      <article v-for="feature in features" :key="feature.key">
        <span aria-hidden="true">{{ feature.icon }}</span>
        <h2>{{ t(`site.home.features.${feature.key}.title`) }}</h2>
        <p>{{ t(`site.home.features.${feature.key}.text`) }}</p>
      </article>
    </section>

    <section class="ecosystem">
      <div>
        <span class="section-label">PCL N ECOSYSTEM</span>
        <h2>{{ t("site.home.ecosystemTitle") }}</h2>
        <p>{{ t("site.home.ecosystemText") }}</p>
      </div>
      <div class="ecosystem-links">
        <router-link to="/market"><span>◫</span><div><strong>{{ t("site.home.pluginTitle") }}</strong><small>{{ t("site.home.pluginText") }}</small></div><b>→</b></router-link>
        <a href="https://docs.pcln.top/" target="_blank" rel="noreferrer"><span>⌘</span><div><strong>{{ t("site.home.docsTitle") }}</strong><small>{{ t("site.home.docsText") }}</small></div><b>↗</b></a>
      </div>
    </section>

    <section class="final-cta">
      <img src="/pcln.png" alt="" />
      <h2>{{ t("site.home.ctaTitle") }}</h2>
      <p>{{ t("site.home.ctaText") }}</p>
      <router-link to="/download">{{ t("site.home.downloadNow") }} <span aria-hidden="true">→</span></router-link>
    </section>

    <PublicSiteFooter />
  </main>
</template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import MarketHeader from "@/components/market/MarketHeader.vue";
import PublicSiteFooter from "@/components/market/PublicSiteFooter.vue";
import { applyPageSeo } from "@/utils/seo";

const { t, locale } = useI18n();
const features = [
  { key: "native", icon: "N" },
  { key: "instances", icon: "▦" },
  { key: "plugins", icon: "⌁" },
  { key: "updates", icon: "↻" }
];

watchEffect(() => {
  applyPageSeo({
    title: t("site.home.pageTitle"),
    description: t("site.home.subtitle"),
    path: "/"
  });
  document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en-US";
});
</script>

<style scoped lang="scss">
.landing-page {
  --market-bg: #f5f7fb; --market-surface: rgba(255,255,255,.88); --market-surface-solid: #fff;
  --market-surface-soft: rgba(77,91,132,.07); --market-border: rgba(45,56,91,.12);
  --market-text: #192034; --market-muted: #677087; --market-accent: #5870f4;
  --market-accent-soft: rgba(88,112,244,.11); min-height: 100vh; overflow: hidden;
  color: var(--market-text); background: radial-gradient(circle at 86% 7%, rgba(111,92,255,.16), transparent 30rem), radial-gradient(circle at 8% 34%, rgba(64,162,255,.1), transparent 27rem), var(--market-bg);
}
:global(html.dark) .landing-page {
  --market-bg:#0f1118; --market-surface:rgba(24,27,38,.9); --market-surface-solid:#181b26;
  --market-surface-soft:rgba(255,255,255,.055); --market-border:rgba(214,220,255,.11);
  --market-text:#f1f3fa; --market-muted:#a2a9bd; --market-accent:#7d8fff; --market-accent-soft:rgba(125,143,255,.13);
}
.hero { width:min(1180px,calc(100% - 40px)); min-height:650px; margin:20px auto 50px; display:grid; grid-template-columns:minmax(0,.88fr) minmax(520px,1.12fr); align-items:center; gap:52px; }
.hero-copy { position:relative; z-index:2; padding:54px 0; }
.eyebrow { display:inline-flex; align-items:center; gap:9px; color:var(--market-accent); font-size:13px; font-weight:750; }
.eyebrow i { width:8px; height:8px; border-radius:50%; background:#38c889; box-shadow:0 0 0 5px rgba(56,200,137,.12); }
h1 { margin:18px 0 20px; font-size:clamp(48px,6vw,78px); line-height:1.02; letter-spacing:-.06em; }
h1 span { color:var(--market-accent); }
.hero-copy > p { max-width:590px; margin:0; color:var(--market-muted); font-size:17px; line-height:1.8; }
.hero-actions { margin-top:30px; display:flex; flex-wrap:wrap; gap:10px; }
.hero-actions a,.final-cta a { min-height:46px; padding:0 20px; display:inline-flex; align-items:center; justify-content:center; gap:10px; border-radius:12px; font-size:14px; font-weight:750; transition:transform .2s ease,box-shadow .2s ease; }
.hero-actions a:hover,.final-cta a:hover { transform:translateY(-2px); }
.primary-action,.final-cta a { color:#fff; background:var(--market-accent); box-shadow:0 12px 30px rgba(88,112,244,.25); }
.secondary-action { color:var(--market-text); border:1px solid var(--market-border); background:var(--market-surface); }
.platform-note { margin-top:21px; display:flex; flex-wrap:wrap; gap:16px; color:var(--market-muted); font-size:11px; }
.launcher-stage { position:relative; min-height:520px; display:grid; place-items:center; perspective:1200px; }
.glow { position:absolute; width:440px; height:440px; border-radius:50%; background:radial-gradient(circle,rgba(88,112,244,.22),transparent 68%); filter:blur(8px); }
.launcher-window { width:min(620px,100%); overflow:hidden; position:relative; z-index:1; border:1px solid rgba(255,255,255,.65); border-radius:22px; background:#161b26; box-shadow:0 40px 90px rgba(24,33,68,.28); transform:rotateY(-5deg) rotateX(2deg); }
:global(html.dark) .launcher-window { border-color:rgba(255,255,255,.12); }
.window-bar { height:55px; padding:0 18px; display:flex; align-items:center; justify-content:space-between; color:#fff; background:linear-gradient(100deg,#5b96e6,#6379e8); font-size:11px; }
.window-brand { display:flex; align-items:center; gap:8px; font-weight:750; }.window-brand img { width:25px; height:25px; border-radius:7px; }.window-controls { opacity:.82; letter-spacing:.08em; }
.window-body { min-height:350px; display:grid; grid-template-columns:58px 1fr; background:#141a24; }
.window-body aside { padding:22px 0; display:flex; flex-direction:column; align-items:center; gap:21px; background:#10151e; }
.window-body aside i,.window-body aside b { width:19px; height:19px; display:block; border:2px solid #8590a7; border-radius:6px; }.window-body aside b { border-color:#63a2f3; box-shadow:-17px 0 0 -6px #63a2f3; }
.game-panel { padding:42px 44px; color:#f4f6fb; background:radial-gradient(circle at 92% 5%,rgba(91,112,244,.18),transparent 17rem),#1b222e; }
.panel-kicker { color:#75aef5; font-size:9px; font-weight:800; letter-spacing:.13em; }.game-panel h2 { margin:10px 0 8px; font-size:29px; }.game-panel > p { margin:0; color:#a8b1c3; font-size:12px; }
.instance-row { margin-top:34px; padding:15px; display:flex; align-items:center; gap:12px; border:1px solid rgba(255,255,255,.08); border-radius:13px; background:rgba(255,255,255,.045); }
.grass-cube { width:36px; height:36px; display:grid; place-items:center; border-radius:10px; color:#8fd577; background:rgba(113,196,105,.13); }.instance-row div { display:grid; gap:3px; }.instance-row strong { font-size:12px; }.instance-row small { color:#8791a4; font-size:9px; }.instance-row em { margin-left:auto; color:#56d49d; font-style:normal; }
.launch-row { margin-top:17px; display:flex; align-items:center; justify-content:space-between; color:#8993a5; font-size:10px; }.launch-row b { padding:12px 18px; border-radius:10px; color:#fff; background:#5d91e8; font-size:11px; }
.status-card { position:absolute; z-index:2; min-width:184px; padding:12px 14px; display:flex; align-items:center; gap:10px; border:1px solid rgba(255,255,255,.65); border-radius:14px; background:rgba(255,255,255,.9); box-shadow:0 18px 45px rgba(27,37,75,.15); backdrop-filter:blur(18px); }
:global(html.dark) .status-card { border-color:rgba(255,255,255,.13); background:rgba(28,32,44,.92); }.status-card > span { width:32px; height:32px; display:grid; place-items:center; border-radius:9px; color:var(--market-accent); background:var(--market-accent-soft); font-weight:800; }.status-card div { display:grid; gap:2px; }.status-card strong { font-size:11px; }.status-card small { color:var(--market-muted); font-size:9px; }.status-plugin { left:-20px; top:92px; }.status-update { right:-18px; bottom:66px; }
.principles { width:min(1180px,calc(100% - 40px)); margin:0 auto 110px; display:grid; grid-template-columns:repeat(4,1fr); border:1px solid var(--market-border); border-radius:22px; background:var(--market-surface); box-shadow:0 20px 60px rgba(31,42,78,.07); }
.principles article { padding:28px; }.principles article+article { border-left:1px solid var(--market-border); }.principles article>span { width:39px; height:39px; display:grid; place-items:center; border-radius:11px; color:var(--market-accent); background:var(--market-accent-soft); font-weight:850; }.principles h2 { margin:18px 0 8px; font-size:16px; }.principles p { margin:0; color:var(--market-muted); font-size:12px; line-height:1.65; }
.ecosystem { width:min(1080px,calc(100% - 40px)); margin:0 auto 120px; display:grid; grid-template-columns:.8fr 1.2fr; gap:70px; align-items:center; }.section-label { color:var(--market-accent); font-size:10px; font-weight:800; letter-spacing:.16em; }.ecosystem h2 { margin:12px 0 13px; font-size:clamp(32px,4vw,48px); letter-spacing:-.04em; }.ecosystem>div>p { margin:0; color:var(--market-muted); line-height:1.8; }.ecosystem-links { display:grid; gap:12px; }.ecosystem-links a { padding:20px; display:flex; align-items:center; gap:15px; border:1px solid var(--market-border); border-radius:16px; color:var(--market-text); background:var(--market-surface); transition:transform .2s ease,border-color .2s ease; }.ecosystem-links a:hover { transform:translateX(4px); border-color:rgba(88,112,244,.4); }.ecosystem-links a>span { width:42px; height:42px; display:grid; place-items:center; border-radius:12px; color:var(--market-accent); background:var(--market-accent-soft); }.ecosystem-links div { display:grid; gap:4px; }.ecosystem-links small { color:var(--market-muted); font-size:11px; }.ecosystem-links b { margin-left:auto; color:var(--market-accent); }
.final-cta { width:min(1180px,calc(100% - 40px)); margin:0 auto 90px; padding:58px 30px; text-align:center; border:1px solid var(--market-border); border-radius:24px; background:radial-gradient(circle at 50% 0,rgba(88,112,244,.16),transparent 22rem),var(--market-surface); }.final-cta img { width:52px; height:52px; border-radius:15px; box-shadow:0 12px 30px rgba(88,112,244,.2); }.final-cta h2 { margin:18px 0 8px; font-size:clamp(30px,4vw,46px); }.final-cta p { margin:0 0 24px; color:var(--market-muted); }.final-cta a { min-width:155px; }
@media(max-width:980px){.hero{grid-template-columns:1fr;}.launcher-stage{min-height:500px}.principles{grid-template-columns:repeat(2,1fr)}.principles article:nth-child(3){border-left:0;border-top:1px solid var(--market-border)}.principles article:nth-child(4){border-top:1px solid var(--market-border)}.ecosystem{grid-template-columns:1fr;gap:30px}}
@media(max-width:650px){.hero,.principles,.ecosystem,.final-cta{width:min(100% - 28px,1180px)}.hero{min-height:auto;margin-top:4px;gap:8px}.hero-copy{padding:42px 0 16px}h1{font-size:48px}.hero-copy>p{font-size:15px}.launcher-stage{min-height:390px;margin:0 -42px;transform:scale(.82)}.status-plugin{left:10px}.status-update{right:10px}.principles{grid-template-columns:1fr;margin-bottom:80px}.principles article+article{border-left:0;border-top:1px solid var(--market-border)}.ecosystem{margin-bottom:80px}.final-cta{padding:46px 20px;margin-bottom:65px}}
@media(prefers-reduced-motion:reduce){.launcher-window{transform:none}.hero-actions a,.ecosystem-links a{transition:none}}
</style>
