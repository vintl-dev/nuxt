import type { HookCallback } from 'hookable'

/**
 * Calls all the hooks in synchronous, sequential manner.
 *
 * @param hooks An array of hooks to call.
 * @param arguments_ Arguments to call hooks with.
 */
export function syncCaller(
  hooks: HookCallback[],
  arguments_?: unknown[],
): void {
  for (const hook of hooks) hook(arguments_)
}
