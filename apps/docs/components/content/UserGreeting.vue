<script setup lang="ts">
const messages = defineMessages({
  greeting: {
    id: 'personal-greeting',
    defaultMessage: 'Hello, <bold>{name}</bold>! {waving_hand}',
  },
})

const user = {
  displayName: 'John',
}
</script>

<template>
  <div>
    <IntlFormatted
      :message-id="messages.greeting"
      :values="{ name: user.displayName }"
    >
      <template #bold="{ children }">
        <strong><component :is="() => children" /></strong>
      </template>
      <template #~waving_hand><Icon name="noto:waving-hand" /></template>
    </IntlFormatted>
  </div>
</template>
