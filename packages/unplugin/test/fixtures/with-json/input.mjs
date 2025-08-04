import options from './options.json'
import messages from './en.messages.json'

const messageTypes = [
  [0, 'greeting'],
  [1, 'goodbye'],
]

export default function example() {
  const messageId = messageTypes.find(([type]) => options.type === type)
  if (messageId == null) throw new Error(`Unknown type ${options.type}`)
  return messages[messageId]
}
