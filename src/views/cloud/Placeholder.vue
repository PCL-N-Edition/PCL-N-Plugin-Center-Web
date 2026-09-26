<template>
  <section class="placeholder-view" :aria-labelledby="`placeholder-${eyebrow}`">
    <p class="eyebrow">{{ eyebrow }}</p><h1 :id="`placeholder-${eyebrow}`">{{ title }}</h1>
    <p v-if="description" class="hero-description">{{ description }}</p>
  </section>
</template>
<script setup lang="ts">
defineProps<{ title: string; eyebrow: string; description: string }>();
</script>
