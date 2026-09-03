import { useEffect, useState } from 'react'
import { childrenOf, type BodyGraph, type BodyTreeNode } from '../../engine/body-graph'

export function BodyTree({
  graph,
  onPrompt,
}: {
  graph: BodyGraph
  onPrompt: (text: string) => void
}) {
  const root = graph.nodes.find((n) => n.parent === null)
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(graph.nodes.filter((n) => n.depth <= 1).map((n) => [n.id, true])),
  )
  useEffect(() => {
    setOpen(Object.fromEntries(graph.nodes.filter((n) => n.depth <= 1).map((n) => [n.id, true])))
  }, [graph.organ, graph.query, graph.nodes.length])

  function toggle(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }))
  }

  function Row({ node }: { node: BodyTreeNode }) {
    const kids = childrenOf(graph, node.id)
    const shown = open[node.id] !== false || node.depth === 0
    return (
      <li className={`body-tree-item is-${node.kind}${node.live ? ' is-live' : ''}`}>
        <div className="body-tree-row">
          {kids.length ? (
            <button type="button" className="body-tree-toggle" onClick={() => toggle(node.id)} aria-expanded={shown}>
              {shown ? '▾' : '▸'}
            </button>
          ) : (
            <span className="body-tree-toggle is-leaf" />
          )}
          <div className="body-tree-copy">
            <strong>{node.kind === 'organ' ? 'Eingang' : node.label}</strong>
            <span>{node.line || '—'}</span>
          </div>
          {node.prompt ? (
            <button type="button" className="lage-btn" onClick={() => onPrompt(node.prompt!)}>
              Chat
            </button>
          ) : null}
        </div>
        {shown && kids.length ? (
          <ul className="body-tree-kids">
            {kids.map((k) => (
              <Row key={k.id} node={k} />
            ))}
          </ul>
        ) : null}
      </li>
    )
  }

  return (
    <nav className="body-tree" aria-label="Wissensbaum">
      <p className="lage-hint">
        {graph.empty
          ? 'Baum leer — kein erfundenes Cluster.'
          : `Tiefe bis ${Math.max(...graph.nodes.map((n) => n.depth))} · Token-Cluster, kein Vektorindex.`}
      </p>
      <ul className="body-tree-root">{root ? <Row node={root} /> : null}</ul>
    </nav>
  )
}
