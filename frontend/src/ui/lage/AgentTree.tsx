import { useEffect, useState } from 'react'
import { childrenOf, type AgentGraph, type AgentTreeNode } from '../../engine/agent-graph.ts'

export function AgentTree({
  graph,
  onPrompt,
}: {
  graph: AgentGraph
  onPrompt: (text: string) => void
}) {
  const root = graph.nodes.find((n) => n.parent === null)
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(graph.nodes.filter((n) => n.depth <= 1).map((n) => [n.id, true])),
  )
  const nodeSig = graph.nodes.map((n) => n.id).join('\0')
  useEffect(() => {
    setOpen(Object.fromEntries(graph.nodes.filter((n) => n.depth <= 1).map((n) => [n.id, true])))
    // graph.nodes ist jedes Render ein neues Array — nodeSig (Ids) reicht, sonst klappt der Baum zu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.selectedDept, graph.activeId, nodeSig])

  function toggle(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }))
  }

  function Row({ node }: { node: AgentTreeNode }) {
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
            <strong>{node.label}</strong>
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
    <nav className="body-tree agent-tree" aria-label="Agenten-Baum">
      <p className="lage-hint">
        {graph.empty
          ? 'Keine Agenten geladen.'
          : graph.busy && graph.activeId
            ? `Aktiv: ${graph.activeId}`
            : 'Alle Agenten. Nur laufende leuchten.'}
      </p>
      <ul className="body-tree-root">{root ? <Row node={root} /> : null}</ul>
    </nav>
  )
}
