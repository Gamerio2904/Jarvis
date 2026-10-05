import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { prefersReducedMotion } from '../engine/motion.ts'
import { searchOffProducts, type OffProductHit } from '../engine/shopping-off.ts'
import {
  createShoppingList,
  deleteShoppingItem,
  listShopping,
  listShoppingLists,
  markShoppingGotById,
  addShopping,
  type ShoppingItem,
  type ShoppingList,
} from '../engine/store.ts'

const SWIPE_PX = 72

function ShopItemRow({
  item,
  reduced,
  onGot,
  onDelete,
}: {
  item: ShoppingItem
  reduced: boolean
  onGot: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [dx, setDx] = useState(0)
  const startX = useRef(0)
  const dragging = useRef(false)
  const got = item.status !== 'open'

  const onDown = (e: PointerEvent<HTMLElement>) => {
    if (reduced || got) return
    dragging.current = true
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return
    setDx(e.clientX - startX.current)
  }
  const onUp = (e: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return
    dragging.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* */
    }
    const d = dx
    setDx(0)
    if (d <= -SWIPE_PX) onGot(item.id)
    else if (d >= SWIPE_PX) onDelete(item.id)
  }

  return (
    <article
      className={`shop-card workbench-card${got ? ' is-got' : ''}`}
      style={dx ? { transform: `translateX(${dx}px)` } : undefined}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="shop-card-main">
        <div className="shop-card-thumb">
          {item.image_url ? (
            <img src={item.image_url} alt="" />
          ) : (
            <span className="shop-card-thumb-empty" aria-hidden />
          )}
        </div>
        <div className="shop-card-body">
          <h3>{item.title}</h3>
          {item.price_text ? <p className="shop-card-price">{item.price_text}</p> : null}
          {!got && reduced ? (
            <div className="shop-card-actions">
              <button type="button" className="ghost-btn" onClick={() => onGot(item.id)}>
                Erledigt
              </button>
              <button type="button" className="ghost-btn" onClick={() => onDelete(item.id)}>
                Löschen
              </button>
            </div>
          ) : (
            <p className="shop-card-hint">{got ? 'Erledigt' : 'Links abhaken · Rechts löschen'}</p>
          )}
        </div>
      </div>
    </article>
  )
}

export function ShoppingListsOverlay({
  onClose,
  leaving = false,
}: {
  onClose: () => void
  leaving?: boolean
}) {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggest, setSuggest] = useState<OffProductHit[]>([])
  const [newListName, setNewListName] = useState('')
  const reduced = prefersReducedMotion()
  const debRef = useRef(0)

  const refresh = useCallback(async () => {
    const [ls, all] = await Promise.all([listShoppingLists(), listShopping()])
    setLists(ls)
    setItems(all)
  }, [])

  useEffect(() => {
    void refresh()
    const on = () => void refresh()
    window.addEventListener('jarvis-shopping', on)
    return () => window.removeEventListener('jarvis-shopping', on)
  }, [refresh])

  useEffect(() => {
    if (!addOpen) {
      setQuery('')
      setSuggest([])
      return
    }
    const q = query.trim()
    if (q.length < 2) {
      setSuggest([])
      return
    }
    window.clearTimeout(debRef.current)
    debRef.current = window.setTimeout(() => {
      void searchOffProducts(q, 6).then(setSuggest)
    }, 300)
    return () => window.clearTimeout(debRef.current)
  }, [query, addOpen])

  const detail = lists.find((l) => l.id === detailId) || null
  const detailItems = detail ? items.filter((i) => i.list_id === detail.id) : []

  async function pickHit(hit: OffProductHit) {
    if (!detail) return
    await addShopping(hit.title, {
      listId: detail.id,
      image_url: hit.image_url,
      product_ref: hit.product_ref,
    })
    setAddOpen(false)
    setQuery('')
  }

  async function addFreeText() {
    const t = query.trim()
    if (!t || !detail) return
    await addShopping(t, { listId: detail.id })
    setAddOpen(false)
    setQuery('')
  }

  async function createList() {
    const name = newListName.trim()
    if (!name) return
    const row = await createShoppingList(name)
    setNewListName('')
    if (row) setDetailId(row.id)
  }

  function openCount(listId: string): number {
    return items.filter((i) => i.list_id === listId && i.status === 'open').length
  }

  return (
    <div className={`watch-overlay shop-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      {!detail ? (
        <>
          <header className="watch-head">
            <div>
              <h2>Einkaufslisten</h2>
              <p>Tipp auf eine Liste · Fertig schließt</p>
            </div>
            <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>
              Fertig
            </button>
          </header>
          <div className="shop-list-grid">
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                className="shop-list-card workbench-card"
                onClick={() => setDetailId(l.id)}
              >
                <h3>{l.name}</h3>
                <p>{openCount(l.id) ? `${openCount(l.id)} offen` : 'Leer'}</p>
              </button>
            ))}
          </div>
          <div className="shop-new-list">
            <input
              type="text"
              placeholder="Neue Liste"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void createList()
              }}
            />
            <button type="button" className="ghost-btn" onClick={() => void createList()}>
              Anlegen
            </button>
          </div>
        </>
      ) : (
        <>
          <header className="watch-head">
            <div>
              <button type="button" className="ghost-btn shop-back" onClick={() => setDetailId(null)}>
                ← Listen
              </button>
              <h2>{detail.name}</h2>
              <p>Wischen = abhaken oder löschen</p>
            </div>
            <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>
              Fertig
            </button>
          </header>
          <div className="shop-items-scroll">
            {detailItems.length ? (
              detailItems.map((item) => (
                <ShopItemRow
                  key={item.id}
                  item={item}
                  reduced={reduced}
                  onGot={(id) => void markShoppingGotById(id).then(refresh)}
                  onDelete={(id) => void deleteShoppingItem(id).then(refresh)}
                />
              ))
            ) : (
              <p className="watch-empty">Noch nichts auf dieser Liste.</p>
            )}
          </div>
          <button
            type="button"
            className="shop-fab cal-fab"
            aria-label="Produkt hinzufügen"
            onClick={() => setAddOpen(true)}
          >
            +
          </button>
        </>
      )}
      {addOpen && detail ? (
        <div className="shop-add-sheet fx-in" role="dialog" aria-label="Hinzufügen">
          <header className="watch-head">
            <h2>Hinzufügen</h2>
            <button type="button" className="ghost-btn" onClick={() => setAddOpen(false)}>
              Zu
            </button>
          </header>
          <input
            className="shop-add-input"
            type="search"
            placeholder="Name oder Lebensmittel suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="shop-suggest">
            {query.trim().length >= 2 ? (
              <li>
                <button type="button" className="shop-suggest-row" onClick={() => void addFreeText()}>
                  Freitext: „{query.trim()}“ übernehmen
                </button>
              </li>
            ) : null}
            {suggest.map((hit) => (
              <li key={`${hit.product_ref || hit.title}`}>
                <button type="button" className="shop-suggest-row" onClick={() => void pickHit(hit)}>
                  {hit.image_url ? <img src={hit.image_url} alt="" /> : null}
                  <span>{hit.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
