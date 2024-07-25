<script setup lang="ts">
const props = defineProps<{
  type?: 'warning' | 'success' | 'info'
}>()
const alertClass = computed(() =>
  props.type == null ? 'alert-info' : `alert-${props.type}`,
)
</script>
<template>
  <div :class="['alert', alertClass]">
    <slot />
  </div>
</template>
<style lang="css" scoped>
.alert {
  padding: 0.3rem;
  border: 1px solid;
}

.alert-warning {
  border-color: orange;
  background-color: rgba(255, 166, 0, 0.05);
}

.alert-success {
  border-color: green;
  background-color: rgba(0, 128, 0, 0.05);
}

.alert-info {
  border-color: blue;
  background-color: rgba(0, 0, 255, 0.05);
}
</style>
