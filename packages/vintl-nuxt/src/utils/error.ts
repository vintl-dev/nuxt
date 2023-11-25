import fmt from 'picocolors'
import { indent } from './strings.ts'

function getObjectName(object: unknown) {
  if (object == null) return `<${String(object)}>`

  if (typeof object === 'function') {
    return object.name === '' ? '(anonymous)' : object.name
  }

  const constructor = Object.getPrototypeOf(object)?.constructor

  if (typeof constructor === 'function') return constructor.name

  return '<unknown>'
}

export const specialErrorMessage = Symbol('specialErrorMessage')

export interface ErrorWithSpecialMessage {
  [specialErrorMessage]: string | (() => string)
}

function hasSpecialMessage<T extends Error>(
  error: T,
): error is T & ErrorWithSpecialMessage {
  return (
    specialErrorMessage in error &&
    (typeof error[specialErrorMessage] === 'function' ||
      typeof error[specialErrorMessage] === 'string')
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (hasSpecialMessage(error)) {
      if (typeof error[specialErrorMessage] === 'function') {
        return String(error[specialErrorMessage]())
      } else {
        return error[specialErrorMessage]
      }
    }

    if (error.message.length === 0) {
      return fmt.gray('<no message>')
    }

    return error.message
  }

  return String(error)
}

function getCause(error: unknown) {
  if (error instanceof Error) return error.cause
}

function getCausationSummary(error: unknown) {
  const visitedCauses = new Set<unknown>()

  let currentCause = getCause(error)

  if (currentCause == null) return ''

  const summaries: string[] = []

  while (currentCause != null) {
    if (visitedCauses.has(currentCause)) break
    visitedCauses.add(currentCause)

    summaries.push(
      `... Caused by ${indent(getErrorSummary(currentCause), 4).trim()}`,
    )

    currentCause = getCause(currentCause)
  }

  return summaries.join('\n')
}

function getAggregatedSummary(error: AggregateError) {
  if (error.errors.length === 0) return ''

  const summaries: string[] = []

  for (const aggregatedError of error.errors) {
    summaries.push(`- ${indent(getErrorSummary(aggregatedError), 2).trim()}`)
  }

  return `${fmt.yellow('Aggregated errors:')}\n${summaries.join('\n')}`
}

export function getErrorSummary(error: unknown) {
  let summary = `${fmt.red(getObjectName(error))}: `
  summary += indent(getErrorMessage(error), 2).trim()

  if (error instanceof AggregateError) {
    const aggregatedSummary = getAggregatedSummary(error)
    if (aggregatedSummary.length !== 0) {
      summary += `\n${indent(aggregatedSummary, 2)}`
    }
  }

  if (error instanceof Error) {
    const causationSummary = getCausationSummary(error)
    if (causationSummary.length >= 0) {
      summary += `\n${indent(causationSummary, 2)}`
    }
  }

  return summary
}
