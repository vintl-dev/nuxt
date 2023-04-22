<script setup lang="ts">
const vintl = useVIntl()
const locale = computed(() => vintl.locale)
</script>

<template>
  <div>{{ locale }}</div>
</template>
