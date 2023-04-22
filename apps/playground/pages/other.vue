<script setup lang="ts">
const messages = defineMessages({
  title: {
    id: 'other-page.title',
    defaultMessage: 'Hello from the other page!',
  },
  description: {
    id: 'other-page.description',
    defaultMessage: "You must've clicked me a thousand times",
  },
  goBack: {
    id: 'other-page.back',
    defaultMessage: 'Go back',
  },
})

const { formatMessage } = useVIntl()
</script>

<template>
  <div>
    <h1>{{ formatMessage(messages.title) }}</h1>
    <p>{{ formatMessage(messages.description) }}</p>
    <p>
      <NuxtLink to="/">← {{ formatMessage(messages.goBack) }}</NuxtLink>
    </p>
  </div>
</template>
