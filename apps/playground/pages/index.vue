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
  useAutomatic: {
    id: 'index.use-automatic',
    defaultMessage: 'Use automatic',
  },
  brokenMessage: {
    id: 'broken-message',
    defaultMessage: 'This is {broken, }'
  },
} as const)

const vintl = useVIntl()
const { formatMessage } = vintl

const changing = ref(false)

async function changeLocale(locale: string) {
  if (changing.value) return
  changing.value = true
  try {
    await vintl.changeLocale(locale)
  } catch (err) {
    console.error('Error changing locale', err)
  } finally {
    changing.value = false
  }
}

const noop = () => {}

const currentLocale = computed({
  get() {
    return vintl.locale
  },
  set(value) {
    changeLocale(value).then(noop, noop)
  },
})

const useAutomatic = computed({
  get() {
    return vintl.automatic
  },
  set(value) {
    changeLocale(value ? 'auto' : vintl.locale).then(noop, noop)
  },
})
</script>

<template>
  <div>
    <div>
      <h3>{{ formatMessage(messages.options) }}</h3>
      <div>
        <label>
          <input v-model="useAutomatic" type="checkbox" />
          {{ formatMessage(messages.useAutomatic) }}
        </label>
      </div>

      <div>
        <label>
          {{ formatMessage(messages.language) }}
          <select
            id="language-select"
            v-model="currentLocale"
            :disabled="vintl.automatic"
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
        </label>
      </div>
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
