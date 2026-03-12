import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Form, Card, Badge, Button, ListGroup, Spinner } from 'react-bootstrap'
import { loadAllData, getPlayerIndex } from '../services/nflApi.js'
import useSessionState from '../hooks/useSessionState.js'
import PlayerCard from '../components/PlayerCard.jsx'

const FLEX_ELIGIBLE = new Set(['RB', 'WR', 'TE'])
const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K']
const EMPTY_TEAM = { QB: [], RB: [], WR: [], TE: [], FLEX: [], K: [] }
const DEFAULT_ROSTER = { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 1 }

function fuzzyScore(name, query) {
  const n = name.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return 0
  if (n === q) return 1000
  if (n.startsWith(q)) return 900
  if (n.includes(q)) return 800
  let score = 700
  let ni = 0
  for (const ch of q) {
    const idx = n.indexOf(ch, ni)
    if (idx === -1) return 0
    score -= (idx - ni)
    ni = idx + 1
  }
  return score
}

export default function BuildTeamPage() {
  const [query, setQuery] = useState('')
  const [filterPosition, setFilterPosition] = useState('ALL')
  const [filterTeam, setFilterTeam] = useState('ALL')
  const [dataReady, setDataReady] = useState(() => getPlayerIndex() !== null)
  const navigate = useNavigate()
  const [roster] = useSessionState('rosterFormat', DEFAULT_ROSTER)
  const [draftedTeam, setDraftedTeam] = useSessionState('draftedTeam', EMPTY_TEAM)

  useEffect(() => {
    if (dataReady) return
    loadAllData().then(() => setDataReady(true)).catch(() => {})
  }, [dataReady])

  const playerList = useMemo(() => {
    if (!dataReady) return []
    return Array.from(getPlayerIndex().values())
  }, [dataReady])

  const teamOptions = useMemo(() => {
    const teams = [...new Set(playerList.map(p => p.team))].sort()
    return teams
  }, [playerList])

  const allDraftedIDs = useMemo(
    () => new Set(Object.values(draftedTeam).flat()),
    [draftedTeam]
  )

  const searchResults = useMemo(() => {
    const hasQuery = query.trim().length >= 2
    const hasFilter = filterPosition !== 'ALL' || filterTeam !== 'ALL'
    if (!hasQuery && !hasFilter) return []

    let results = playerList
    if (filterPosition !== 'ALL') results = results.filter(p => p.position === filterPosition)
    if (filterTeam !== 'ALL') results = results.filter(p => p.team === filterTeam)

    if (hasQuery) {
      results = results
        .map(p => ({ player: p, score: fuzzyScore(p.name, query) }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
        .map(r => r.player)
    } else {
      results = results.slice(0, 15)
    }
    return results
  }, [query, filterPosition, filterTeam, playerList])

  function getSlotForPlayer(player) {
    const { position } = player
    const posCount = (draftedTeam[position] ?? []).length
    const posMax = roster[position] ?? 0
    if (posCount < posMax) return position
    if (FLEX_ELIGIBLE.has(position)) {
      const flexCount = (draftedTeam.FLEX ?? []).length
      const flexMax = roster.FLEX ?? 0
      if (flexCount < flexMax) return 'FLEX'
    }
    return null
  }

  function handleAdd(player) {
    const slot = getSlotForPlayer(player)
    if (!slot) return
    setDraftedTeam(prev => ({ ...prev, [slot]: [...(prev[slot] ?? []), player.playerID] }))
  }

  function handleRemove(playerID, slot) {
    setDraftedTeam(prev => ({ ...prev, [slot]: prev[slot].filter(id => id !== playerID) }))
  }

  if (!dataReady) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading player data…</p>
      </Container>
    )
  }

  const index = getPlayerIndex()

  return (
    <Container className="py-4">
      <Row className="g-4">

        {/* ── Search Panel ── */}
        <Col xs={12} md={7}>
          <h5 className="fw-bold mb-3">Search Players</h5>
          <Row className="g-2 mb-3">
            <Col xs={12} sm={5}>
              <div className="position-relative">
                <Form.Control
                  type="search"
                  placeholder="Player name…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ paddingRight: query ? '2.2rem' : undefined }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    style={{
                      position: 'absolute', right: '0.5rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#6c757d', fontSize: '1rem', lineHeight: 1, padding: 0
                    }}
                  >✕</button>
                )}
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <Form.Select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
                <option value="ALL">All Positions</option>
                {['QB','RB','WR','TE','K'].map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} sm={4}>
              <Form.Select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
                <option value="ALL">All Teams</option>
                {teamOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          {searchResults.length === 0 && (query.trim().length >= 2 || filterPosition !== 'ALL' || filterTeam !== 'ALL') && (
            <p className="text-muted">No players found.</p>
          )}
          <div className="d-flex flex-column gap-2">
            {searchResults.map(player => {
              const alreadyAdded = allDraftedIDs.has(player.playerID)
              const slotAvailable = getSlotForPlayer(player) !== null
              return (
                <PlayerCard
                  key={player.playerID}
                  player={player}
                  actionLabel={alreadyAdded ? 'Added' : 'Add'}
                  actionDisabled={alreadyAdded || !slotAvailable}
                  onAction={() => handleAdd(player)}
                />
              )
            })}
          </div>
        </Col>

        {/* ── My Team Panel ── */}
        <Col xs={12} md={5}>
          <h5 className="fw-bold mb-3">My Team</h5>
          {POSITION_ORDER.filter(pos => (roster[pos] ?? 0) > 0).map(pos => {
            const slots = roster[pos]
            const filled = draftedTeam[pos] ?? []
            return (
              <Card key={pos} className="mb-2 shadow-sm">
                <Card.Header className="py-1 px-3 d-flex justify-content-between align-items-center bg-light">
                  <span className="fw-semibold">{pos}</span>
                  <Badge bg={filled.length === slots ? 'success' : 'secondary'}>
                    {filled.length}/{slots}
                  </Badge>
                </Card.Header>
                <ListGroup variant="flush">
                  {filled.map(pid => {
                    const p = index.get(pid)
                    return p ? (
                      <ListGroup.Item
                        key={pid}
                        className="py-2 px-3 d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <span className="fw-semibold">{p.name}</span>
                          <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>
                            {p.team} · #{p.number}
                          </span>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemove(pid, pos)}
                        >✕</Button>
                      </ListGroup.Item>
                    ) : null
                  })}
                  {Array.from({ length: slots - filled.length }).map((_, i) => (
                    <ListGroup.Item
                      key={`empty-${i}`}
                      className="py-2 px-3 text-muted fst-italic"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Empty slot
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )
          })}
          <Button
            variant="success"
            className="w-100 mt-2"
            onClick={() => navigate('/analyze')}
          >Analyze My Team →</Button>
        </Col>

      </Row>
    </Container>
  )
}

