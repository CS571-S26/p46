import { useState, useEffect, useMemo } from 'react'
import { Container, Row, Col, Card, Badge, Button, Form, Spinner, ListGroup } from 'react-bootstrap'
import { loadAllData, getPlayerIndex } from '../services/nflApi.js'
import PlayerStatsModal from '../components/PlayerStatsModal.jsx'

const MAX_SLOTS = 5
const MIN_SLOTS = 3

const POSITION_COLORS = {
  QB: 'danger', RB: 'success', WR: 'primary', TE: 'warning', K: 'secondary',
}

function fuzzyScore(name, query) {
  const n = name.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return 0
  if (n === q) return 1000
  if (n.startsWith(q)) return 900
  if (n.includes(q)) return 800
  let score = 700, ni = 0
  for (const ch of q) {
    const idx = n.indexOf(ch, ni)
    if (idx === -1) return 0
    score -= (idx - ni)
    ni = idx + 1
  }
  return score
}

function ScoreDisplay({ label, value }) {
  if (value == null) return null
  const positive = value >= 0
  const color = positive ? '#198754' : '#dc3545'
  return (
    <div className="text-center py-3">
      <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{label}</div>
      <div className="fw-bold" style={{ fontSize: '2rem', color }}>
        {positive ? '+' : ''}{value.toFixed(1)}
      </div>
      <div style={{ fontSize: '0.75rem', color }}>
        {positive ? 'You win this trade' : 'You lose this trade'}
      </div>
    </div>
  )
}

function PlayerSlot({ player, onRemove }) {
  const [showModal, setShowModal] = useState(false)
  if (!player) {
    return (
      <div
        className="rounded border d-flex align-items-center justify-content-center text-muted fst-italic"
        style={{ height: '2.6rem', fontSize: '0.82rem', borderStyle: 'dashed' }}
      >
        Empty slot
      </div>
    )
  }
  return (
    <>
      <div
        className="d-flex align-items-center justify-content-between rounded border px-2 py-1 bg-white shadow-sm clickable-card"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        aria-label={`${player.name}, ${player.position}, ${player.team} — view stats`}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowModal(true)}
      >
        <div className="d-flex align-items-center gap-2">
          <Badge bg={POSITION_COLORS[player.position] ?? 'secondary'}>{player.position}</Badge>
          <span className="fw-semibold" style={{ fontSize: '0.88rem' }}>{player.name}</span>
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>{player.team}</span>
        </div>
        <Button
          variant="outline-danger"
          size="sm"
          style={{ padding: '0 0.4rem', lineHeight: '1.4' }}
          aria-label={`Remove ${player.name}`}
          onClick={e => { e.stopPropagation(); onRemove() }}
        >✕</Button>
      </div>
      <PlayerStatsModal player={player} show={showModal} onHide={() => setShowModal(false)} />
    </>
  )
}

function PlayerSearch({ onSelect, excludeIDs, label }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const index = getPlayerIndex()

  const results = useMemo(() => {
    if (!index || query.trim().length < 2) return []
    return Array.from(index.values())
      .map(p => ({ player: p, score: fuzzyScore(p.name, query) }))
      .filter(r => r.score > 0 && !excludeIDs.has(r.player.playerID))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => r.player)
  }, [query, excludeIDs, index])

  function handleSelect(player) {
    onSelect(player)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="position-relative mb-2">
      <Form.Control
        size="sm"
        type="search"
        placeholder={`Search to add to ${label}…`}
        aria-label={`Search players for ${label}`}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => query.length >= 2 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <ListGroup
          className="position-absolute w-100 shadow-sm"
          style={{ zIndex: 1000, top: '100%' }}
        >
          {results.map(p => (
            <ListGroup.Item
              key={p.playerID}
              action
              className="py-1 px-2"
              style={{ fontSize: '0.85rem', cursor: 'pointer' }}
              onClick={() => handleSelect(p)}
            >
              <Badge bg={POSITION_COLORS[p.position] ?? 'secondary'} className="me-2">{p.position}</Badge>
              <span className="fw-semibold">{p.name}</span>
              <span className="text-muted ms-2">{p.team}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  )
}

function TradeSide({ label, players, slots, onAdd, onRemove, onAddSlot, onRemoveSlot, excludeIDs, borderColor, headerClass }) {
  return (
    <Card className="shadow-sm" style={{ border: `2px solid ${borderColor}` }}>
      <Card.Header className={`${headerClass} text-white py-2 px-3`}>
        <span className="fw-bold">{label}</span>
        <span className="ms-2 opacity-75" style={{ fontSize: '0.82rem' }}>
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
      </Card.Header>
      <Card.Body className="px-3 py-2">
        <div className="d-flex flex-column gap-2 mb-2">
          {Array.from({ length: slots }).map((_, i) => (
            <PlayerSlot key={i} player={players[i] ?? null} onRemove={() => onRemove(i)} />
          ))}
        </div>
        <PlayerSearch onSelect={onAdd} excludeIDs={excludeIDs} label={label} />
        <div className="d-flex gap-2 mt-1">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={slots >= MAX_SLOTS}
            onClick={onAddSlot}
          >+ Add Slot</Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={slots <= MIN_SLOTS}
            onClick={onRemoveSlot}
          >− Remove Slot</Button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default function TradePage() {
  const [dataReady, setDataReady] = useState(() => getPlayerIndex() !== null)
  const [sideA, setSideA] = useState([])
  const [sideB, setSideB] = useState([])
  const [slotsA, setSlotsA] = useState(MIN_SLOTS)
  const [slotsB, setSlotsB] = useState(MIN_SLOTS)

  useEffect(() => {
    if (dataReady) return
    loadAllData().then(() => setDataReady(true)).catch(() => {})
  }, [dataReady])

  const allSelectedIDs = useMemo(
    () => new Set([...sideA, ...sideB].map(p => p.playerID)),
    [sideA, sideB]
  )

  function addToSide(setSide, slots, player) {
    setSide(prev => prev.length >= slots ? prev : [...prev, player])
  }

  function removeFromSide(setSide, index) {
    setSide(prev => prev.filter((_, i) => i !== index))
  }

  const scores = useMemo(() => {
    if (sideA.length === 0 && sideB.length === 0) return null
    const sumProj   = list => list.reduce((acc, p) => acc + (p.projected?.fantasyPoints ?? 0), 0)
    const sumActual = list => list.reduce((acc, p) => acc + (p.actual?.fantasyPoints ?? 0), 0)
    return {
      projected: sumProj(sideB)   - sumProj(sideA),
      hindsight: sumActual(sideB) - sumActual(sideA),
    }
  }, [sideA, sideB])

  if (!dataReady) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading player data…</p>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <h1 className="h5 fw-bold mb-1">Trade Analyzer</h1>
      <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
        Add up to {MAX_SLOTS} players per side to evaluate a trade by projected value and hindsight performance.
      </p>
      <Row className="g-3 align-items-start">
        <Col xs={12} md={5}>
          <TradeSide
            label="Side A — You Give"
            players={sideA}
            slots={slotsA}
            onAdd={p => addToSide(setSideA, slotsA, p)}
            onRemove={i => removeFromSide(setSideA, i)}
            onAddSlot={() => setSlotsA(s => Math.min(MAX_SLOTS, s + 1))}
            onRemoveSlot={() => {
              setSideA(prev => prev.slice(0, slotsA - 1))
              setSlotsA(s => Math.max(MIN_SLOTS, s - 1))
            }}
            excludeIDs={allSelectedIDs}
            borderColor="#198754"
            headerClass="bg-success"
          />
        </Col>

        <Col xs={12} md={2} className="d-flex flex-column align-items-center justify-content-center py-3">
          <div className="fw-bold text-muted mb-3" style={{ fontSize: '1.2rem' }}>VS</div>
          {scores ? (
            <Card className="w-100 shadow-sm">
              <Card.Body className="py-1 px-2">
                <ScoreDisplay label="Projected Value (B − A)" value={scores.projected} />
                <hr className="my-1" />
                <ScoreDisplay label="Hindsight Score (B − A)" value={scores.hindsight} />
              </Card.Body>
            </Card>
          ) : (
            <p className="text-muted text-center" style={{ fontSize: '0.8rem' }}>Add players to see scores</p>
          )}
        </Col>

        <Col xs={12} md={5}>
          <TradeSide
            label="Side B — You Receive"
            players={sideB}
            slots={slotsB}
            onAdd={p => addToSide(setSideB, slotsB, p)}
            onRemove={i => removeFromSide(setSideB, i)}
            onAddSlot={() => setSlotsB(s => Math.min(MAX_SLOTS, s + 1))}
            onRemoveSlot={() => {
              setSideB(prev => prev.slice(0, slotsB - 1))
              setSlotsB(s => Math.max(MIN_SLOTS, s - 1))
            }}
            excludeIDs={allSelectedIDs}
            borderColor="#0d6efd"
            headerClass="bg-primary"
          />
        </Col>
      </Row>
    </Container>
  )
}
