window.__ModuleLoader__.load({
  id: 'dsh-lan-session-header',
  factory(require) {
    const { createElement: h, useState, useSyncExternalStore } = require('react')
    const fields = [
      ['provider', 'Provider ID'],
      ['model', 'Model ID'],
      ['endpoint', 'Base URL'],
    ]

    function RouteForm({ form }) {
      const snapshot = useSyncExternalStore(
        (listener) => form.subscribe(listener),
        () => form.getSnapshot(),
      )
      const [draft, setDraft] = useState(null)
      const [saving, setSaving] = useState(false)
      const [message, setMessage] = useState('')
      if (snapshot.status !== 'ready') return h('p', null, 'Route settings are unavailable.')

      const values = draft?.values ?? snapshot.value ?? {}
      async function save(event) {
        event.preventDefault()
        if (!draft || saving) return
        const entries = fields.map(([field]) => [field, (values[field] ?? '').trim()])
        const count = entries.filter(([, value]) => value).length
        if (count !== 0 && count !== fields.length) {
          setMessage('Fill in all three fields, or clear all three to turn off header injection.')
          return
        }

        setSaving(true)
        setMessage('')
        try {
          const saved = await form.mutate(entries.map(([field, value]) => ({
            op: 'set', path: [field], value,
          })), draft.revision)
          if (saved) {
            setDraft(null)
            setMessage('Saved. The change applies to the next request.')
          } else {
            setMessage('Save refused. Check the Base URL or discard edits to reload the current values.')
          }
        } catch {
          setMessage('Could not reach the Harness host. Your edits are still here.')
        } finally {
          setSaving(false)
        }
      }

      return h('form', { onSubmit: save, style: { display: 'grid', gap: '0.75rem' } },
        h('h3', null, 'Session header route'),
        ...fields.map(([field, label]) => h('label', {
          key: field, style: { display: 'grid', gap: '0.25rem' },
        }, label, h('input', {
          type: field === 'endpoint' ? 'url' : 'text',
          value: values[field] ?? '',
          disabled: !snapshot.writable || saving,
          onChange: (event) => {
            setMessage('')
            setDraft({ values: { ...values, [field]: event.target.value }, revision: draft?.revision ?? snapshot.revision })
          },
        }))),
        h('div', { style: { display: 'flex', gap: '0.5rem' } },
          h('button', { type: 'submit', disabled: !snapshot.writable || !draft || saving }, 'Save route'),
          h('button', { type: 'button', disabled: !draft || saving, onClick: () => {
            setDraft(null)
            setMessage('')
          } }, 'Discard edits')),
        h('p', { role: 'status' }, message || (snapshot.writable ? '' : 'The active profile is read-only.')),
      )
    }

    return {
      inject: ['slots', 'configForms'],
      apply(ctx) {
        const namespace = 'lan-session-header'
        const slot = 'plugins.bundle.config'
        const form = ctx.configForms.get(namespace)
        ctx.effect(() => ctx.configForms.whileServed([namespace], () => ctx.slots.inject(slot, () =>
          ctx.slots.register({ name: slot, key: 'dsh-lan-session-header', inject: () => ({ form }) }, RouteForm),
        )))
      },
    }
  },
})
