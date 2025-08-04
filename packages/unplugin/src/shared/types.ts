/**
 * A filter function that accepts a module ID as an input and returns a boolean
 * value indicating whether the module should be processed by the plugin.
 *
 * @param id The ID of the module.
 * @returns Whether the module should be processed by the plugin.
 */
export type FilterFunction = (id: string) => boolean

/** Represents a warning. */
interface WarningEntry {
  /** Code that warning is identified by. */
  code: string

  /** Message of warning. */
  message: string
}

/**
 * A function that accepts a warning object as an input and writes a warning to
 * the logger of the bundler.
 *
 * @param entry The warning object.
 */
export type WarningFunction = (entry: WarningEntry) => void
