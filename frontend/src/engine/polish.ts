import { brainKind, completeBrain } from './brain.ts'
import { guardPolish } from './polish-guard.ts'

export { guardPolish }

export async function polishToolLine(canned: string, facts = canned): Promise<string> {
  const kind = brainKind()
  if (kind === 'none' || kind === 'local') return canned
  try {
    const r = await completeBrain(
      [
        {
          role: 'system',
          content:
            'Sie formulieren denselben Inhalt in 1–3 kurzen deutschen Sätzen. Keine neuen Zahlen, keine neuen Orte, kein Sir. Nur die Fakten.',
        },
        { role: 'user', content: facts },
      ],
      undefined,
      { maxOutputTokens: 120, timeoutMs: 4000 },
    )
    return guardPolish(facts, r.text)
  } catch {
    return canned
  }
}
