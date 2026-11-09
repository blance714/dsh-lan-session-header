import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply } from './index.js'

const provider = 'custom-provider'
const model = 'example-model'
const endpoint = 'http://127.0.0.1:8318'
let prepareHeaders

apply({
  on(event, listener) {
    assert.equal(event, 'llm-pi-ai/request-headers')
    prepareHeaders = listener
  },
}, { provider, model, endpoint })

function dispatch(overrides = {}, initialHeaders = {}) {
  const headers = new Headers(initialHeaders)
  const request = { provider, model, baseURL: `${endpoint}/`, sessionId: 'session-one', ...overrides }
  let nextCalls = 0
  const result = prepareHeaders(request, headers, () => {
    nextCalls++
    return headers
  })
  assert.equal(nextCalls, 1)
  assert.equal(result, headers)
  return headers
}

test('uses the current session ID on each matching request', () => {
  const initial = { 'x-opencode-session': 'old-static-value', 'x-api-key': 'fixture' }
  const first = dispatch({}, initial)
  assert.equal(first.get('x-opencode-session'), 'session-one')
  assert.equal(first.get('x-api-key'), 'fixture')
  assert.equal(dispatch().get('x-opencode-session'), 'session-one')
  assert.equal(dispatch({ sessionId: 'session-two' }).get('x-opencode-session'), 'session-two')
  assert.equal(first.get('x-opencode-session'), 'session-one')
})

test('leaves other providers, models, endpoints and sessionless calls untouched', () => {
  for (const overrides of [
    { provider: 'other' },
    { model: 'other' },
    { baseURL: 'http://127.0.0.1:8317' },
    { baseURL: `${endpoint}/other` },
    { baseURL: 'invalid' },
    { sessionId: undefined },
  ]) {
    assert.equal(dispatch(overrides).has('x-opencode-session'), false)
  }
})

test('requires explicit opt-in and rejects incomplete or invalid targets', () => {
  const ctx = { on: () => assert.fail('unexpected listener') }
  apply(ctx, {})
  assert.throws(() => apply(ctx, { provider, model }), /requires a provider ID/)
  assert.throws(() => apply(ctx, { provider, model, endpoint: 'file:///tmp' }), /HTTP\(S\)/)
  assert.throws(() => apply(ctx, { provider, model, endpoint: 'https://example.com/?token=value' }), /HTTP\(S\)/)
})
