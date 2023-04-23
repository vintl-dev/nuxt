<script setup lang="ts">
const { config } = useDocus()
const titleTemplate = computed(() => config.value.title)
watch(titleTemplate, (v) => useHead({ titleTemplate: v }), { immediate: true })
</script>

<template>
  <NuxtLayout name="page">
    <slot />
  </NuxtLayout>
</template>
