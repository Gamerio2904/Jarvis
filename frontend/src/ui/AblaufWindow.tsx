import { useEffect, useState } from 'react'
import { agentLabel, type Ablauf, type AblaufCard } from '../engine/ablauf.ts'

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function AblaufWindow({
  plan,
  empty,
  onSo,
}: {
  plan: Ablauf | null
  empty: boolean
  onSo: () => void
}) {
  const [shownWork, setShownWork] = useState(0)
  const [shownCards, setShownCards] = useState(0)
  const [strike, setStrike] = useState(true)
  const cards: AblaufCard[] = plan ? plan.waves.flatMap((w) => w.cards) : []
  const writing = plan ? shownWork < plan.work.length || shownCards < cards.length : false
  const status = empty ? 'warten' : writing ? 'schreibt' : plan?.status || 'warten'

  useEffect(() => {
    if (!plan) return
    const touched = plan.waves.some((w) => w.cards.some((c) => c.state !== 'vorgeschlagen'))
    if (touched || reducedMotion() || plan.status === 'läuft' || plan.status === 'fertig') {
      setShownWork(plan.work.length)
      setShownCards(cards.length)
      return
    }
    setShownWork(0)
    setShownCards(0)
    let work = 0
    let card = 0
    let timer = 0
    const step = () => {
      if (work < plan.work.length) {
        work += 1
        setShownWork(work)
        timer = window.setTimeout(step, 180)
        return
      }
      if (card < cards.length) {
        card += 1
        setShownCards(card)
        timer = window.setTimeout(step, 80)
      }
    }
    timer = window.setTimeout(step, 180)
    return () => window.clearTimeout(timer)
    // Die Zeilen gehören zu dieser Fassung. Ein neues updated_at schreibt neu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, plan?.updated_at])

  useEffect(() => {
    setStrike(true)
    const id = window.setTimeout(() => setStrike(false), 400)
    return () => window.clearTimeout(id)
  }, [plan?.updated_at])

  const head = status === 'schreibt' ? 'schreibt' : status === 'läuft' ? 'läuft' : status === 'überarbeitet' ? 'überarbeitet' : 'warten'

  return (
    <section className={`ablauf-window${reducedMotion() ? ' is-still' : ''}`} aria-label="Ablauf">
      <header className="ablauf-head">
        <p>Ablauf</p>
        <h2>{plan?.title || 'Ablauf'}</h2>
        <span>{head}</span>
      </header>
      <div className="ablauf-cols">
        <div>
          <h3>Arbeit</h3>
          <ul>
            {plan?.work.slice(0, shownWork).map((line, i) => (
              <li key={`${line}-${i}`} className={i === shownWork - 1 && shownWork < (plan?.work.length || 0) ? 'is-caret' : ''}>
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Wer</h3>
          {empty ? (
            <p>Kein Ablauf. Der Text nennt keine konkrete Arbeit.</p>
          ) : !plan ? null : (
            plan.waves.map((wave) => {
              const before = plan.waves.slice(0, plan.waves.indexOf(wave)).reduce((n, w) => n + w.cards.length, 0)
              const visible = wave.cards.filter((_, i) => before + i < shownCards)
              if (!visible.length && shownCards <= before) return null
              return (
                <div key={wave.n} className="ablauf-wave">
                  <p>{wave.n === 1 ? 'Gleichzeitig' : 'Danach'}</p>
                  <ul>
                    {visible.map((card) => (
                      <li key={card.n} className={card.state === 'läuft' ? 'is-run' : card.state === 'geändert' ? 'is-changed' : ''}>
                        <strong>{agentLabel(card.agent)}</strong>
                        {card.state === 'geändert' && card.was && strike ? <s>{card.was}</s> : null}
                        <span>{card.task}</span>
                        {card.state === 'geändert' ? <small>geändert</small> : null}
                        {card.state === 'läuft' ? <i /> : null}
                        {card.result ? <em>{card.result}</em> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}
          {plan?.gray.length ? (
            <ul className="ablauf-gray">
              {plan.gray.map((card) => (
                <li key={`${card.agent}-${card.task}`}>{card.agent}: {card.task}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {empty || !plan || writing || plan.status === 'läuft' || plan.status === 'leer' ? null : (
        <footer>
          <button type="button" className="ablauf-so" onClick={onSo}>
            So
          </button>
          <p>Sag, was anders sein soll.</p>
        </footer>
      )}
    </section>
  )
}
