<template>
  <main class="download-page">
    <MarketHeader />
    <section class="download-hero">
      <span class="eyebrow">PCL N DOWNLOAD</span>
      <h1>{{ t("site.download.title") }}</h1>
      <p>{{ t("site.download.subtitle") }}</p>
      <div class="channel-links">
        <a href="https://github.com/PCL-N-Edition/PCL-N/releases/latest" target="_blank" rel="noreferrer">{{ t("site.download.stableRelease") }} ↗</a>
        <a href="https://github.com/PCL-N-Edition/PCL-N/releases" target="_blank" rel="noreferrer">{{ t("site.download.previewReleases") }} ↗</a>
      </div>
    </section>

    <section class="download-shell">
      <div class="section-heading">
        <div><span>{{ t("site.download.platformLabel") }}</span><h2>{{ t("site.download.choosePlatform") }}</h2></div>
        <p>{{ t("site.download.recommendationHint") }}</p>
      </div>
      <div class="platform-grid">
        <article v-for="item in downloads" :key="item.id" :class="{ recommended: item.id === recommendedId }">
          <div class="platform-top">
            <span class="platform-icon" aria-hidden="true">{{ item.icon }}</span>
            <span v-if="item.id === recommendedId" class="recommended-label">{{ t("site.download.recommended") }}</span>
          </div>
          <h3>{{ item.name }}</h3>
          <p>{{ item.arch }}</p>
          <a class="download-button" :href="item.selfContained" rel="noreferrer">{{ t("site.download.download") }} <span aria-hidden="true">↓</span></a>
          <div class="package-links">
            <a :href="item.noRuntime" rel="noreferrer">{{ t("site.download.noRuntime") }}</a>
            <a :href="`${item.selfContained}.asc`" rel="noreferrer">{{ t("site.download.signature") }}</a>
          </div>
        </article>
      </div>

      <div class="package-explainer">
        <article><span aria-hidden="true">✓</span><div><h3>{{ t("site.download.selfContainedTitle") }}</h3><p>{{ t("site.download.selfContainedText") }}</p></div></article>
        <article><span aria-hidden="true">↘</span><div><h3>{{ t("site.download.noRuntimeTitle") }}</h3><p>{{ t("site.download.noRuntimeText") }}</p></div></article>
      </div>

      <section class="install-notes">
        <div>
          <span class="section-label">{{ t("site.download.afterDownload") }}</span>
          <h2>{{ t("site.download.installTitle") }}</h2>
        </div>
        <ol>
          <li><b>01</b><div><strong>{{ t("site.download.steps.extractTitle") }}</strong><span>{{ t("site.download.steps.extractText") }}</span></div></li>
          <li><b>02</b><div><strong>{{ t("site.download.steps.runTitle") }}</strong><span>{{ t("site.download.steps.runText") }}</span></div></li>
          <li><b>03</b><div><strong>{{ t("site.download.steps.finishTitle") }}</strong><span>{{ t("site.download.steps.finishText") }}</span></div></li>
        </ol>
      </section>

      <section class="verify-card">
        <span aria-hidden="true">⌁</span>
        <div><h2>{{ t("site.download.verifyTitle") }}</h2><p>{{ t("site.download.verifyText") }}</p></div>
        <a href="https://github.com/PCL-N-Edition/PCL-N/blob/dev/GPG-PUBLIC-KEY.asc" target="_blank" rel="noreferrer">{{ t("site.download.publicKey") }} ↗</a>
      </section>
    </section>
    <PublicSiteFooter />
  </main>
</template>

<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import MarketHeader from "@/components/market/MarketHeader.vue";
import PublicSiteFooter from "@/components/market/PublicSiteFooter.vue";
import { applyPageSeo } from "@/utils/seo";

const { t, locale } = useI18n();
const releaseRoot = "https://github.com/PCL-N-Edition/PCL-N/releases/latest/download";
const asset = (rid: string, extension: "zip" | "tar.gz", variant: "SelfContained" | "NoRuntime") =>
  `${releaseRoot}/PCL_N_Release_${rid}_${variant}.${extension}`;
const downloads = computed(() => [
  { id: "windows-x64", icon: "⊞", name: "Windows", arch: "x64", selfContained: asset("win-x64", "zip", "SelfContained"), noRuntime: asset("win-x64", "zip", "NoRuntime") },
  { id: "windows-arm64", icon: "⊞", name: "Windows", arch: "ARM64", selfContained: asset("win-arm64", "zip", "SelfContained"), noRuntime: asset("win-arm64", "zip", "NoRuntime") },
  { id: "macos-arm64", icon: "⌘", name: "macOS", arch: "Apple Silicon", selfContained: asset("osx-arm64", "tar.gz", "SelfContained"), noRuntime: asset("osx-arm64", "tar.gz", "NoRuntime") },
  { id: "macos-x64", icon: "⌘", name: "macOS", arch: "Intel", selfContained: asset("osx-x64", "tar.gz", "SelfContained"), noRuntime: asset("osx-x64", "tar.gz", "NoRuntime") },
  { id: "linux-x64", icon: "◆", name: "Linux", arch: "x64", selfContained: asset("linux-x64", "tar.gz", "SelfContained"), noRuntime: asset("linux-x64", "tar.gz", "NoRuntime") },
  { id: "linux-arm64", icon: "◆", name: "Linux", arch: "ARM64", selfContained: asset("linux-arm64", "tar.gz", "SelfContained"), noRuntime: asset("linux-arm64", "tar.gz", "NoRuntime") }
]);
const recommendedId = computed(() => {
  const ua = navigator.userAgent.toLowerCase();
  const arm = /arm64|aarch64/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ua.includes("windows")) return `windows-${arm ? "arm64" : "x64"}`;
  if (ua.includes("mac")) return `macos-${arm ? "arm64" : "x64"}`;
  if (ua.includes("linux")) return `linux-${arm ? "arm64" : "x64"}`;
  return "";
});
watchEffect(() => {
  applyPageSeo({
    title: t("site.download.pageTitle"),
    description: t("site.download.subtitle"),
    path: "/download"
  });
  document.documentElement.lang = locale.value === "zh" ? "zh-CN" : "en-US";
});
</script>

<style scoped lang="scss">
.download-page { --market-bg:#f5f7fb;--market-surface:rgba(255,255,255,.9);--market-surface-solid:#fff;--market-surface-soft:rgba(77,91,132,.07);--market-border:rgba(45,56,91,.12);--market-text:#192034;--market-muted:#677087;--market-accent:#5870f4;--market-accent-soft:rgba(88,112,244,.11);min-height:100vh;color:var(--market-text);background:radial-gradient(circle at 75% 0,rgba(111,92,255,.15),transparent 28rem),var(--market-bg)}
:global(html.dark) .download-page{--market-bg:#0f1118;--market-surface:rgba(24,27,38,.92);--market-surface-solid:#181b26;--market-surface-soft:rgba(255,255,255,.055);--market-border:rgba(214,220,255,.11);--market-text:#f1f3fa;--market-muted:#a2a9bd;--market-accent:#7d8fff;--market-accent-soft:rgba(125,143,255,.13)}
.download-hero{width:min(900px,calc(100% - 40px));margin:0 auto;padding:94px 0 72px;text-align:center}.eyebrow,.section-label,.section-heading span{color:var(--market-accent);font-size:10px;font-weight:800;letter-spacing:.16em}.download-hero h1{margin:14px 0 16px;font-size:clamp(48px,7vw,76px);letter-spacing:-.06em}.download-hero>p{max-width:680px;margin:0 auto;color:var(--market-muted);font-size:16px;line-height:1.75}.channel-links{margin-top:25px;display:flex;justify-content:center;flex-wrap:wrap;gap:9px}.channel-links a{padding:9px 13px;border:1px solid var(--market-border);border-radius:10px;color:var(--market-muted);background:var(--market-surface);font-size:11px}.channel-links a:hover{color:var(--market-accent)}
.download-shell{width:min(1180px,calc(100% - 40px));margin:0 auto;padding-bottom:92px}.section-heading{margin-bottom:20px;display:flex;align-items:end;justify-content:space-between;gap:30px}.section-heading h2{margin:7px 0 0;font-size:28px;letter-spacing:-.03em}.section-heading p{max-width:440px;margin:0;color:var(--market-muted);font-size:11px;line-height:1.6;text-align:right}.platform-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.platform-grid article{position:relative;padding:23px;border:1px solid var(--market-border);border-radius:18px;background:var(--market-surface);box-shadow:0 10px 30px rgba(31,42,78,.05)}.platform-grid article.recommended{border-color:rgba(88,112,244,.5);box-shadow:0 18px 42px rgba(88,112,244,.12)}.platform-top{min-height:44px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.platform-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:var(--market-accent);background:var(--market-accent-soft);font-size:19px;font-weight:800}.recommended-label{padding:5px 8px;border-radius:7px;color:var(--market-accent);background:var(--market-accent-soft);font-size:9px;font-weight:750}.platform-grid h3{margin:19px 0 3px;font-size:20px}.platform-grid article>p{margin:0 0 18px;color:var(--market-muted);font-size:11px}.download-button{width:100%;min-height:42px;display:flex;align-items:center;justify-content:center;gap:9px;border-radius:10px;color:#fff;background:var(--market-accent);font-size:12px;font-weight:750}.download-button:hover{filter:brightness(1.05)}.package-links{margin-top:12px;display:flex;justify-content:center;gap:15px}.package-links a{color:var(--market-muted);font-size:9px}.package-links a:hover{color:var(--market-accent)}
.package-explainer{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.package-explainer article{padding:20px;display:flex;align-items:flex-start;gap:13px;border:1px solid var(--market-border);border-radius:15px;background:var(--market-surface-soft)}.package-explainer article>span{width:31px;height:31px;flex:0 0 auto;display:grid;place-items:center;border-radius:9px;color:var(--market-accent);background:var(--market-accent-soft);font-weight:800}.package-explainer h3{margin:1px 0 5px;font-size:13px}.package-explainer p{margin:0;color:var(--market-muted);font-size:10px;line-height:1.6}
.install-notes{margin-top:92px;display:grid;grid-template-columns:.7fr 1.3fr;gap:75px;align-items:start}.install-notes h2{margin:11px 0 0;font-size:35px;letter-spacing:-.04em}.install-notes ol{margin:0;padding:0;list-style:none}.install-notes li{padding:21px 0;display:flex;gap:18px;border-bottom:1px solid var(--market-border)}.install-notes li:first-child{padding-top:0}.install-notes li>b{color:var(--market-accent);font-size:10px;letter-spacing:.1em}.install-notes li div{display:grid;gap:5px}.install-notes strong{font-size:13px}.install-notes li span{color:var(--market-muted);font-size:11px;line-height:1.6}.verify-card{margin-top:65px;padding:23px;display:flex;align-items:center;gap:16px;border:1px solid var(--market-border);border-radius:17px;background:var(--market-surface)}.verify-card>span{width:42px;height:42px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;color:var(--market-accent);background:var(--market-accent-soft)}.verify-card div{display:grid;gap:5px}.verify-card h2{margin:0;font-size:14px}.verify-card p{margin:0;color:var(--market-muted);font-size:10px}.verify-card a{margin-left:auto;white-space:nowrap;color:var(--market-accent);font-size:11px;font-weight:700}
@media(max-width:900px){.platform-grid{grid-template-columns:repeat(2,1fr)}.install-notes{grid-template-columns:1fr;gap:28px}}
@media(max-width:620px){.download-hero,.download-shell{width:min(100% - 28px,1180px)}.download-hero{padding:65px 0 52px}.platform-grid,.package-explainer{grid-template-columns:1fr}.section-heading{align-items:flex-start;flex-direction:column;gap:10px}.section-heading p{text-align:left}.install-notes{margin-top:68px}.verify-card{align-items:flex-start;flex-wrap:wrap}.verify-card a{width:100%;margin-left:58px}}
</style>
