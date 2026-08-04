<template>
  <main class="download-page">
    <MarketHeader />
    <section class="download-hero">
      <span class="eyebrow">PCL N DOWNLOAD</span>
      <h1>{{ t("site.download.title") }}</h1>
      <p>{{ t("site.download.subtitle") }}</p>
    </section>

    <section class="download-shell">
      <div class="section-heading">
        <div>
          <span>{{ t("site.download.platformLabel") }}</span>
          <h2>{{ t("site.download.choosePlatform") }}</h2>
        </div>
        <p>{{ t("site.download.recommendationHint") }}</p>
      </div>

      <div class="platform-grid">
        <article
          v-for="item in platforms"
          :key="item.id"
          :class="{ recommended: item.id === recommendedPlatformId }"
        >
          <div class="platform-top">
            <span class="platform-icon" aria-hidden="true">{{ item.icon }}</span>
            <span v-if="item.id === recommendedPlatformId" class="recommended-label">
              {{ t("site.download.recommended") }}
            </span>
          </div>
          <h3>{{ item.name }}</h3>
          <p>{{ t(`site.download.platforms.${item.id}`) }}</p>
          <button class="download-button" type="button" @click="openDownload(item.id)">
            {{ t("site.download.chooseDownload") }} <span aria-hidden="true">→</span>
          </button>
        </article>
      </div>

      <section class="install-notes">
        <div>
          <span class="section-label">{{ t("site.download.packagesLabel") }}</span>
          <h2>{{ t("site.download.packagesTitle") }}</h2>
        </div>
        <div class="package-summary">
          <article>
            <b>01</b>
            <div>
              <strong>Windows · 3 种</strong>
              <span>MSI 安装包 · EXE 安装包 · 便携 EXE</span>
            </div>
          </article>
          <article>
            <b>02</b>
            <div>
              <strong>macOS · 1 种</strong>
              <span>DMG 安装包</span>
            </div>
          </article>
          <article>
            <b>03</b>
            <div>
              <strong>Linux · 4 种</strong>
              <span>DEB · RPM · AppImage · 便携 TAR.GZ</span>
            </div>
          </article>
        </div>
      </section>

      <section class="verify-card">
        <span aria-hidden="true">⌁</span>
        <div>
          <h2>{{ t("site.download.verifyTitle") }}</h2>
          <p>{{ t("site.download.verifyText") }}</p>
        </div>
        <a
          href="https://github.com/PCL-N-Edition/PCL-N/blob/dev/GPG-PUBLIC-KEY.asc"
          target="_blank"
          rel="noreferrer"
        >
          {{ t("site.download.publicKey") }} ↗
        </a>
      </section>
    </section>

    <el-dialog
      v-model="dialogVisible"
      class="download-dialog"
      width="min(720px, calc(100vw - 28px))"
      align-center
      :show-close="false"
      :close-on-click-modal="true"
    >
      <template #header>
        <div class="dialog-heading">
          <div>
            <span class="dialog-platform-icon">{{ selectedPlatform.icon }}</span>
            <div>
              <strong>{{ selectedPlatform.name }}</strong>
              <small>{{ t("site.download.dialogTitle") }}</small>
            </div>
          </div>
          <button type="button" :aria-label="t('site.download.close')" @click="dialogVisible = false">
            ×
          </button>
        </div>
      </template>

      <div class="dialog-content">
        <section class="choice-section">
          <div class="choice-heading">
            <strong>{{ t("site.download.channel") }}</strong>
            <span>{{ catalogStatus }}</span>
          </div>
          <div class="channel-list" role="radiogroup" :aria-label="t('site.download.channel')">
            <button
              v-for="ch in channels"
              :key="ch.id"
              type="button"
              role="radio"
              :aria-checked="ch.id === selectedChannel"
              :class="{ selected: ch.id === selectedChannel, disabled: !channelHasVersions(ch.id) }"
              :disabled="!channelHasVersions(ch.id)"
              @click="selectChannel(ch.id)"
            >
              <b>{{ ch.label }}</b>
              <small>{{ channelLatestLabel(ch.id) }}</small>
            </button>
          </div>
        </section>

        <section class="choice-section">
          <div class="choice-heading">
            <strong>{{ t("site.download.version") }}</strong>
            <span>{{ t("site.download.versionHistoryHint") }}</span>
          </div>
          <el-select
            v-model="selectedVersionId"
            class="version-select"
            size="large"
            filterable
            :placeholder="t('site.download.versionPlaceholder')"
          >
            <el-option
              v-for="version in channelVersions"
              :key="version.id"
              :label="version.label"
              :value="version.id"
            >
              <div class="version-option">
                <span>{{ version.label }}</span>
                <i>{{ version.packaging === "v2" ? t("site.download.newPackages") : t("site.download.legacyPackages") }}</i>
              </div>
            </el-option>
          </el-select>
        </section>

        <section class="choice-section option-grid">
          <div class="option-row">
            <div>
              <strong>{{ t("site.download.architecture") }}</strong>
              <small>{{ t("site.download.architectureHint") }}</small>
            </div>
            <el-radio-group v-model="selectedArch" size="large">
              <el-radio-button
                v-for="arch in selectedPlatform.architectures"
                :key="arch.id"
                :value="arch.id"
              >
                {{ arch.label }}
              </el-radio-button>
            </el-radio-group>
          </div>

          <div class="option-row">
            <div>
              <strong>{{ t("site.download.includeRuntime") }}</strong>
              <small>{{ t("site.download.includeRuntimeHint") }}</small>
            </div>
            <el-radio-group v-model="includeRuntime" size="large" :disabled="selectedChannel === 'ci'">
              <el-radio-button :value="true">{{ t("site.download.yes") }}</el-radio-button>
              <el-radio-button :value="false">{{ t("site.download.no") }}</el-radio-button>
            </el-radio-group>
          </div>

          <div v-if="selectedVersion.supportsPluginChoice" class="option-row">
            <div>
              <strong>{{ t("site.download.includePlugin") }}</strong>
              <small>{{ t("site.download.includePluginHint") }}</small>
            </div>
            <el-radio-group v-model="includePlugin" size="large">
              <el-radio-button :value="true">{{ t("site.download.yes") }}</el-radio-button>
              <el-radio-button :value="false">{{ t("site.download.no") }}</el-radio-button>
            </el-radio-group>
          </div>

          <div class="option-row package-kind-row">
            <div>
              <strong>{{ t("site.download.packageKind") }}</strong>
              <small>{{ packageKindHint }}</small>
            </div>
            <el-radio-group v-model="packageKind" size="large" class="package-kind-group">
              <el-radio-button v-for="kind in packageKinds" :key="kind.id" :value="kind.id">
                {{ kind.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </section>

        <div v-if="selectedVersion.packaging !== 'v2'" class="compatibility-note">
          <span aria-hidden="true">i</span>
          <p>{{ t("site.download.legacyNotice") }}</p>
        </div>
        <div v-else-if="packageKind === 'appimage'" class="compatibility-note">
          <span aria-hidden="true">i</span>
          <p>{{ t("site.download.appImageHint") }}</p>
        </div>
        <div v-if="selectedVersion.packaging === 'v2'" class="asset-preview">
          <code>{{ assetFileName }}</code>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <a :href="signatureUrl" target="_blank" rel="noreferrer">{{ t("site.download.signature") }} ↗</a>
          <button class="confirm-download" type="button" @click="goThanks">
            {{ t("site.download.downloadNow") }} · {{ selectedAssetLabel }}
            <span aria-hidden="true">↓</span>
          </button>
        </div>
      </template>
    </el-dialog>

    <PublicSiteFooter />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import MarketHeader from "@/components/market/MarketHeader.vue";
import PublicSiteFooter from "@/components/market/PublicSiteFooter.vue";
import { applyPageSeo } from "@/utils/seo";
import {
  FALLBACK_VERSIONS,
  buildAssetFileName,
  fetchLauncherVersionsWithSource,
  latestForChannel,
  resolveDownloadUrls,
  versionsForChannel,
  type ReleaseChannel,
  type ReleaseVersion
} from "@/utils/launcherReleases";

type PlatformId = "windows" | "macos" | "linux";
/** Concrete package SKU matching published asset names. */
type PackageKindId =
  | "msi"
  | "exe-installer"
  | "dmg"
  | "deb"
  | "rpm"
  | "appimage"
  | "portable"
  | "legacy-archive";

const { t, locale } = useI18n();
const router = useRouter();

const platforms = [
  {
    id: "windows" as const,
    icon: "⊞",
    name: "Windows",
    architectures: [
      { id: "x64", label: "x64" },
      { id: "arm64", label: "ARM64" }
    ]
  },
  {
    id: "macos" as const,
    icon: "⌘",
    name: "macOS",
    architectures: [
      { id: "arm64", label: "Apple Silicon" },
      { id: "x64", label: "Intel" }
    ]
  },
  {
    id: "linux" as const,
    icon: "◆",
    name: "Linux",
    architectures: [
      { id: "x64", label: "x64" },
      { id: "arm64", label: "ARM64" }
    ]
  }
];

const channels = computed(() => [
  { id: "release" as const, label: t("site.download.stable") },
  { id: "beta" as const, label: t("site.download.beta") },
  { id: "ci" as const, label: t("site.download.ci") }
]);

const versions = ref<ReleaseVersion[]>(FALLBACK_VERSIONS);
const catalogStatus = ref("");
const dialogVisible = ref(false);
const selectedPlatformId = ref<PlatformId>("windows");
const selectedChannel = ref<ReleaseChannel>("beta");
const selectedVersionId = ref(FALLBACK_VERSIONS.find(v => v.channel === "beta")?.id ?? FALLBACK_VERSIONS[0].id);
const selectedArch = ref("x64");
const includeRuntime = ref(true);
const includePlugin = ref(true);
const packageKind = ref<PackageKindId>("msi");

const userAgent = navigator.userAgent.toLowerCase();
const isArm =
  /arm64|aarch64/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const recommendedPlatformId = computed<PlatformId | "">(() => {
  if (userAgent.includes("windows")) return "windows";
  if (userAgent.includes("mac")) return "macos";
  if (userAgent.includes("linux")) return "linux";
  return "";
});

const selectedPlatform = computed(
  () => platforms.find(item => item.id === selectedPlatformId.value) ?? platforms[0]
);

const channelVersions = computed(() => versionsForChannel(versions.value, selectedChannel.value));

const selectedVersion = computed(
  () =>
    channelVersions.value.find(item => item.id === selectedVersionId.value) ??
    channelVersions.value[0] ??
    versions.value[0]
);

/** Platform package menus: Win×3, macOS×1, Linux×4 (v2); legacy keeps a single archive. */
const packageKinds = computed(() => {
  if (selectedVersion.value.packaging !== "v2") {
    return [{ id: "legacy-archive" as const, label: t("site.download.legacyArchive") }];
  }
  if (selectedPlatformId.value === "windows") {
    return [
      { id: "msi" as const, label: "MSI" },
      { id: "exe-installer" as const, label: "EXE" },
      { id: "portable" as const, label: t("site.download.portable") }
    ];
  }
  if (selectedPlatformId.value === "macos") {
    return [{ id: "dmg" as const, label: "DMG" }];
  }
  return [
    { id: "deb" as const, label: "DEB" },
    { id: "rpm" as const, label: "RPM" },
    { id: "appimage" as const, label: "AppImage" },
    { id: "portable" as const, label: t("site.download.portableTar") }
  ];
});

const packageKindHint = computed(() =>
  selectedVersion.value.packaging === "v2"
    ? t("site.download.packageKindHint")
    : t("site.download.legacyDeliveryHint")
);

const runtimeId = computed(() => {
  const prefix =
    selectedPlatformId.value === "windows"
      ? "win"
      : selectedPlatformId.value === "macos"
        ? "osx"
        : "linux";
  return `${prefix}-${selectedArch.value}`;
});

const assetFileName = computed(() => {
  const kind = packageKind.value;
  if (kind === "legacy-archive" || selectedVersion.value.packaging !== "v2") {
    return buildAssetFileName({
      channel: selectedVersion.value.channel,
      runtimeId: runtimeId.value,
      includeRuntime: selectedChannel.value === "ci" ? true : includeRuntime.value,
      includePlugin: includePlugin.value,
      supportsPluginChoice: selectedVersion.value.supportsPluginChoice,
      packaging: "legacy",
      platform: selectedPlatformId.value,
      delivery: "portable",
      packageFormat: "zip"
    });
  }
  const delivery = kind === "portable" ? "portable" : "installer";
  const packageFormat =
    kind === "portable"
      ? selectedPlatformId.value === "windows"
        ? "exe"
        : "tar.gz"
      : kind === "exe-installer"
        ? "exe-installer"
        : kind;
  return buildAssetFileName({
    channel: selectedVersion.value.channel,
    runtimeId: runtimeId.value,
    includeRuntime: selectedChannel.value === "ci" ? true : includeRuntime.value,
    includePlugin: includePlugin.value,
    supportsPluginChoice: selectedVersion.value.supportsPluginChoice,
    packaging: "v2",
    platform: selectedPlatformId.value,
    delivery,
    packageFormat
  });
});

const resolved = computed(() => resolveDownloadUrls(selectedVersion.value, assetFileName.value));
const downloadUrl = computed(() => resolved.value.downloadUrl);
const signatureUrl = computed(() => resolved.value.signatureUrl);
const selectedAssetLabel = computed(
  () => packageKinds.value.find(k => k.id === packageKind.value)?.label ?? packageKind.value
);

const channelHasVersions = (channel: ReleaseChannel) =>
  versionsForChannel(versions.value, channel).length > 0;

const channelLatestLabel = (channel: ReleaseChannel) => {
  const latest = latestForChannel(versions.value, channel);
  return latest?.label ?? t("site.download.channelEmpty");
};

const selectChannel = (channel: ReleaseChannel) => {
  if (!channelHasVersions(channel)) return;
  selectedChannel.value = channel;
  const list = versionsForChannel(versions.value, channel);
  selectedVersionId.value = list[0]?.id ?? selectedVersionId.value;
  if (channel === "ci") includeRuntime.value = true;
};

const syncPackageKind = () => {
  const kinds = packageKinds.value;
  if (!kinds.some(k => k.id === packageKind.value)) {
    packageKind.value = kinds[0]?.id ?? "legacy-archive";
  }
};

const openDownload = (platform: PlatformId) => {
  selectedPlatformId.value = platform;
  selectedArch.value = isArm
    ? "arm64"
    : platform === "macos"
      ? "arm64"
      : "x64";
  syncPackageKind();
  dialogVisible.value = true;
};

const goThanks = () => {
  dialogVisible.value = false;
  router.push({
    path: "/download/thanks",
    query: {
      url: downloadUrl.value,
      sig: signatureUrl.value,
      name: resolved.value.assetName
    }
  });
};

watch([selectedVersionId, selectedPlatformId, selectedChannel], () => {
  syncPackageKind();
});

watch(selectedChannel, ch => {
  if (ch === "ci") includeRuntime.value = true;
});

let abort: AbortController | null = null;

onMounted(async () => {
  catalogStatus.value = t("site.download.catalogLoading");
  abort = new AbortController();
  try {
    const result = await fetchLauncherVersionsWithSource(abort.signal);
    const remote = result.versions;
    if (remote.length) {
      versions.value = remote;
      // Prefer beta latest (active channel); else first available.
      const prefer: ReleaseChannel[] = ["beta", "release", "ci"];
      const first = prefer.map(ch => latestForChannel(remote, ch)).find(Boolean);
      if (first) {
        selectedChannel.value = first.channel;
        selectedVersionId.value = first.id;
      }
      if (result.source === "api") {
        catalogStatus.value = t("site.download.catalogReadyApi", { count: remote.length });
      } else if (result.source === "static") {
        catalogStatus.value = t("site.download.catalogReadyStatic", { count: remote.length });
      } else if (result.source === "github") {
        catalogStatus.value = t("site.download.catalogReady", { count: remote.length });
      } else {
        catalogStatus.value = t("site.download.catalogFallback");
      }
    } else {
      catalogStatus.value = t("site.download.catalogFallback");
    }
  } catch {
    catalogStatus.value = t("site.download.catalogFallback");
  }
});

onUnmounted(() => abort?.abort());

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
.download-page{--market-bg:#f5f7fb;--market-surface:rgba(255,255,255,.92);--market-surface-solid:#fff;--market-surface-soft:rgba(77,91,132,.07);--market-border:rgba(45,56,91,.12);--market-text:#192034;--market-muted:#677087;--market-accent:#568ee8;--market-accent-soft:rgba(86,142,232,.12);min-height:100vh;color:var(--market-text);color-scheme:light;background:radial-gradient(circle at 75% 0,rgba(75,139,224,.16),transparent 30rem),var(--market-bg)}
:global(html.dark .download-page){--market-bg:#0d1118;--market-surface:rgba(26,31,41,.94);--market-surface-solid:#1a1f29;--market-surface-soft:rgba(255,255,255,.055);--market-border:rgba(218,229,255,.12);--market-text:#f4f7fc;--market-muted:#a7b0c2;--market-accent:#74aef4;--market-accent-soft:rgba(116,174,244,.14);color-scheme:dark;background:radial-gradient(circle at 75% 0,rgba(61,121,204,.2),transparent 30rem),var(--market-bg)}
.download-hero{width:min(1040px,calc(100% - 40px));margin:0 auto;padding:90px 0 58px;text-align:center}.eyebrow,.section-label,.section-heading span{color:var(--market-accent);font-size:10px;font-weight:800;letter-spacing:.15em}.download-hero h1{margin:14px 0 13px;font-size:clamp(42px,6vw,70px);letter-spacing:-.055em}.download-hero p{max-width:650px;margin:0 auto;color:var(--market-muted);font-size:16px;line-height:1.75}.download-shell{width:min(1120px,calc(100% - 40px));margin:0 auto 90px}.section-heading{margin:24px 0 20px;display:flex;align-items:end;justify-content:space-between;gap:20px}.section-heading h2{margin:7px 0 0;font-size:27px}.section-heading p{max-width:360px;margin:0;color:var(--market-muted);font-size:12px;text-align:right}
.platform-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.platform-grid article{position:relative;padding:27px;border:1px solid var(--market-border);border-radius:20px;background:var(--market-surface);box-shadow:0 16px 45px rgba(34,45,79,.06);transition:transform .2s ease,border-color .2s ease,background .2s ease}.platform-grid article:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--market-accent) 45%,transparent);background:var(--market-surface-solid)}.platform-grid article.recommended{border-color:color-mix(in srgb,var(--market-accent) 52%,transparent);box-shadow:0 19px 54px rgba(64,119,200,.13)}.platform-top{min-height:48px;display:flex;align-items:start;justify-content:space-between}.platform-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;color:var(--market-accent);background:var(--market-accent-soft);font-size:21px;font-weight:800}.recommended-label{padding:6px 9px;border-radius:8px;color:var(--market-accent);background:var(--market-accent-soft);font-size:9px;font-weight:800}.platform-grid h3{margin:25px 0 5px;font-size:23px}.platform-grid p{min-height:42px;margin:0 0 22px;color:var(--market-muted);font-size:12px;line-height:1.65}.download-button{width:100%;min-height:45px;border:0;border-radius:12px;color:#fff;background:var(--market-accent);font:inherit;font-size:13px;font-weight:760;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}.download-button:hover{transform:translateY(-1px);box-shadow:0 12px 27px rgba(60,121,207,.24)}
.install-notes{margin-top:75px;display:grid;grid-template-columns:.55fr 1.45fr;gap:54px;align-items:start}.install-notes h2{margin:9px 0 0;font-size:31px;letter-spacing:-.03em}.package-summary{display:grid;gap:10px}.package-summary article{padding:17px 19px;display:flex;align-items:center;gap:15px;border:1px solid var(--market-border);border-radius:15px;background:var(--market-surface)}.package-summary b{color:var(--market-accent);font-size:11px}.package-summary div{display:grid;gap:3px}.package-summary strong{font-size:13px}.package-summary span{color:var(--market-muted);font-size:11px}.verify-card{margin-top:64px;padding:22px;display:flex;align-items:center;gap:17px;border:1px solid var(--market-border);border-radius:18px;background:var(--market-surface)}.verify-card>span{width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;color:var(--market-accent);background:var(--market-accent-soft)}.verify-card h2{margin:0 0 5px;font-size:14px}.verify-card p{margin:0;color:var(--market-muted);font-size:11px}.verify-card a{margin-left:auto;white-space:nowrap;color:var(--market-accent);font-size:11px;font-weight:750}
:global(.download-dialog.el-dialog){--market-surface-solid:#fff;--market-surface-soft:rgba(77,91,132,.07);--market-text:#192034;--market-muted:#677087;--market-border:rgba(45,56,91,.12);--market-accent:#568ee8;--market-accent-soft:rgba(86,142,232,.12);--el-bg-color:var(--market-surface-solid);--el-text-color-primary:var(--market-text);--el-text-color-regular:var(--market-muted);--el-border-color:var(--market-border);overflow:hidden;border:1px solid var(--market-border);border-radius:22px;background:var(--market-surface-solid);box-shadow:0 35px 100px rgba(15,24,45,.28)}:global(html.dark .download-dialog.el-dialog){--market-surface-solid:#1a1f29;--market-surface-soft:rgba(255,255,255,.055);--market-text:#f4f7fc;--market-muted:#a7b0c2;--market-border:rgba(218,229,255,.12);--market-accent:#74aef4;--market-accent-soft:rgba(116,174,244,.14);box-shadow:0 38px 110px rgba(0,0,0,.55)}:global(.download-dialog .el-dialog__header){margin:0;padding:20px 22px;border-bottom:1px solid var(--market-border)}:global(.download-dialog .el-dialog__body){padding:22px}:global(.download-dialog .el-dialog__footer){padding:0 22px 22px}.dialog-heading,.dialog-heading>div{display:flex;align-items:center}.dialog-heading{justify-content:space-between}.dialog-heading>div{gap:12px}.dialog-platform-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:11px;color:var(--market-accent);background:var(--market-accent-soft);font-size:18px}.dialog-heading div div{display:grid;gap:2px}.dialog-heading strong{color:var(--market-text);font-size:15px}.dialog-heading small{color:var(--market-muted);font-size:10px}.dialog-heading>button{width:34px;height:34px;border:1px solid var(--market-border);border-radius:10px;color:var(--market-muted);background:transparent;font-size:20px;cursor:pointer}.dialog-content{display:grid;gap:21px}.choice-section{display:grid;gap:11px}.choice-heading{display:flex;align-items:center;justify-content:space-between;gap:15px}.choice-heading strong{color:var(--market-text);font-size:12px}.choice-heading span{color:var(--market-muted);font-size:10px}
.channel-list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.channel-list button{min-width:0;padding:13px;text-align:left;border:1px solid var(--market-border);border-radius:12px;color:var(--market-text);background:var(--market-surface-soft);cursor:pointer}.channel-list button.selected{border-color:var(--market-accent);background:var(--market-accent-soft);box-shadow:inset 0 0 0 1px var(--market-accent)}.channel-list button.disabled,.channel-list button:disabled{opacity:.45;cursor:not-allowed}.channel-list b{display:block;font-size:12px}.channel-list small{display:block;margin-top:6px;color:var(--market-muted);font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.version-select{width:100%}:global(.download-dialog .version-select .el-select__wrapper){min-height:44px;border-radius:12px}.version-option{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%}.version-option i{color:var(--market-muted);font-size:11px;font-style:normal}
.option-grid{padding:4px 0;border-top:1px solid var(--market-border)}.option-row{padding:13px 0;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid var(--market-border)}.option-row>div:first-child{display:grid;gap:4px}.option-row strong{color:var(--market-text);font-size:12px}.option-row small{color:var(--market-muted);font-size:9px}:global(.download-dialog .el-radio-button__inner){min-width:65px;border-color:var(--market-border);color:var(--market-muted);background:var(--market-surface-soft);box-shadow:none}:global(.download-dialog .el-radio-button__original-radio:checked + .el-radio-button__inner){border-color:var(--market-accent);color:#fff;background:var(--market-accent);box-shadow:-1px 0 0 0 var(--market-accent)}.compatibility-note{padding:12px 14px;display:flex;align-items:flex-start;gap:10px;border-radius:12px;color:var(--market-muted);background:var(--market-surface-soft);font-size:10px;line-height:1.6}.compatibility-note span{width:19px;height:19px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;color:var(--market-accent);background:var(--market-accent-soft);font-weight:800}.compatibility-note p{margin:1px 0 0}.asset-preview{padding:10px 12px;border-radius:10px;background:var(--market-surface-soft);overflow:auto}.asset-preview code{color:var(--market-muted);font-size:10px;word-break:break-all}.package-kind-row{align-items:flex-start}.package-kind-group{flex-wrap:wrap;max-width:min(100%,420px);justify-content:flex-end}.dialog-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.dialog-footer>a:first-child{color:var(--market-muted);font-size:10px}.confirm-download{min-height:44px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;color:#fff;background:var(--market-accent);font:inherit;font-size:12px;font-weight:760;cursor:pointer}
@media(max-width:780px){.platform-grid{grid-template-columns:1fr}.section-heading{align-items:start;flex-direction:column}.section-heading p{text-align:left}.install-notes{grid-template-columns:1fr;gap:24px}.channel-list{grid-template-columns:1fr}.option-row{align-items:flex-start;flex-direction:column}.option-row :deep(.el-radio-group){width:100%}.option-row :deep(.el-radio-button){flex:1}.option-row :deep(.el-radio-button__inner){width:100%}.dialog-footer{align-items:stretch;flex-direction:column-reverse}.confirm-download{width:100%}}
@media(max-width:520px){.download-hero,.download-shell{width:min(100% - 28px,1120px)}.download-hero{padding:62px 0 38px}.download-hero h1{font-size:44px}.platform-grid article{padding:22px}.verify-card{align-items:flex-start;flex-wrap:wrap}.verify-card a{width:100%;margin-left:59px}}
@media(prefers-reduced-motion:reduce){.platform-grid article,.download-button{transition:none}}
</style>
