<script lang="ts" setup>
import { computed } from 'vue'
import { useVIntl } from '@vintl/vintl'

const messages = defineMessages({
  options: {
    id: 'options',
    defaultMessage: 'Options',
  },
  language: {
    id: 'language',
    defaultMessage: 'Language',
  },
  example: {
    id: 'example',
    defaultMessage: 'Example',
  },
  greeting: {
    id: 'greeting',
    defaultMessage: 'Hello, {name}!',
  },
  otherPage: {
    id: 'index.other-page',
    defaultMessage: 'To the other page',
  },
} as const)

const vintl = useVIntl()
const { formatMessage } = vintl

const currentLocale = computed({
  get() {
    return vintl.locale
  },
  set(_value) {
    // ignore
  },
})

async function onLocaleChange(e: Event) {
  await vintl.changeLocale(
    (e as Event & { target: HTMLSelectElement }).target.value,
  )
}
</script>

<template>
  <div>
    <div>
      <h3>{{ formatMessage(messages.options) }}</h3>
      <label for="language-select">
        {{ formatMessage(messages.language) }}
      </label>
      <select
        id="language-select"
        v-model="currentLocale"
        @change="onLocaleChange"
      >
        <option
          v-for="locale in [...$nuxt.$i18n.$locales.value.keys()]"
          :key="locale.tag"
          :value="locale.tag"
        >
          {{ locale.tag }}
        </option>
      </select>
    </div>

    <div>
      <h3><IntlFormatted :message-id="messages.example" /></h3>
      <div>{{ formatMessage(messages.greeting, { name: 'world' }) }}</div>
    </div>

    <div>
      <NuxtLink to="/other">{{ formatMessage(messages.otherPage) }} →</NuxtLink>
    </div>
  </div>
</template>
