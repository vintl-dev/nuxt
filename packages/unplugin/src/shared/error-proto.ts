export interface BaseErrorOptions {
  /** Cause of error. */
  cause?: unknown
}

export class BaseError extends Error {
  public constructor(message: string, options: BaseErrorOptions = {}) {
    super(message)

    if ('cause' in options && !('cause' in this)) {
      this.cause = options.cause
    }
  }

  public get stack() {
    const knownCauses: unknown[] = []

    function processError(error: unknown) {
      if (error instanceof Error) {
        const { cause } = error

        if (cause != null && !knownCauses.includes(cause)) {
          knownCauses.push(cause)
          processError(cause)
        }
      }
    }

    processError(this)

    let message = super.stack ?? `${this.name}: ${this.cause}`

    if (knownCauses.length > 0) {
      for (const cause of knownCauses) {
        message += `\nCaused by ${
          cause instanceof Error ? cause.stack : String(cause)
        }`
      }
    }

    return message
  }
}
