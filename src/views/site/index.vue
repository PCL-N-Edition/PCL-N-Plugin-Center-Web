<template>
  <main class="landing-page">
    <MarketHeader />

    <section class="hero">
      <div class="hero-copy">
        <h1>{{ t("site.home.heroTitle") }}</h1>
        <div class="hero-actions">
          <router-link class="primary-action" to="/download">{{ t("site.home.download") }} <span aria-hidden="true">↓</span></router-link>
          <router-link class="secondary-action" to="/market">{{ t("site.home.market") }} <span aria-hidden="true">→</span></router-link>
        </div>
        <div class="platform-note" aria-label="Windows, macOS, Linux">
          <span>⊞ Windows</span><span>⌘ macOS</span><span>◆ Linux</span>
        </div>
      </div>

      <div class="launcher-shot" role="img" :aria-label="t('site.home.screenshotAlt')">
        <div class="shot-shade"></div>
        <div class="shot-label"><span></span>{{ t("site.home.screenshotLabel") }}</div>
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
  --market-bg:#f5f7fb;--market-surface:rgba(255,255,255,.9);--market-surface-solid:#fff;
  --market-surface-soft:rgba(77,91,132,.07);--market-border:rgba(45,56,91,.12);
  --market-text:#192034;--market-muted:#677087;--market-accent:#568ee8;--market-accent-soft:rgba(86,142,232,.12);
  min-height:100vh;overflow:hidden;color:var(--market-text);color-scheme:light;
  background:radial-gradient(circle at 82% 4%,rgba(86,142,232,.16),transparent 31rem),radial-gradient(circle at 8% 34%,rgba(104,112,244,.09),transparent 28rem),var(--market-bg);
}
:global(html.dark .landing-page) {
  --market-bg:#0d1118;--market-surface:rgba(26,31,41,.92);--market-surface-solid:#1a1f29;
  --market-surface-soft:rgba(255,255,255,.055);--market-border:rgba(218,229,255,.12);
  --market-text:#f4f7fc;--market-muted:#a7b0c2;--market-accent:#74aef4;--market-accent-soft:rgba(116,174,244,.14);
  color-scheme:dark;background:radial-gradient(circle at 82% 2%,rgba(65,126,210,.2),transparent 31rem),radial-gradient(circle at 6% 34%,rgba(99,111,225,.1),transparent 28rem),var(--market-bg);
}
.hero{width:min(1220px,calc(100% - 40px));min-height:630px;margin:20px auto 54px;display:grid;grid-template-columns:minmax(360px,.78fr) minmax(560px,1.22fr);align-items:center;gap:54px}
.hero-copy{position:relative;z-index:2;padding:60px 0}.hero h1{max-width:590px;margin:0;font-size:clamp(50px,6.1vw,82px);line-height:1.04;letter-spacing:-.058em;text-wrap:balance}
.hero-actions{margin-top:36px;display:flex;flex-wrap:wrap;gap:11px}.hero-actions a,.final-cta a{min-height:48px;padding:0 21px;display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:13px;font-size:14px;font-weight:760;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease}
.hero-actions a:hover,.final-cta a:hover{transform:translateY(-2px)}.primary-action,.final-cta a{color:#fff;background:var(--market-accent);box-shadow:0 13px 32px rgba(61,121,204,.27)}.secondary-action{color:var(--market-text);border:1px solid var(--market-border);background:var(--market-surface)}.secondary-action:hover{border-color:color-mix(in srgb,var(--market-accent) 55%,transparent);background:var(--market-surface-solid)}
.platform-note{margin-top:22px;display:flex;flex-wrap:wrap;gap:17px;color:var(--market-muted);font-size:11px;font-weight:650}
.launcher-shot{position:relative;aspect-ratio:1.7;overflow:hidden;border:1px solid rgba(255,255,255,.72);border-radius:25px;background-image:url('/launcher-hero.jpg');background-position:center;background-size:cover;box-shadow:0 42px 92px rgba(34,49,86,.27);transform:perspective(1300px) rotateY(-4deg) rotateX(1.5deg);isolation:isolate}
.launcher-shot::before{content:"";position:absolute;inset:0;z-index:1;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}.shot-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 54%,rgba(7,12,20,.52)),linear-gradient(105deg,rgba(80,145,231,.08),transparent 42%)}.shot-label{position:absolute;z-index:2;left:20px;bottom:18px;padding:9px 12px;display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.17);border-radius:11px;color:#fff;background:rgba(8,14,24,.62);backdrop-filter:blur(16px);font-size:10px;font-weight:700}.shot-label span{width:7px;height:7px;border-radius:50%;background:#58d79e;box-shadow:0 0 0 4px rgba(88,215,158,.15)}
:global(html.dark .launcher-shot){border-color:rgba(255,255,255,.13);box-shadow:0 42px 100px rgba(0,0,0,.44);filter:saturate(.94) brightness(.92)}
.principles{width:min(1180px,calc(100% - 40px));margin:0 auto 110px;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--market-border);border-radius:22px;background:var(--market-surface);box-shadow:0 20px 60px rgba(31,42,78,.07)}.principles article{padding:28px}.principles article+article{border-left:1px solid var(--market-border)}.principles article>span{width:39px;height:39px;display:grid;place-items:center;border-radius:11px;color:var(--market-accent);background:var(--market-accent-soft);font-weight:850}.principles h2{margin:18px 0 8px;font-size:16px}.principles p{margin:0;color:var(--market-muted);font-size:12px;line-height:1.65}
.ecosystem{width:min(1080px,calc(100% - 40px));margin:0 auto 120px;display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;align-items:center}.section-label{color:var(--market-accent);font-size:10px;font-weight:800;letter-spacing:.16em}.ecosystem h2{margin:12px 0 13px;font-size:clamp(32px,4vw,48px);letter-spacing:-.04em}.ecosystem>div>p{margin:0;color:var(--market-muted);line-height:1.8}.ecosystem-links{display:grid;gap:12px}.ecosystem-links a{padding:20px;display:flex;align-items:center;gap:15px;border:1px solid var(--market-border);border-radius:16px;color:var(--market-text);background:var(--market-surface);transition:transform .2s ease,border-color .2s ease,background .2s ease}.ecosystem-links a:hover{transform:translateX(4px);border-color:color-mix(in srgb,var(--market-accent) 42%,transparent);background:var(--market-surface-solid)}.ecosystem-links a>span{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:var(--market-accent);background:var(--market-accent-soft)}.ecosystem-links div{display:grid;gap:4px}.ecosystem-links small{color:var(--market-muted);font-size:11px}.ecosystem-links b{margin-left:auto;color:var(--market-accent)}
.final-cta{width:min(1180px,calc(100% - 40px));margin:0 auto 90px;padding:58px 30px;text-align:center;border:1px solid var(--market-border);border-radius:24px;background:radial-gradient(circle at 50% 0,var(--market-accent-soft),transparent 22rem),var(--market-surface)}.final-cta img{width:52px;height:52px;border-radius:15px;box-shadow:0 12px 30px rgba(88,112,244,.2)}.final-cta h2{margin:18px 0 8px;font-size:clamp(30px,4vw,46px)}.final-cta p{margin:0 0 24px;color:var(--market-muted)}.final-cta a{min-width:155px}
@media(max-width:980px){.hero{grid-template-columns:1fr;min-height:auto;gap:8px}.hero-copy{padding:62px 0 24px}.hero h1{max-width:820px}.launcher-shot{width:min(850px,100%);justify-self:center;transform:none}.principles{grid-template-columns:repeat(2,1fr)}.principles article:nth-child(3){border-left:0;border-top:1px solid var(--market-border)}.principles article:nth-child(4){border-top:1px solid var(--market-border)}.ecosystem{grid-template-columns:1fr;gap:30px}}
@media(max-width:650px){.hero,.principles,.ecosystem,.final-cta{width:min(100% - 28px,1180px)}.hero{margin-top:4px;margin-bottom:64px}.hero-copy{padding:48px 0 24px}.hero h1{font-size:48px}.launcher-shot{border-radius:18px}.shot-label{left:12px;bottom:11px}.principles{grid-template-columns:1fr;margin-bottom:80px}.principles article+article{border-left:0;border-top:1px solid var(--market-border)}.ecosystem{margin-bottom:80px}.final-cta{padding:46px 20px;margin-bottom:65px}}
@media(prefers-reduced-motion:reduce){.launcher-shot{transform:none}.hero-actions a,.ecosystem-links a{transition:none}}
</style>
