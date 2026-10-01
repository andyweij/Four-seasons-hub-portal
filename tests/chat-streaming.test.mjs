import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/features/chat/streaming.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
const { readChatEvents } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
const collect = async (text, chunkSize) => {
  const bytes = new TextEncoder().encode(text)
  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize))
      controller.close()
    },
  })
  const events = []
  for await (const event of readChatEvents(stream)) events.push(event)
  return events
}
test('UTF-8 and CRLF frames survive one-byte network chunks', async () => {
  const events = await collect('event: delta\r\ndata: {"type":"delta","content":"搜尋結果"}\r\n\r\ndata: {"type":"done"}\r\n\r\n', 1)
  assert.deepEqual(events, [{ type: 'delta', content: '搜尋結果' }, { type: 'done' }])
})
test('multiline JSON, comments and trailing frame', async () => {
  const events = await collect(': ping\n\ndata: {"type":\ndata: "sources","sources":[]}\n\ndata: {"type":"done"}', 7)
  assert.deepEqual(events, [{ type: 'sources', sources: [] }, { type: 'done' }])
})
test('malformed JSON fails rather than silently marking completion', async () => {
  await assert.rejects(collect('data: broken\n\n', 3), SyntaxError)
})
