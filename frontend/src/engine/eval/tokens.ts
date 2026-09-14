/**
 * Grobe Token-Schätzung ohne Tokenizer-Abhängigkeit.
 *
 * Das ist **keine** BPE-Zerlegung. Ein echter Tokenizer wäre eine Abhängigkeit
 * im Bundle, und die Zahl wird hier nur relativ gebraucht: „darf nicht
 * wachsen". Für diesen Zweck genügt eine konsistente Schätzung.
 *
 * Kalibriert auf Deutsch: Komposita und Umlaute zerfallen bei BPE in mehr
 * Stücke als englischer Text, deshalb liegt der Teiler unter den sonst
 * üblichen vier Zeichen pro Token
 * (siehe `docs/69-modell-grundlagen.md` §1.1).
 */
const CHARS_PER_TOKEN_DE = 3.3

export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / CHARS_PER_TOKEN_DE)
}

export type PromptBudget = {
  /** Fester Vorspann — wird von Groq und Gemini gecacht. */
  systemTokens: number
  /** Wechselnder Teil am letzten Nutzerzug — nie gecacht. */
  variableTokens: number
  totalTokens: number
  /**
   * Anteil, der gecacht werden **kann**. Gecachte Eingabe-Tokens zählen nicht
   * auf Groqs Rate-Limits an — ein guter Schnitt kauft Tagesbudget.
   */
  cacheableRatio: number
}

export function promptBudget(system: string, variable: string): PromptBudget {
  const s = estimateTokens(system)
  const v = estimateTokens(variable)
  const total = s + v
  return {
    systemTokens: s,
    variableTokens: v,
    totalTokens: total,
    cacheableRatio: total ? s / total : 0,
  }
}
