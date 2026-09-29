export const TISCHPLATTE_VIEWS = ['sprints', 'psp', 'modules', 'sim', 'research'] as const
export type TischplatteView = (typeof TISCHPLATTE_VIEWS)[number]

export function isTischplatteView(v: string): v is TischplatteView {
  return (TISCHPLATTE_VIEWS as readonly string[]).includes(v)
}
