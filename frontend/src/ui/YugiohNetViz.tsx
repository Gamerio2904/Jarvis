import { useMemo } from 'react'
import { FEATURE_COUNT, FEATURE_NAMES, type NetModel } from '../engine/yugioh-net.ts'

const WIDTH = 360
const HEIGHT = 300
const LEFT = 56
const MID = 190
const RIGHT = 326

type Props = { model: NetModel | null; training?: boolean }

export function YugiohNetViz({ model, training = false }: Props) {
  const layout = useMemo(() => {
    if (!model || model.hidden === 0) return null
    const { inputs, hidden, params } = model
    const inputY = (i: number) => 14 + (i * (HEIGHT - 28)) / (inputs - 1)
    const hiddenY = (j: number) => 30 + (j * (HEIGHT - 60)) / Math.max(1, hidden - 1)
    const outY = HEIGHT / 2
    const b1 = hidden * inputs
    const w2 = b1 + hidden
    let maxW = 1e-6
    for (let k = 0; k < b1; k += 1) maxW = Math.max(maxW, Math.abs(params[k]))
    let maxOut = 1e-6
    for (let j = 0; j < hidden; j += 1) maxOut = Math.max(maxOut, Math.abs(params[w2 + j]))
    const edges: { key: string; x1: number; y1: number; x2: number; y2: number; w: number; strength: number }[] = []
    for (let j = 0; j < hidden; j += 1) {
      for (let i = 0; i < inputs; i += 1) {
        const w = params[j * inputs + i]
        const strength = Math.abs(w) / maxW
        if (strength > 0.28) edges.push({ key: `a${i}-${j}`, x1: LEFT, y1: inputY(i), x2: MID, y2: hiddenY(j), w, strength })
      }
      const out = params[w2 + j]
      edges.push({ key: `b${j}`, x1: MID, y1: hiddenY(j), x2: RIGHT, y2: outY, w: out, strength: Math.abs(out) / maxOut })
    }
    const importance = Array.from({ length: inputs }, (_, i) => {
      let sum = 0
      for (let j = 0; j < hidden; j += 1) sum += Math.abs(params[j * inputs + i] * params[w2 + j])
      return sum
    })
    const topImportance = Math.max(...importance, 1e-6)
    return { inputY, hiddenY, outY, edges, importance, topImportance, hidden, inputs }
  }, [model])

  if (!model) {
    return <p className="ygo-muted">Noch kein Netz trainiert. Starte das Netz-Labor, um die Gewichte live zu sehen.</p>
  }
  if (!layout) {
    return <p className="ygo-muted">Lineares Modell: keine versteckte Schicht zum Zeichnen.</p>
  }
  const ranked = layout.importance
    .map((value, index) => ({ name: FEATURE_NAMES[index], value: value / layout.topImportance }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <figure className={`ygo-netviz${training ? ' is-training' : ''}`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Neuronales Netz: ${FEATURE_COUNT} Eingaben, ${layout.hidden} versteckte Neuronen, 1 Ausgabe`}>
        <defs>
          <filter id="ygo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {layout.edges.map((edge, index) => (
          <line
            key={edge.key}
            className={`ygo-edge ${edge.w >= 0 ? 'pos' : 'neg'}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            strokeWidth={0.4 + edge.strength * 1.6}
            strokeOpacity={0.12 + edge.strength * 0.7}
            style={{ animationDelay: `${(index % 17) * 90}ms` }}
          />
        ))}
        {Array.from({ length: layout.inputs }, (_, i) => (
          <circle
            key={`in${i}`}
            className="ygo-node in"
            cx={LEFT}
            cy={layout.inputY(i)}
            r={2.4 + (layout.importance[i] / layout.topImportance) * 2.6}
            filter="url(#ygo-glow)"
          />
        ))}
        {Array.from({ length: layout.hidden }, (_, j) => (
          <circle key={`h${j}`} className="ygo-node hid" cx={MID} cy={layout.hiddenY(j)} r={5.4} filter="url(#ygo-glow)" style={{ animationDelay: `${j * 110}ms` }} />
        ))}
        <circle className="ygo-node out" cx={RIGHT} cy={layout.outY} r={9} filter="url(#ygo-glow)" />
        <text x={LEFT} y={HEIGHT - 2} textAnchor="middle" className="ygo-net-label">{layout.inputs} Eingaben</text>
        <text x={MID} y={HEIGHT - 2} textAnchor="middle" className="ygo-net-label">{layout.hidden} Neuronen</text>
        <text x={RIGHT} y={HEIGHT - 2} textAnchor="middle" className="ygo-net-label">Aktions-Score</text>
      </svg>
      <figcaption>
        <span className="ygo-legend pos">positives Gewicht</span>
        <span className="ygo-legend neg">negatives Gewicht</span>
        <div className="ygo-importance">
          {ranked.map((item) => (
            <div key={item.name} className="ygo-importance-row">
              <span>{item.name}</span>
              <i style={{ width: `${Math.max(6, item.value * 100)}%` }} />
            </div>
          ))}
        </div>
      </figcaption>
    </figure>
  )
}
