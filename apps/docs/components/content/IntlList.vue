<script setup lang="ts">
const { formats: fmt } = useVIntl()

const props = defineProps<{
  items: string[]
  type?: 'conjunction' | 'disjunction' | 'unit'
}>()

const list = computed(() => fmt.list(props.items, { type: props.type }))
</script>

<template>{{ list }}</template>
