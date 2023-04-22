import type { NuxtHooks } from '@nuxt/schema'
type Manifest = Parameters<NuxtHooks['build:manifest']>[0]

function purgeResourceTree(manifest: Manifest, resourceName: string) {
  const resource = manifest[resourceName]
  if (resource == null) return

  delete manifest[resourceName]

  if (resource.dynamicImports != null) {
    for (const childResourceName of resource.dynamicImports) {
      purgeResourceTree(manifest, childResourceName)
    }
  }
}

export function purgeEntryResources(
  manifest: Manifest,
  resourcesToPurge: string[],
) {
  let entryResource: Manifest[string] | undefined

  for (const resourceName in manifest) {
    const resource = manifest[resourceName]
    if (resource != null && (resource.isEntry ?? false)) {
      entryResource = resource
      break
    }
  }

  if (entryResource == null) return

  if (entryResource.dynamicImports == null) return

  const purgableResources: string[] = []

  for (const resourceName of entryResource.dynamicImports) {
    if (resourcesToPurge.includes(resourceName)) {
      purgableResources.push(resourceName)
    }
  }

  for (const resourceName of purgableResources) {
    const entryIndex = entryResource.dynamicImports.indexOf(resourceName)
    if (entryIndex !== -1) entryResource.dynamicImports.splice(entryIndex, 1)
    purgeResourceTree(manifest, resourceName)
  }
}
