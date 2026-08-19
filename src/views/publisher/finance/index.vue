<template>
  <div class="center-page">
    <header class="heading">
      <div>
        <el-tag round>Publisher Finance</el-tag>
        <h1>收入与提现</h1>
        <p>订单满 14 天可结算；每月 UTC 1–7 日可申请提现，最低 ¥100.00。仅显示你有编辑权限的组织。</p>
      </div>
      <el-select
        v-model="organizationId"
        placeholder="选择组织"
        :disabled="organizations.length === 0"
        style="min-width: 220px"
        @change="load"
      >
        <el-option v-for="o in organizations" :key="o.id" :label="o.display_name" :value="o.id" />
      </el-select>
    </header>

    <el-alert
      title="开发者应自行依法申报并缴纳相关税费；平台不承诺代扣代缴。"
      type="warning"
      show-icon
      :closable="false"
    />
    <el-alert
      v-if="organizations.length === 0"
      class="gap"
      title="你还没有可管理财务的发布者组织（需要 owner / maintainer）。"
      type="info"
      show-icon
      :closable="false"
    />
    <el-alert v-if="errorMessage" class="gap" :title="errorMessage" type="error" show-icon :closable="false" />

    <section class="stats">
      <el-card v-loading="loading"><span>待结算</span><strong>{{ money(summary.pendingCents) }}</strong></el-card>
      <el-card v-loading="loading"><span>可提现</span><strong>{{ money(summary.availableCents) }}</strong></el-card>
      <el-card v-loading="loading"><span>已提现</span><strong>{{ money(summary.withdrawnCents) }}</strong></el-card>
      <el-card v-loading="loading"><span>平台服务费</span><strong>{{ money(summary.platformFeeCents) }}</strong></el-card>
    </section>

    <el-card v-loading="loading">
      <h2>支付宝收款资料</h2>
      <p v-if="accountMask" class="mask">当前账号掩码：{{ accountMask }}</p>
      <el-form inline @submit.prevent>
        <el-form-item label="收款人">
          <el-input v-model="recipient" :disabled="!organizationId" />
        </el-form-item>
        <el-form-item label="支付宝账号">
          <el-input v-model="account" :disabled="!organizationId" />
        </el-form-item>
        <el-button type="primary" :disabled="!canEditFinance" :loading="savingProfile" @click="saveProfile">
          加密保存
        </el-button>
      </el-form>

      <el-divider />

      <h2>申请提现</h2>
      <el-alert
        class="gap"
        :title="withdrawWindowHint"
        :type="withdrawWindowOpen ? 'success' : 'warning'"
        show-icon
        :closable="false"
      />
      <div class="withdraw-row">
        <el-input-number v-model="amountYuan" :min="100" :precision="2" :disabled="!canWithdraw" />
        <el-button
          class="action"
          type="primary"
          :disabled="!canWithdraw"
          :loading="withdrawing"
          @click="withdraw"
        >
          提交申请
        </el-button>
      </div>
      <ul class="hints">
        <li>最低提现金额 ¥100.00；当前可提现 {{ money(summary.availableCents) }}。</li>
        <li>必须先保存支付宝收款资料。</li>
        <li v-if="!withdrawWindowOpen">当前不在提现窗口（UTC 每月 1–7 日）。</li>
      </ul>

      <el-divider />
      <h2>最近提现记录</h2>
      <el-table :data="withdrawals" stripe empty-text="暂无提现记录">
        <el-table-column label="金额" min-width="120">
          <template #default="scope">{{ money(scope.row.amountCents) }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="收款掩码" prop="payoutAccountMask" min-width="140" />
        <el-table-column label="申请时间" min-width="180">
          <template #default="scope">{{ formatDate(scope.row.requestedAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="decisionReason" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { pluginCenterApi } from "@/api/pluginCenter";

const organizations = ref<Array<{ id: string; display_name: string }>>([]);
const organizationId = ref("");
const recipient = ref("");
const account = ref("");
const amountYuan = ref(100);
const accountMask = ref<string | null>(null);
const loading = ref(false);
const savingProfile = ref(false);
const withdrawing = ref(false);
const errorMessage = ref("");
const withdrawals = ref<Array<Record<string, any>>>([]);
const summary = reactive({
  pendingCents: 0,
  availableCents: 0,
  withdrawnCents: 0,
  platformFeeCents: 0
});

const utcDay = computed(() => new Date().getUTCDate());
const withdrawWindowOpen = computed(() => utcDay.value >= 1 && utcDay.value <= 7);
const withdrawWindowHint = computed(() =>
  withdrawWindowOpen.value
    ? `提现窗口开放中（UTC 今日 ${utcDay.value} 日）。`
    : `提现窗口关闭（UTC 今日 ${utcDay.value} 日；仅 1–7 日可申请）。`
);

const canEditFinance = computed(() => Boolean(organizationId.value));
const canWithdraw = computed(() =>
  Boolean(
    organizationId.value &&
    accountMask.value &&
    withdrawWindowOpen.value &&
    summary.availableCents >= 10_000 &&
    amountYuan.value >= 100
  )
);

const money = (v = 0) => `¥${(Number(v) / 100).toFixed(2)}`;
const formatDate = (value: string) => value
  ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

const load = async () => {
  if (!organizationId.value) {
    Object.assign(summary, { pendingCents: 0, availableCents: 0, withdrawnCents: 0, platformFeeCents: 0 });
    accountMask.value = null;
    withdrawals.value = [];
    return;
  }
  loading.value = true;
  errorMessage.value = "";
  try {
    const [finance, profile, rows] = await Promise.all([
      pluginCenterApi.getFinanceSummary(organizationId.value),
      pluginCenterApi.getPayoutProfile(organizationId.value),
      pluginCenterApi.listWithdrawals(organizationId.value)
    ]);
    Object.assign(summary, {
      pendingCents: Number(finance.pendingCents ?? 0),
      availableCents: Number(finance.availableCents ?? 0),
      withdrawnCents: Number(finance.withdrawnCents ?? 0),
      platformFeeCents: Number(finance.platformFeeCents ?? 0)
    });
    accountMask.value = profile.accountMask;
    withdrawals.value = rows;
    const maxYuan = Math.max(100, Math.floor(summary.availableCents / 100));
    if (amountYuan.value > maxYuan) amountYuan.value = maxYuan;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载财务失败";
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  if (!organizationId.value) return;
  if (!recipient.value.trim() || !account.value.trim()) {
    ElMessage.warning("请填写完整收款资料");
    return;
  }
  savingProfile.value = true;
  try {
    const result = await pluginCenterApi.savePayoutProfile(
      organizationId.value,
      account.value.trim(),
      recipient.value.trim()
    );
    accountMask.value = String(result.accountMask ?? accountMask.value ?? "");
    account.value = "";
    recipient.value = "";
    ElMessage.success("收款资料已加密保存");
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    savingProfile.value = false;
  }
};

const withdraw = async () => {
  if (!canWithdraw.value) {
    ElMessage.warning("当前无法提现，请检查窗口、余额与收款资料");
    return;
  }
  const amountCents = Math.round(amountYuan.value * 100);
  if (amountCents > summary.availableCents) {
    ElMessage.warning("超过可提现金额");
    return;
  }
  withdrawing.value = true;
  try {
    await pluginCenterApi.requestWithdrawal(organizationId.value, amountCents);
    ElMessage.success("提现申请已提交");
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "提现失败");
  } finally {
    withdrawing.value = false;
  }
};

onMounted(async () => {
  try {
    const memberships = await pluginCenterApi.listMyMemberships();
    organizations.value = memberships
      .filter(item =>
        ["owner", "maintainer"].includes(String(item.role)) &&
        item.organization?.status === "active"
      )
      .map(item => ({
        id: String(item.organization.id),
        display_name: String(item.organization.display_name)
      }));
    organizationId.value = organizations.value[0]?.id ?? "";
    await load();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载组织失败";
  }
});
</script>

<style scoped lang="scss">
.center-page { padding: 4px; }
.heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
.heading h1 { margin: 10px 0 4px; }
.heading p { color: var(--el-text-color-secondary); }
.gap { margin-top: 12px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
.stats span, .stats strong { display: block; }
.stats strong { font-size: 25px; margin-top: 10px; }
.mask { color: var(--el-text-color-secondary); margin: 0 0 12px; }
.withdraw-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.hints { margin: 12px 0 0; padding-left: 18px; color: var(--el-text-color-secondary); line-height: 1.7; }
.action { margin-left: 0; }
@media (max-width: 800px) {
  .stats { grid-template-columns: 1fr 1fr; }
  .heading { align-items: flex-start; flex-direction: column; }
}
</style>
