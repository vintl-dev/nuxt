<script setup lang="ts">
const vintl = useVIntl()
const switching = ref(false)
const activeLocale = computed({
  get() {
    return vintl.locale
  },
  set(value) {
    if (switching.value) return
    switching.value = true
    vintl.changeLocale(value).finally(() => {
      switching.value = false
    })
  },
})
</script>

<template>
  <div>
    <label>
      Locale:
      <select v-model="activeLocale" :disabled="switching">
        <option v-for="locale in vintl.availableLocales" :key="locale.tag">
          {{ locale.tag }}
        </option>
      </select>
    </label>
  </div>
</template>
