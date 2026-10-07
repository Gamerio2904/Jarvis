export type PlanQuestion = {
  id: string
  ideaId: string
  conversationId: string
  requirementId: string
  question: string
  createdAt: number
}

export const PLAN_QUESTION_TTL_MS = 24 * 60 * 60 * 1000

export function parsePlanQuestion(raw: string, now = Date.now()): PlanQuestion | null {
  if (!raw) return null
  try {
    const row = JSON.parse(raw) as Partial<PlanQuestion>
    if (
      !row.id ||
      !row.ideaId ||
      !row.conversationId ||
      !row.requirementId ||
      !row.question ||
      typeof row.createdAt !== 'number' ||
      now - row.createdAt > PLAN_QUESTION_TTL_MS
    ) {
      return null
    }
    return row as PlanQuestion
  } catch {
    return null
  }
}

export function serializePlanQuestion(question: PlanQuestion | null): string {
  return question ? JSON.stringify(question) : ''
}

export function isTooShortPlanAnswer(text: string): boolean {
  const value = text.replace(/[.!?]+$/g, '').trim()
  return value.length < 4 || /^(?:ja|nein|ok|okay|passt|so|stopp|abbrechen)$/i.test(value)
}
