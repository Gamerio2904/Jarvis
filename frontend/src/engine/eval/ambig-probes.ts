/**
 * Absichtlich mehrdeutige Alltagssätze. Kein Korpus mit Erwartung — hier gibt
 * es keine richtige Antwort, das ist der Punkt.
 *
 * Sprint 257 sollte den Fall „zwei Agenten stehen gleich" mit Ähnlichkeit
 * auflösen. Bevor dafür ein Modell geladen wird, muss belegt sein, dass dieser
 * Fall überhaupt eintritt. Diese Sätze sind der Versuch, ihn zu erzwingen:
 * Pro-Formen ohne Bezug („mach das an"), Sätze mit zwei Domänen im Satz,
 * Verben, die mehrere Agenten teilen.
 */
export const AMBIG_PROBES: string[] = [
  'mach das an',
  'mach das aus',
  'schalt das mal an',
  'stell das an',
  'mach es lauter',
  'mach an',
  'mach lauter',
  'mach das licht und den fernseher an',
  'erinnere mich an den film heute abend',
  'setz das auf die liste',
  'wie sieht es morgen aus',
  'was läuft heute',
  'mach mir eine notiz für morgen um acht',
  'wecker für den film',
  'sag mir was zum wetter in berlin und mach den fernseher an',
  'zeig mir die karte',
  'wie weit ist es',
  'was kostet das',
  'timer für den kuchen stellen',
  'stell das auf acht',
  'mach den fernseher an und erinnere mich in zehn minuten',
  'was ist mit dem termin und dem wetter',
  'spiel was',
  'mach die musik leiser und das licht aus',
]
