<template>
  <!-- 挂到 body：避免嵌入式布局外壳 backdrop-filter / overflow 导致 fixed 被裁剪或非视口参照 -->
  <Teleport to="body">
    <div
      v-if="globalStore.maximize"
      class="layout-main-maximize-exit"
      @click="handleExitMaximize"
    >
      <el-icon :size="22" class="exit-icon"><Close /></el-icon>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import useGlobalStore from "@/stores/modules/global.ts";

const globalStore = useGlobalStore();

const handleExitMaximize = () => {
  globalStore.setGlobalState("maximize", false);
};
</script>

<style lang="scss" scoped>
.layout-main-maximize-exit {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  html.dark & {
    background: rgba(30, 30, 30, 0.72);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.82);
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 8px 28px rgba(var(--el-color-primary-rgb), 0.22);
    transform: translateY(-2px);

    html.dark & {
      background: rgba(40, 40, 40, 0.82);
    }

    .exit-icon {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.15);
  }

  .exit-icon {
    color: var(--el-text-color-regular);
    transition: all 0.3s ease;
  }
}
</style>
