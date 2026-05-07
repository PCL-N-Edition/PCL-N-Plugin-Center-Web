<template>
  <div class="koi-shell-header-actions">
    <el-tooltip :content="$t('button.minimize')" placement="bottom">
      <button type="button" class="koi-toolbar-btn" @click="$emit('minimize')">
        <el-icon><Minus /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip :content="isFullscreen ? $t('header.exitFullScreen') : $t('header.fullScreen')" placement="bottom">
      <button type="button" class="koi-toolbar-btn" @click="$emit('toggleFullscreen')">
        <el-icon v-if="!isFullscreen"><FullScreen /></el-icon>
        <el-icon v-else><Aim /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip :content="$t('button.close')" placement="bottom">
      <button type="button" class="koi-toolbar-btn" @click="$emit('close')">
        <el-icon><Close /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { Minus, FullScreen, Aim, Close } from "@element-plus/icons-vue";

defineProps<{
  isFullscreen: boolean;
}>();

defineEmits<{
  minimize: [];
  toggleFullscreen: [];
  close: [];
}>();
</script>

<style lang="scss" scoped>
.koi-shell-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

.koi-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  transition: all 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color));
    background: color-mix(in srgb, var(--el-color-primary-light-9) 78%, var(--el-fill-color-light));
  }

  &:active {
    transform: scale(0.96);
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}
</style>
