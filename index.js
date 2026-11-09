import z from '@deepseek-ai/schemastery'

export const Config = z.object({
  provider: z.string().default('').volatile(),
  model: z.string().default('').volatile(),
  endpoint: z.string().default('').volatile(),
})

function resolveTarget(config) {
  const provider = config.provider.get().trim()
  const model = config.model.get().trim()
  const endpoint = config.endpoint.get().trim()
  if (!provider && !model && !endpoint) return undefined

  const target = URL.parse(endpoint)
  if (!provider || !model || !target || !['http:', 'https:'].includes(target.protocol) ||
      target.username || target.password || target.search || target.hash) {
    throw new Error('lan-session-header requires a provider ID, model ID, and HTTP(S) Base URL without credentials, query, or fragment')
  }
  return { provider, model, endpoint: target.href }
}

export function apply(ctx, config) {
  resolveTarget(config)
  ctx.on('internal/config', (fiber, next) => {
    const raw = next()
    if (fiber === ctx.fiber) resolveTarget(Config(raw))
    return raw
  })

  ctx.on('llm-pi-ai/request-headers', (request, headers, next) => {
    const target = resolveTarget(config)
    if (target && request.provider === target.provider &&
        request.model === target.model &&
        URL.parse(request.baseURL)?.href === target.endpoint &&
        request.sessionId) {
      headers.set('x-opencode-session', String(request.sessionId))
    }

    return next()
  })
}
