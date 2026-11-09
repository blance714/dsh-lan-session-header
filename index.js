export function apply(ctx, { provider, model, endpoint } = {}) {
  if (provider === undefined && model === undefined && endpoint === undefined) return

  const target = typeof endpoint === 'string' ? URL.parse(endpoint) : null
  if (typeof provider !== 'string' || !provider.trim() ||
      typeof model !== 'string' || !model.trim() ||
      !target || !['http:', 'https:'].includes(target.protocol) ||
      target.username || target.password || target.search || target.hash) {
    throw new Error('lan-session-header requires a provider ID, model ID, and HTTP(S) Base URL without credentials, query, or fragment')
  }

  ctx.on('llm-pi-ai/request-headers', (request, headers, next) => {
    if (request.provider === provider &&
        request.model === model &&
        URL.parse(request.baseURL)?.href === target.href &&
        request.sessionId) {
      headers.set('x-opencode-session', String(request.sessionId))
    }

    return next()
  })
}
