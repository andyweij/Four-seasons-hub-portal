import type { StreamDeltaEvent } from '../../types'

/** Fetch chunks may split frames, lines, or UTF-8 characters. */
export async function* readChatEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamDeltaEvent> {
  const reader = body.getReader(), decoder = new TextDecoder()
  let buffer = ''
  let data: string[] = []
  const consume = (line: string): StreamDeltaEvent | undefined => {
    if (line === '') {
      if (!data.length) return undefined
      const text = data.join('\n')
      data = []
      return text === '[DONE]' ? undefined : JSON.parse(text) as StreamDeltaEvent
    }
    if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
    return undefined
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      if (buffer.length + data.join('').length > 2_000_000) throw new Error('SSE frame too large')
      let end: number
      while ((end = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, end).replace(/\r$/, '')
        buffer = buffer.slice(end + 1)
        const event = consume(line)
        if (event) yield event
      }
      if (done) break
    }
    if (buffer) { const event = consume(buffer.replace(/\r$/, '')); if (event) yield event }
    const final = consume('')
    if (final) yield final
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
