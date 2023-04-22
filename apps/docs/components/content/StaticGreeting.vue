<script setup lang="ts">
const { formatMessage } = useVIntl()

const greeting = defineMessage({
  id: 'greeting',
  defaultMessage: 'Hello, {name}!',
})
</script>

<template>
  <div>{{ formatMessage(greeting, { name: 'Alex' }) }}</div>
</template>
