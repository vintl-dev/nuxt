import type { MessagesMap, Locale } from '@vintl/vintl'

type ResourcesMap = keyof Locale['resources'] extends never
  ? Record<string, unknown>
  : Locale['resources']

type ResourceMapKey = keyof ResourcesMap extends never
  ? string
  : keyof ResourcesMap

type ResourceMapProp<K extends ResourceMapKey> = K extends keyof ResourcesMap
  ? ResourcesMap[K]
  : unknown

const rawValue = Symbol('v')

interface RawValue<T> {
  [rawValue]: T
}

export function raw<T>(value: T) {
  return {
    [rawValue]: value,
  } as RawValue<T>
}

function isRaw<T>(value: unknown): value is RawValue<T> {
  return value != null && typeof value === 'object' && rawValue in value
}

interface LocaleImport {
  messages: MessagesMap
  resources: ResourcesMap
}

// eslint-disable-next-line prefer-const
let defaultExport = 'default'

export function locale() {
  // eslint-disable-next-line prefer-const
  let messages: Partial<MessagesMap>[] = []
  // eslint-disable-next-line prefer-const
  let allRequests: PromiseLike<unknown>[] = []
  // eslint-disable-next-line prefer-const
  let resources: ResourcesMap = Object.create(null)

  type ThenArgs = Parameters<PromiseLike<LocaleImport>['then']>

  return {
    m(
      messagesImport:
        | PromiseLike<Record<string, MessagesMap>>
        | RawValue<MessagesMap>,
      importProperty = defaultExport,
    ) {
      // eslint-disable-next-line prefer-const
      let id = messages.length

      if (isRaw(messagesImport)) {
        messages[id] = messagesImport[rawValue]
      } else {
        allRequests.push(
          messagesImport.then((imported) => {
            messages[id] = imported[importProperty]
          }),
        )
      }
    },
    r<R extends ResourceMapKey>(
      resourceName: R,
      resourceImport:
        | PromiseLike<Record<string, ResourceMapProp<R>>>
        | RawValue<ResourceMapProp<R>>,
      importProperty = defaultExport,
    ) {
      if (isRaw(resourceImport)) {
        resources[resourceName] = resourceImport[rawValue]
      } else {
        allRequests.push(
          resourceImport.then((imported) => {
            resources[resourceName] = imported[importProperty]
          }),
        )
      }
    },
    i(importReturn: PromiseLike<unknown>) {
      allRequests.push(importReturn)
    },
    then(onFulfilled: ThenArgs[0], onRejected: ThenArgs[1]) {
      return Promise.all(allRequests).then(
        () =>
          onFulfilled?.({
            messages: messages.reduce(
              (current, value) => Object.assign(current, value),
              Object.create(null),
            ),
            resources,
          }),
        onRejected,
      )
    },
  }
}
