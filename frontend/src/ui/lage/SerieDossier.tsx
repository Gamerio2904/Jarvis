import { staffelFolge } from '../../engine/rm-graph.ts'
import type { RmDossier, RmEdgeKind } from '../../engine/rm-types.ts'

const KIND_DE: Record<RmEdgeKind, string> = {
  family: 'Familie',
  ally: 'Verbündet',
  enemy: 'Gegner',
  partner: 'Beziehung',
  coappear: 'Gemeinsame Folge',
}

export function SerieDossier({
  card,
  onClose,
  onNeighbor,
  onChat,
}: {
  card: RmDossier
  onClose: () => void
  onNeighbor: (id: number) => void
  onChat: (name: string) => void
}) {
  const named = card.neighbors.filter((n) => n.kind !== 'coappear').slice(0, 10)
  const also = card.neighbors.filter((n) => n.kind === 'coappear').slice(0, 8)
  return (
    <div className="pin-bubble serie-dossier" role="dialog" aria-labelledby="serie-dossier-title" aria-modal="true">
      <div className="pin-bubble-head">
        <h3 id="serie-dossier-title">{card.name}</h3>
        <button type="button" className="pin-bubble-x" onClick={onClose} aria-label="Schließen">
          ×
        </button>
      </div>
      <figure className="serie-dossier-photo">
        <img src={card.image} alt={card.name} width={300} height={300} />
      </figure>
      <ul className="serie-dossier-traits">
        {card.traits.map((t) => (
          <li key={t.label}>
            <span>{t.label}</span> {t.value}
          </li>
        ))}
      </ul>
      <h4>Fähigkeiten</h4>
      {card.skills.length ? (
        <ul className="serie-dossier-skills">
          {card.skills.map((s) => (
            <li key={`${s.name}-${s.evidence.code}`}>
              <strong>{s.name}</strong>
              <span>
                {staffelFolge(s.evidence.code)} · {s.evidence.code} {s.evidence.title}
              </span>
              <em>{s.evidence.note}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lage-body">Keine kuratierte Fähigkeit — nur API-Steckbrief und Auftritte.</p>
      )}
      <h4>Folgen ({card.appearanceCount})</h4>
      <p className="serie-dossier-eps">
        {card.appearances
          .slice(0, 8)
          .map((a) => `${staffelFolge(a.code)} (${a.code})`)
          .join(' · ')}
        {card.appearanceCount > 8 ? ` · +${card.appearanceCount - 8}` : ''}
      </p>
      {named.length ? (
        <>
          <h4>Verbindungen</h4>
          <div className="serie-dossier-links">
            {named.map((n) => (
              <button key={n.id} type="button" className="lage-chip" onClick={() => onNeighbor(n.id)}>
                {n.name} · {KIND_DE[n.kind]}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {also.length ? (
        <p className="pin-bubble-swipe">
          Dazu Auftritte mit{' '}
          {also.map((n) => n.name).join(', ')}
          {card.neighbors.length > named.length + also.length ? ' …' : ''}
        </p>
      ) : null}
      <p className="pin-bubble-swipe">
        Belegt über die Rick-and-Morty-API ({card.coverage}). TV-Kanon, nicht Comics. Staffel 6+ fehlt in der
        offenen API.
      </p>
      <div className="pin-bubble-actions">
        <button type="button" className="lage-btn" onClick={onClose}>
          Schließen
        </button>
        <button type="button" className="lage-btn" onClick={() => onChat(card.name)}>
          Im Chat
        </button>
      </div>
    </div>
  )
}
